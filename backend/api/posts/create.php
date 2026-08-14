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
    echo json_encode(["success" => false, "message" => "Session expired. Please log in again."]);
    exit();
}

// Fallback handling for both Multipart FormData and raw JSON
$content = $_POST['content'] ?? null;
if (!$content) {
    $rawInput = file_get_contents("php://input");
    $data = json_decode($rawInput, true);
    $content = trim($data['content'] ?? '');
}

if (empty($content)) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Post content cannot be empty."]);
    exit();
}

$mediaUrl = null;

// Handle Media File Upload
if (isset($_FILES['media']) && $_FILES['media']['error'] === UPLOAD_ERR_OK) {
    $uploadDir = dirname(__DIR__, 2) . '/uploads/';
    
    if (!file_exists($uploadDir)) {
        @mkdir($uploadDir, 0777, true);
    }

    $fileTmpPath = $_FILES['media']['tmp_name'];
    $fileName = $_FILES['media']['name'];
    $fileExtension = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));
    
    $allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'mp4', 'webm'];
    if (in_array($fileExtension, $allowedExtensions)) {
        $newFileName = time() . '_' . uniqid() . '.' . $fileExtension;
        $destPath = $uploadDir . $newFileName;

        if (move_uploaded_file($fileTmpPath, $destPath)) {
            $mediaUrl = 'uploads/' . $newFileName;
        }
    }
}

try {
    $db = (new Database())->getConnection();
    $stmt = $db->prepare("INSERT INTO posts (user_id, content, media_url, created_at) VALUES (:user_id, :content, :media_url, NOW())");
    $stmt->execute([
        'user_id' => $userId,
        'content' => $content,
        'media_url' => $mediaUrl
    ]);

    $postId = $db->lastInsertId();

    http_response_code(201);
    echo json_encode([
        "success" => true,
        "message" => "Post created successfully.",
        "post_id" => $postId
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Database Error: " . $e->getMessage()
    ]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Server Error: " . $e->getMessage()
    ]);
}