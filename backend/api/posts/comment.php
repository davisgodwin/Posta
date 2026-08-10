<?php
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once '../../config/database.php';
require_once '../../config/session.php';

$userId = checkAuth();
$db = (new Database())->getConnection();

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $postId = $_GET['post_id'] ?? null;
    if (!$postId) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Post ID required"]);
        exit();
    }

    try {
        $stmt = $db->prepare("
            SELECT c.*, u.name, u.username, u.avatar 
            FROM post_comments c 
            JOIN users u ON c.user_id = u.id 
            WHERE c.post_id = :post_id 
            ORDER BY c.created_at ASC
        ");
        $stmt->execute(['post_id' => $postId]);
        $comments = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode(["success" => true, "comments" => $comments]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["success" => false, "message" => $e->getMessage()]);
    }
} elseif ($method === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    $postId = $data['post_id'] ?? null;
    $comment = trim($data['comment'] ?? '');

    if (!$postId || empty($comment)) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Post ID and comment text are required."]);
        exit();
    }

    try {
        // 1. Insert comment
        $stmt = $db->prepare("INSERT INTO post_comments (post_id, user_id, comment) VALUES (:post_id, :user_id, :comment)");
        $stmt->execute(['post_id' => $postId, 'user_id' => $userId, 'comment' => $comment]);

        // 2. Insert notification
        try {
            // Find post owner (checks user_id or author_id)
            $postStmt = $db->prepare("SELECT user_id FROM posts WHERE id = :id");
            $postStmt->execute(['id' => $postId]);
            $postOwnerId = $postStmt->fetchColumn();

            // If user_id wasn't found, check author_id fallback
            if (!$postOwnerId) {
                $altStmt = $db->prepare("SELECT author_id FROM posts WHERE id = :id");
                $altStmt->execute(['id' => $postId]);
                $postOwnerId = $altStmt->fetchColumn();
            }

            // Create notification (allows self-notifications for testing)
            if ($postOwnerId) {
                $notifStmt = $db->prepare("
                    INSERT INTO notifications (user_id, actor_id, post_id, type) 
                    VALUES (:user_id, :actor_id, :post_id, 'comment')
                ");
                $notifStmt->execute([
                    'user_id'  => $postOwnerId,
                    'actor_id' => $userId,
                    'post_id'  => $postId
                ]);
            }
        } catch (Exception $notifErr) {
            error_log("Notification error: " . $notifErr->getMessage());
        }

        echo json_encode(["success" => true, "message" => "Comment added successfully."]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["success" => false, "message" => $e->getMessage()]);
    }
}