<?php
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once '../../config/database.php';
require_once '../../config/session.php';

$userId = null;
if (function_exists('checkAuth')) {
    try {
        $userId = checkAuth();
    } catch (Exception $e) {
        $userId = null;
    }
}

$username = $_GET['username'] ?? '';

if (empty($username)) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Username is required"]);
    exit;
}

try {
    $db = (new Database())->getConnection();

    // 1. Fetch user profile
    $userStmt = $db->prepare("SELECT id, name, username, bio, avatar, created_at FROM users WHERE username = :username OR email = :email");
    $userStmt->execute([
        'username' => $username,
        'email'    => $username
    ]);
    $profileUser = $userStmt->fetch(PDO::FETCH_ASSOC);

    if (!$profileUser) {
        http_response_code(404);
        echo json_encode(["success" => false, "message" => "User not found"]);
        exit;
    }

    $targetUserId = $profileUser['id'];

    // 2. Query posts matching index.php exactly
    $postsStmt = $db->prepare("
        SELECT 
            p.id,
            p.user_id,
            p.post_type,
            p.unlock_at,
            p.created_at,
            CASE 
                WHEN p.post_type = 'time_capsule' AND p.unlock_at > NOW() AND p.user_id != :auth_user1 THEN NULL 
                ELSE p.content 
            END AS content,
            CASE 
                WHEN p.post_type = 'time_capsule' AND p.unlock_at > NOW() AND p.user_id != :auth_user2 THEN NULL 
                ELSE p.media_url 
            END AS media_url,
            CASE 
                WHEN p.post_type = 'time_capsule' AND p.unlock_at > NOW() AND p.user_id != :auth_user3 THEN NULL 
                ELSE p.media_type 
            END AS media_type,
            u.name, 
            u.username, 
            u.avatar,
            (SELECT COUNT(*) FROM post_likes WHERE post_id = p.id) AS likes_count,
            (SELECT COUNT(*) FROM post_comments WHERE post_id = p.id) AS comments_count,
            EXISTS(SELECT 1 FROM post_likes WHERE post_id = p.id AND user_id = :auth_user4) AS user_liked
        FROM posts p 
        JOIN users u ON p.user_id = u.id 
        WHERE p.user_id = :target_user
        ORDER BY p.created_at DESC
    ");

    $postsStmt->execute([
        'auth_user1'  => $userId,
        'auth_user2'  => $userId,
        'auth_user3'  => $userId,
        'auth_user4'  => $userId,
        'target_user' => $targetUserId
    ]);

    $rawPosts = $postsStmt->fetchAll(PDO::FETCH_ASSOC);

    // Explicitly format numbers so frontend receives integers
    $posts = array_map(function($post) {
        $post['likes_count'] = (int)($post['likes_count'] ?? 0);
        $post['comments_count'] = (int)($post['comments_count'] ?? 0);
        $post['user_liked'] = (bool)($post['user_liked'] ?? false);
        return $post;
    }, $rawPosts);

    echo json_encode([
        "success" => true,
        "user"    => $profileUser,
        "posts"   => $posts
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
}