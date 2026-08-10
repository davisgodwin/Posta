<?php
if (ob_get_length()) ob_clean();

// Dynamic CORS Origin Match
$allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    'http://127.0.0.1:5173'
];

if (isset($_SERVER['HTTP_ORIGIN']) && in_array($_SERVER['HTTP_ORIGIN'], $allowedOrigins)) {
    header("Access-Control-Allow-Origin: " . $_SERVER['HTTP_ORIGIN']);
} else {
    header("Access-Control-Allow-Origin: http://localhost:5173");
}

header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: POST, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../../config/database.php';
require_once '../../config/session.php';

// Authenticate user
$userId = checkAuth();
$db = (new Database())->getConnection();

// Parse post_id from JSON payload or POST request
$data = json_decode(file_get_contents("php://input"), true);
$postId = $data['post_id'] ?? $_POST['post_id'] ?? null;

if (!$postId) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Post ID is required."]);
    exit();
}

try {
    // 1. Check if post exists AND belongs to the authenticated user
    $stmt = $db->prepare("SELECT id, media_url FROM posts WHERE id = :post_id AND user_id = :user_id");
    $stmt->execute([
        'post_id' => $postId,
        'user_id' => $userId
    ]);
    $post = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$post) {
        http_response_code(403);
        echo json_encode(["success" => false, "message" => "Unauthorized or post not found."]);
        exit();
    }

    // 2. Delete attached file from server if it exists
    if (!empty($post['media_url'])) {
        $filePath = __DIR__ . '/../../' . $post['media_url'];
        if (file_exists($filePath)) {
            unlink($filePath);
        }
    }

    // 3. Delete the post record (Cascading foreign keys will handle likes/comments)
    $deleteStmt = $db->prepare("DELETE FROM posts WHERE id = :post_id AND user_id = :user_id");
    $deleteStmt->execute([
        'post_id' => $postId,
        'user_id' => $userId
    ]);

    echo json_encode([
        "success" => true,
        "message" => "Post deleted successfully.",
        "post_id" => $postId
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Database Error: " . $e->getMessage()]);
}
?>