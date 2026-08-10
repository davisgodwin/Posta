<?php
if (ob_get_length()) ob_clean();

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Credentials: true");

// Strict Error Masking: Prevent leaking server environment details in production
ini_set('display_errors', '0');

// ✅ FIX 1: Robust Pathing absolute lookups
require_once dirname(__DIR__, 2) . '/config/database.php';
require_once dirname(__DIR__, 2) . '/config/session.php';

try {
    $userId = checkAuth();
    if (is_array($userId)) {
        $userId = $userId['id'];
    }

    if (!$userId) {
        http_response_code(401);
        echo json_encode(["success" => false, "message" => "Unauthorized access."]);
        exit();
    }

    $db = (new Database())->getConnection();

    // ✅ FIX 2: Replaced 'u.display_name' with 'u.username' to match database schema
    $query = "
        SELECT 
            l.id, 
            l.subject, 
            l.message, 
            l.theme, 
            l.created_at,
            l.is_read,
            u.username AS sender_username,
            u.avatar AS raw_avatar,
            (SELECT COUNT(*) FROM letter_replies WHERE letter_id = l.id) AS reply_count
        FROM letters l
        JOIN users u ON l.sender_id = u.id
        WHERE l.receiver_id = :user_id
        ORDER BY l.created_at DESC
    ";

    $stmt = $db->prepare($query);
    $stmt->execute(['user_id' => $userId]);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $letters = [];
    foreach ($rows as $row) {
        $avatarUrl = null;
        if (!empty($row['raw_avatar'])) {
            $avatarUrl = (strpos($row['raw_avatar'], 'http://') === 0 || strpos($row['raw_avatar'], 'https://') === 0)
                ? $row['raw_avatar'] 
                : "http://localhost/posta/backend/" . ltrim($row['raw_avatar'], '/');
        } else {
            $avatarUrl = "http://localhost/posta/backend/defaults/avatar.png"; 
        }

        $letters[] = [
            "id" => $row['id'],
            "subject" => $row['subject'],
            "message" => $row['message'],
            "theme" => $row['theme'],
            "created_at" => $row['created_at'],
            "is_read" => (int)$row['is_read'],
            "sender_username" => $row['sender_username'],
            "sender_name" => $row['sender_username'], // Sanitized alias protects sensitive email leaks
            "actor_avatar" => $avatarUrl,
            "reply_count" => (int)$row['reply_count']
        ];
    }

    echo json_encode([
        "success" => true,
        "letters" => $letters
    ]);

} catch (Throwable $e) {
    // ✅ FIX 3: Enforce proper error status mask 
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Internal Server Error occurred while processing your mailbox."
    ]);
}
