<?php
// Calculate absolute directory math for global configuration loaders safely
require_once dirname(__DIR__, 2) . '/config/cors.php'; // Handle preflight OPTIONS calls immediately
require_once dirname(__DIR__, 2) . '/config/session.php';
require_once dirname(__DIR__, 2) . '/config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Method Not Allowed. Expected POST."]);
    exit();
}

try {
    $userId = checkAuth();
    if (is_array($userId)) {
        $userId = $userId['id'];
    }

    if (!$userId) {
        http_response_code(401);
        echo json_encode(["success" => false, "message" => "Unauthorized profile session."]);
        exit();
    }

    // Read traditional form-data string parameters from $_POST global array
    $content = isset($_POST['content']) ? trim($_POST['content']) : '';
    $postType = isset($_POST['post_type']) ? trim($_POST['post_type']) : 'public';
    $unlockAt = isset($_POST['unlock_at']) ? trim($_POST['unlock_at']) : null;
    
    $mediaUrl = null;
    $mediaType = 'image';

    // ✅ FIXED VALIDATION: Map files using the frontend parameter 'media'
    if (isset($_FILES['media']) && $_FILES['media']['error'] === UPLOAD_ERR_OK) {
        $fileTmpPath = $_FILES['media']['tmp_name'];
        $fileName = $_FILES['media']['name'];
        $fileMime = $_FILES['media']['type'];
        
        $fileExtension = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));
        $allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'mp4', 'mov', 'webm'];

        if (!in_array($fileExtension, $allowedExtensions)) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "Unsupported media format extension Type."]);
            exit();
        }

        // Dynamically deduce if the incoming attachment represents a video reel or static image
        if (strpos($fileMime, 'video/') === 0) {
            $mediaType = 'video';
        }

        // Calculate storage directory on the host server relative to the api root
        $uploadDir = dirname(__DIR__, 2) . '/uploads/';
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0755, true);
        }

        // Apply cryptographic naming to secure directories against path traversal overrides
        $newFileName = md5(time() . $fileName) . '.' . $fileExtension;
        $destPath = $uploadDir . $newFileName;

        if (move_uploaded_file($fileTmpPath, $destPath)) {
            $mediaUrl = 'uploads/' . $newFileName;
        } else {
            throw new Exception("Local container disk operating system write block encountered.");
        }
    }

    if (empty($content) && empty($mediaUrl)) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Cannot publish an empty post entry."]);
        exit();
    }

    $db = (new Database())->getConnection();
    
    // Bind structural values securely via parameterized statements
    $query = "
        INSERT INTO posts (user_id, content, media_url, media_type, post_type, unlock_at) 
        VALUES (:user_id, :content, :media_url, :media_type, :post_type, :unlock_at)
    ";
    
    $stmt = $db->prepare($query);
    $stmt->execute([
        'user_id'    => $userId,
        'content'    => !empty($content) ? $content : null,
        'media_url'  => $mediaUrl,
        'media_type' => $mediaType,
        'post_type'  => $postType,
        'unlock_at'  => (!empty($unlockAt) && $postType === 'time_capsule') ? $unlockAt : null
    ]);

    echo json_encode([
        "success" => true,
        "message" => "Post shared successfully! ✨"
    ]);

} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false, 
        "message" => "An error occurred while sharing your post.",
        "debug_error" => $e->getMessage()
    ]);
}
