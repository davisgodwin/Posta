<?php
// Clear output buffers to guarantee clean JSON response
if (ob_get_length()) ob_clean();

// CORS Headers
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Access-Control-Allow-Credentials: true");

// Handle OPTIONS preflight request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

header("Content-Type: application/json");

// Suppress raw HTML error strings from corrupting JSON payloads
ini_set('display_errors', '0'); 
error_reporting(E_ALL);

// Robust Pathing Resolution
$baseDir = dirname(__DIR__, 2);
require_once $baseDir . '/config/database.php';
require_once $baseDir . '/config/session.php';

try {
    $userId = checkAuth();
    if (is_array($userId)) {
        $userId = $userId['id'] ?? null;
    }

    if (!$userId) {
        http_response_code(401);
        echo json_encode(["success" => false, "message" => "Unauthorized access."]);
        exit();
    }

    // $pdo is guaranteed via database.php import or can be initialized via class
    $db = $pdo ?? (new Database())->getConnection(); 

    $data = json_decode(file_get_contents("php://input"), true);
    $usernameInput = trim($data['username'] ?? '');
    $bio = trim($data['bio'] ?? '');

    if (empty($usernameInput)) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Username field is required."]);
        exit();
    }

    // Ensure requested username isn't already taken by another user
    $stmtCheck = $db->prepare("SELECT id FROM users WHERE username = :username AND id != :id");
    $stmtCheck->execute([
        'username' => $usernameInput,
        'id'       => $userId
    ]);
    
    if ($stmtCheck->fetch()) {
        http_response_code(409);
        echo json_encode(["success" => false, "message" => "Username is already taken."]);
        exit();
    }

    // Execute update query
    $stmt = $db->prepare("UPDATE users SET username = :username, bio = :bio WHERE id = :id");
    $stmt->execute([
        'username' => $usernameInput,
        'bio'      => $bio,
        'id'       => $userId
    ]);

    echo json_encode([
        "success" => true, 
        "message" => "Profile updated successfully! ✨"
    ]);

} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Internal Server Error: " . $e->getMessage()
    ]);
    exit();
}