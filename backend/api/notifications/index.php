<?php
if (ob_get_length()) ob_clean();

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Credentials: true");

require_once '../../config/database.php';
require_once '../../config/session.php';

try {
    $userId = checkAuth();
    if (is_array($userId)) {
        $userId = $userId['id'];
    }

    if (!$userId) {
        http_response_code(401);
        echo json_encode(["success" => false, "message" => "Missing session token credentials."]);
        exit();
    }

    $db = (new Database())->getConnection();
    $method = $_SERVER['REQUEST_METHOD'];

    if ($method === 'GET') {
        $stmt = $db->prepare("
            SELECT 
                n.id, n.type, n.is_read, n.created_at, n.letter_id,
                u.username AS actor_name,
                u.avatar AS raw_avatar
            FROM notifications n
            JOIN users u ON n.actor_id = u.id
            WHERE n.user_id = :user_id
            ORDER BY n.created_at DESC LIMIT 30
        ");
        $stmt->execute(['user_id' => $userId]);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $notifications = [];
        foreach ($rows as $row) {
            // Process fallback asset paths absolute mappings
            $avatarUrl = null;
            if (!empty($row['raw_avatar'])) {
                $avatarUrl = strpos($row['raw_avatar'], 'http') === 0 
                    ? $row['raw_avatar'] 
                    : "http://localhost/posta/backend/" . ltrim($row['raw_avatar'], '/');
            } else {
                $avatarUrl = "http://localhost/posta/backend/uploads/default.png";
            }

            $notifications[] = [
                "id" => $row['id'],
                "type" => $row['type'],
                "is_read" => (int)$row['is_read'],
                "created_at" => $row['created_at'],
                "letter_id" => $row['letter_id'],
                "actor_name" => $row['actor_name'],
                "actor_avatar" => $avatarUrl
            ];
        }

        echo json_encode(["success" => true, "notifications" => $notifications]);
        exit();
    }

    if ($method === 'POST') {
        $stmt = $db->prepare("UPDATE notifications SET is_read = 1 WHERE user_id = :user_id AND is_read = 0");
        $stmt->execute(['user_id' => $userId]);
        echo json_encode(["success" => true, "message" => "Notifications cleared."]);
        exit();
    }

    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Method Not Allowed"]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Database exception engine error.", "debug_error" => $e->getMessage()]);
}
