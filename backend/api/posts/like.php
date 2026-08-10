<?php
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once '../../config/database.php';
require_once '../../config/session.php';

$userId = checkAuth();
$db = (new Database())->getConnection();

$data = json_decode(file_get_contents("php://input"), true);
$postId = $data['post_id'] ?? null;

if (!$postId) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Post ID is required."]);
    exit();
}

try {
    // Find post owner
    $postStmt = $db->prepare("SELECT user_id FROM posts WHERE id = :id");
    $postStmt->execute(['id' => $postId]);
    $postOwnerId = $postStmt->fetchColumn();

    // Check if user already liked
    $checkStmt = $db->prepare("SELECT id FROM post_likes WHERE post_id = :post_id AND user_id = :user_id");
    $checkStmt->execute(['post_id' => $postId, 'user_id' => $userId]);
    $existingLike = $checkStmt->fetch();

    if ($existingLike) {
        // Unlike post
        $deleteStmt = $db->prepare("DELETE FROM post_likes WHERE post_id = :post_id AND user_id = :user_id");
        $deleteStmt->execute(['post_id' => $postId, 'user_id' => $userId]);

        // Remove notification
        if ($postOwnerId && $postOwnerId != $userId) {
            $notifDelete = $db->prepare("DELETE FROM notifications WHERE post_id = :post_id AND actor_id = :actor_id AND type = 'like'");
            $notifDelete->execute(['post_id' => $postId, 'actor_id' => $userId]);
        }

        echo json_encode(["success" => true, "liked" => false]);
    } else {
        // Like post
        $insertStmt = $db->prepare("INSERT INTO post_likes (post_id, user_id) VALUES (:post_id, :user_id)");
        $insertStmt->execute(['post_id' => $postId, 'user_id' => $userId]);

        // Create notification for post owner
        if ($postOwnerId && $postOwnerId != $userId) {
            $notifStmt = $db->prepare("INSERT INTO notifications (user_id, actor_id, post_id, type) VALUES (:user_id, :actor_id, :post_id, 'like')");
            $notifStmt->execute([
                'user_id'  => $postOwnerId,
                'actor_id' => $userId,
                'post_id'  => $postId
            ]);
        }

        echo json_encode(["success" => true, "liked" => true]);
    }
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
}