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

// Safely resolve user ID without throwing a 400 when unauthenticated
$userId = null;
if (function_exists('checkAuth')) {
    try {
        $userId = checkAuth();
    } catch (Exception $e) {
        $userId = null;
    }
}

$db = (new Database())->getConnection();

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    try {
        $stmt = $db->prepare("
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
            ORDER BY p.created_at DESC
        ");
        
        $stmt->execute([
            'auth_user1' => $userId,
            'auth_user2' => $userId,
            'auth_user3' => $userId,
            'auth_user4' => $userId
        ]);
        
        $posts = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode(["success" => true, "posts" => $posts]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["success" => false, "message" => $e->getMessage()]);
    }
} elseif ($method === 'POST') {
    if (!$userId) {
        http_response_code(401);
        echo json_encode(["success" => false, "message" => "Unauthorized"]);
        exit();
    }

    $content = trim($_POST['content'] ?? '');
    $type = $_POST['post_type'] ?? 'public';
    $unlockAt = !empty($_POST['unlock_at']) ? str_replace('T', ' ', $_POST['unlock_at']) . ':00' : null;

    if (empty($content) && !isset($_FILES['media'])) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Post content or media is required."]);
        exit();
    }

    $mediaUrl = null;
    $mediaType = null;

    if (isset($_FILES['media']) && $_FILES['media']['error'] === UPLOAD_ERR_OK) {
        $fileTmpPath = $_FILES['media']['tmp_name'];
        $fileName = $_FILES['media']['name'];
        $fileExtension = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));

        $imageTypes = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
        $videoTypes = ['mp4', 'webm', 'mov'];

        if (in_array($fileExtension, $imageTypes)) {
            $mediaType = 'image';
        } elseif (in_array($fileExtension, $videoTypes)) {
            $mediaType = 'video';
        } else {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "Unsupported file type."]);
            exit();
        }

        $uploadDir = '../../uploads/posts/';
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0777, true);
        }

        $newFileName = 'post_' . $userId . '_' . time() . '.' . $fileExtension;
        $destPath = $uploadDir . $newFileName;

        if (move_uploaded_file($fileTmpPath, $destPath)) {
            $mediaUrl = 'uploads/posts/' . $newFileName;
        }
    }

    try {
        $stmt = $db->prepare("
            INSERT INTO posts (user_id, content, post_type, unlock_at, media_url, media_type) 
            VALUES (:user_id, :content, :post_type, :unlock_at, :media_url, :media_type)
        ");
        $stmt->execute([
            'user_id'    => $userId,
            'content'    => $content,
            'post_type'  => $type,
            'unlock_at'  => $unlockAt,
            'media_url'  => $mediaUrl,
            'media_type' => $mediaType
        ]);

        echo json_encode(["success" => true, "message" => "Post created successfully!"]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["success" => false, "message" => $e->getMessage()]);
    }
}