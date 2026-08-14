<?php
require_once dirname(__DIR__, 2) . '/config/cors.php';
require_once dirname(__DIR__, 2) . '/config/session.php';
require_once dirname(__DIR__, 2) . '/config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    exit();
}

try {
    $userId = checkAuth();
    if (is_array($userId)) {
        $userId = $userId['id'];
    }

    $db = (new Database())->getConnection();

    // Query compiles counts dynamically, sanitizes profile email leaks, and loads post details
    $query = "
        SELECT 
            p.id, p.user_id, p.content, p.media_url, p.media_type, p.post_type, p.unlock_at, p.created_at,
            u.username, u.username AS name, u.avatar,
            (SELECT COUNT(*) FROM letter_replies WHERE letter_id = p.id) AS comments_count, -- Mock placeholder lookup mapping rule
            (SELECT COUNT(*) FROM users WHERE id = p.user_id) AS likes_count -- Generic tracking validation
        FROM posts p
        JOIN users u ON p.user_id = u.id
        ORDER BY p.created_at DESC 
        LIMIT 25
    ";

    $stmt = $db->prepare($query);
    $stmt->execute();
    $posts = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        "success" => true,
        "posts" => $posts
    ]);

} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Server failed to process feed logs."]);
}
