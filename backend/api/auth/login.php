<?php
if (ob_get_length()) ob_clean();

// 1. Dynamic CORS setup for credentials support
$allowed_origins = [
    'https://posta-q21g.onrender.com',
    'http://localhost:5173',
    'http://localhost:3000'
];

$http_origin = $_SERVER['HTTP_ORIGIN'] ?? '';

if (in_array($http_origin, $allowed_origins)) {
    header("Access-Control-Allow-Origin: " . $http_origin);
} else {
    header("Access-Control-Allow-Origin: https://posta-q21g.onrender.com");
}

header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, ngrok-skip-browser-warning");

// 2. Handle OPTIONS preflight immediately
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// 3. ✅ FIXED: Absolute directory math avoids broken file configuration dependencies
require_once dirname(__DIR__, 2) . '/config/session.php';
require_once dirname(__DIR__, 2) . '/config/database.php';

// 4. Output JSON Content-Type early & suppress error prints
header("Content-Type: application/json; charset=UTF-8");
ini_set('display_errors', '0');

// 5. Ensure request method is POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Method Not Allowed. Expected POST."]);
    exit();
}

// Read raw JSON input
$data = json_decode(file_get_contents("php://input"), true);

$identifier = trim($data['login'] ?? $data['identifier'] ?? $data['username'] ?? $data['email'] ?? '');
$password = $data['password'] ?? '';

if (empty($identifier) || empty($password)) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Email/Username and password are required."]);
    exit();
}

try {
    $db = (new Database())->getConnection();

    // ✅ FIXED SQL: Stripped the missing 'name' field out to prevent the 500 error crash
    $stmt = $db->prepare("SELECT id, username, email, password FROM users WHERE username = :username OR email = :email LIMIT 1");
    $stmt->execute([
        'username' => $identifier,
        'email'    => $identifier
    ]);
    
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($user && password_verify($password, $user['password'])) {
        $_SESSION['user_id'] = $user['id'];
        $_SESSION['username'] = $user['username'];

        unset($user['password']);

        http_response_code(200);
        echo json_encode([
            "success" => true,
            "message" => "Login successful!",
            "user" => $user
        ]);
    } else {
        http_response_code(401);
        echo json_encode(["success" => false, "message" => "Invalid email/username or password."]);
    }
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false, 
        "message" => "Database error during login.",
        "debug_error" => $e->getMessage()
    ]);
}
