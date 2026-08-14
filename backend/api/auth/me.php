<?php
require_once dirname(__DIR__, 2) . '/config/cors.php'; 
require_once dirname(__DIR__, 2) . '/config/session.php';
require_once dirname(__DIR__, 2) . '/config/database.php';

header("Content-Type: application/json; charset=UTF-8");

$userId = checkAuth();
if (is_array($userId)) {
    $userId = $userId['id'] ?? null;
}

if (!$userId) {
    http_response_code(401);
    echo json_encode(["success" => false, "authenticated" => false, "message" => "Not logged in."]);
    exit();
}

try {
    $db = (new Database())->getConnection();
    $stmt = $db->prepare("SELECT id, name, username, email, avatar, cover_photo, bio, location, website, created_at FROM users WHERE id = :id LIMIT 1");
    $stmt->execute(['id' => $userId]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($user) {
        http_response_code(200);
        echo json_encode([
            "success" => true,
            "authenticated" => true,
            "user" => $user
        ]);
    } else {
        http_response_code(404);
        echo json_encode(["success" => false, "authenticated" => false, "message" => "User record not found."]);
    }
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "authenticated" => false,
        "message" => "Database query error: " . $e->getMessage()
    ]);
}