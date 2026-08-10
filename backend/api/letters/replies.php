<?php
if (ob_get_length()) ob_clean();

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Credentials: true");

// Suppress unhandled diagnostic strings from forcing a broken 200 OK header status
ini_set('display_errors', '0');

require_once '../../config/database.php';
require_once '../../config/session.php';

try {
    $userId = checkAuth();
    if (is_array($userId)) {
        $userId = $userId['id'];
    }

    if (!$userId) {
        http_response_code(401);
        echo json_encode(["success" => false, "message" => "Authentication required."]);
        exit();
    }

    $db = (new Database())->getConnection();
    $method = $_SERVER['REQUEST_METHOD'];

    // --- HANDLE GET: Fetch Paginated Chat Thread Messages ---
    if ($method === 'GET') {
        $letterId = filter_input(INPUT_GET, 'letter_id', FILTER_VALIDATE_INT);
        $limit = filter_input(INPUT_GET, 'limit', FILTER_VALIDATE_INT) ?: 15;
        $offset = filter_input(INPUT_GET, 'offset', FILTER_VALIDATE_INT) ?: 0;

        if (!$letterId) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "Valid letter identifier is required."]);
            exit();
        }

        // Verify user is an authorized participant before returning messages
        $stmtCheck = $db->prepare("SELECT sender_id, receiver_id FROM letters WHERE id = :letter_id");
        $stmtCheck->execute(['letter_id' => $letterId]);
        $letterContext = $stmtCheck->fetch(PDO::FETCH_ASSOC);

        if (!$letterContext || ($letterContext['sender_id'] != $userId && $letterContext['receiver_id'] != $userId)) {
            http_response_code(403);
            echo json_encode(["success" => false, "message" => "Access denied to this letter thread."]);
            exit();
        }

        // Fetch chunk ordered by created_at DESC (newest first for pagination calculation)
        $query = "
            SELECT 
                r.id, 
                r.message, 
                r.created_at, 
                r.sender_id,
                u.username AS sender_name,
                u.avatar AS raw_avatar
            FROM letter_replies r
            JOIN users u ON r.sender_id = u.id
            WHERE r.letter_id = :letter_id
            ORDER BY r.created_at DESC
            LIMIT :limit OFFSET :offset
        ";

        $stmt = $db->prepare($query);
        $stmt->bindValue(':letter_id', $letterId, PDO::PARAM_INT);
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Reverse back so older messages render first in chronological order on client
        $rows = array_reverse($rows);

        $replies = [];
        foreach ($rows as $row) {
            $avatarUrl = null;
            if (!empty($row['raw_avatar'])) {
                $avatarUrl = strpos($row['raw_avatar'], 'http') === 0 
                    ? $row['raw_avatar'] 
                    : "http://localhost/posta/backend/" . ltrim($row['raw_avatar'], '/');
            } else {
                $avatarUrl = "http://localhost/posta/backend/defaults/avatar.png";
            }

            $replies[] = [
                "id" => $row['id'],
                "message" => $row['message'],
                "created_at" => $row['created_at'],
                "sender_id" => (int)$row['sender_id'],
                "sender_name" => $row['sender_name'],
                "sender_avatar" => $avatarUrl
            ];
        }

        // Check total count to determine if more messages remain
        $countStmt = $db->prepare("SELECT COUNT(*) FROM letter_replies WHERE letter_id = :letter_id");
        $countStmt->execute(['letter_id' => $letterId]);
        $totalCount = (int)$countStmt->fetchColumn();

        $hasMore = ($offset + $limit) < $totalCount;

        echo json_encode([
            "success" => true,
            "replies" => $replies,
            "has_more" => $hasMore,
            "total" => $totalCount
        ]);
        exit();
    }

    // --- HANDLE POST: Submit New Chat Reply ---
    if ($method === 'POST') {
        $data = json_decode(file_get_contents("php://input"), true);
        
        $letterId = isset($data['letter_id']) ? (int)$data['letter_id'] : 0;
        $message = trim($data['message'] ?? '');

        if (!$letterId || empty($message)) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "Message contents and letter references required."]);
            exit();
        }

        // Verify user is authorized participant of this base letter thread
        $stmtCheck = $db->prepare("SELECT sender_id, receiver_id FROM letters WHERE id = :letter_id");
        $stmtCheck->execute(['letter_id' => $letterId]);
        $letterContext = $stmtCheck->fetch(PDO::FETCH_ASSOC);

        if (!$letterContext || ($letterContext['sender_id'] != $userId && $letterContext['receiver_id'] != $userId)) {
            http_response_code(403);
            echo json_encode(["success" => false, "message" => "Access denied to this letter thread."]);
            exit();
        }

        // Determine recipient actor ID for notifications table delivery tracking
        $recipientId = ($letterContext['sender_id'] == $userId) ? $letterContext['receiver_id'] : $letterContext['sender_id'];

        $db->beginTransaction();

        // 1. Save message to replies table
        $stmtInsert = $db->prepare("
            INSERT INTO letter_replies (letter_id, sender_id, message, created_at)
            VALUES (:letter_id, :sender_id, :message, NOW())
        ");
        $stmtInsert->execute([
            'letter_id' => $letterId,
            'sender_id' => $userId,
            'message'   => $message
        ]);

        // 2. Ping the recipient's notification activity feed drawer
        $stmtNotif = $db->prepare("
            INSERT INTO notifications (user_id, actor_id, letter_id, type, is_read, created_at)
            VALUES (:user_id, :actor_id, :letter_id, 'reply', 0, NOW())
        ");
        $stmtNotif->execute([
            'user_id'   => $recipientId,
            'actor_id'  => $userId,
            'letter_id' => $letterId
        ]);

        $db->commit();

        echo json_encode([
            "success" => true,
            "message" => "Reply delivered."
        ]);
        exit();
    }

    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Method Not Allowed"]);

} catch (PDOException $e) {
    if (isset($db) && $db->inTransaction()) {
        $db->rollBack();
    }
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Database operational crash encountered."
    ]);
}