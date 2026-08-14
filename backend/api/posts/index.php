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

    // Query dynamically counts likes and comments and checks if the authenticated user liked each post
    $query = "
        SELECT 
            p.id, p.user_id, p.content, p.media_url, p.media_type, p.post_type, p.unlock_at, p.created_at,
            u.username, u.name, u.avatar,
            (SELECT COUNT(*) FROM comments WHERE post_id = p.id) AS comments_count,
            (SELECT COUNT(*) FROM likes WHERE post_id = p.id) AS likes_count,
            EXISTS(
                SELECT 1 FROM likes WHERE post_id = p.id AND user_id = :current_user_id
            ) AS user_liked
        FROM posts p
        JOIN users u ON p.user_id = u.id
        ORDER BY p.created_at DESC 
        LIMIT 25
    ";

    $stmt = $db->prepare($query);
    $stmt->execute(['current_user_id' => $userId ?? 0]);
    $posts = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        "success" => true,
        "posts" => $posts
    ]);

} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false, 
        "message" => "Server failed to process feed logs.",
        "debug_error" => $e->getMessage()
    ]);
}