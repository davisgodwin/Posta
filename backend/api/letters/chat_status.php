<?php
if (ob_get_length()) ob_clean();

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Credentials: true");

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
        echo json_encode(["success" => false, "message" => "Unauthorized."]);
        exit();
    }

    $db = (new Database())->getConnection();
    $method = $_SERVER['REQUEST_METHOD'];

    // --- GET: Check for new replies & active typing indicator ---
    if ($method === 'GET') {
        $letterId = filter_input(INPUT_GET, 'letter_id', FILTER_VALIDATE_INT);
        $lastReplyId = filter_input(INPUT_GET, 'last_reply_id', FILTER_VALIDATE_INT) ?: 0;

        if (!$letterId) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "Valid letter ID required."]);
            exit();
        }

        // 1. Fetch any new messages created after $lastReplyId
        $stmtNew = $db->prepare("
            SELECT r.id, r.message, r.created_at, r.sender_id, u.username AS sender_name, u.avatar AS raw_avatar
            FROM letter_replies r
            JOIN users u ON r.sender_id = u.id
            WHERE r.letter_id = :letter_id AND r.id > :last_reply_id
            ORDER BY r.created_at ASC
        ");
        $stmtNew->execute([
            'letter_id' => $letterId,
            'last_reply_id' => $lastReplyId
        ]);
        $rows = $stmtNew->fetchAll(PDO::FETCH_ASSOC);

        $newReplies = [];
        foreach ($rows as $row) {
            $avatarUrl = !empty($row['raw_avatar'])
                ? (strpos($row['raw_avatar'], 'http') === 0 ? $row['raw_avatar'] : "http://localhost/posta/backend/" . ltrim($row['raw_avatar'], '/'))
                : "http://localhost/posta/backend/defaults/avatar.png";

            $newReplies[] = [
                "id" => (int)$row['id'],
                "message" => $row['message'],
                "created_at" => $row['created_at'],
                "sender_id" => (int)$row['sender_id'],
                "sender_name" => $row['sender_name'],
                "sender_avatar" => $avatarUrl
            ];
        }

        // 2. Check if the OTHER participant is currently typing (within the last 4 seconds)
        $stmtTyping = $db->prepare("
            SELECT user_id 
            FROM chat_typing 
            WHERE letter_id = :letter_id 
              AND user_id != :user_id 
              AND updated_at >= (NOW() - INTERVAL 4 SECOND)
            LIMIT 1
        ");
        $stmtTyping->execute([
            'letter_id' => $letterId,
            'user_id' => $userId
        ]);
        $isTyping = (bool)$stmtTyping->fetchColumn();

        echo json_encode([
            "success" => true,
            "new_replies" => $newReplies,
            "is_typing" => $isTyping
        ]);
        exit();
    }

    // --- POST: Send Heartbeat signal when current user is typing ---
    if ($method === 'POST') {
        $data = json_decode(file_get_contents("php://input"), true);
        $letterId = isset($data['letter_id']) ? (int)$data['letter_id'] : 0;

        if (!$letterId) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "Letter ID required."]);
            exit();
        }

        $stmt = $db->prepare("
            INSERT INTO chat_typing (letter_id, user_id, updated_at) 
            VALUES (:letter_id, :user_id, NOW()) 
            ON DUPLICATE KEY UPDATE updated_at = NOW()
        ");
        $stmt->execute([
            'letter_id' => $letterId,
            'user_id' => $userId
        ]);

        echo json_encode(["success" => true]);
        exit();
    }

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Server error."]);
}