<?php
// 1. Session and CORS configuration
require_once '../../config/session.php';
require_once '../../config/database.php';

// 2. Output JSON Content-Type early & suppress display errors for API clean output
header("Content-Type: application/json; charset=UTF-8");
ini_set('display_errors', '0');

// 3. Global CORS Headers
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, ngrok-skip-browser-warning");

// 4. Handle OPTIONS preflight immediately
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// 5. Ensure request method is POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Method Not Allowed. Expected POST."]);
    exit();
}

// Read raw JSON body
$data = json_decode(file_get_contents("php://input"), true);

if (!$data) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Invalid request payload."]);
    exit();
}

$name = trim($data['name'] ?? '');
$username = trim($data['username'] ?? '');
$email = trim($data['email'] ?? '');
$password = $data['password'] ?? '';
$confirm_password = $data['confirmPassword'] ?? '';

// Validations
if (empty($name) || empty($username) || empty($email) || empty($password)) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "All fields are required."]);
    exit();
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Invalid email format."]);
    exit();
}

if ($password !== $confirm_password) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Passwords do not match."]);
    exit();
}

if (strlen($password) < 6) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Password must be at least 6 characters long."]);
    exit();
}

try {
    $db = (new Database())->getConnection();

    // Check existing user
    $stmt = $db->prepare("SELECT id FROM users WHERE username = :username OR email = :email LIMIT 1");
    $stmt->execute(['username' => $username, 'email' => $email]);

    if ($stmt->fetch()) {
        http_response_code(409);
        echo json_encode(["success" => false, "message" => "Username or email is already taken."]);
        exit();
    }

    // Hash password & insert
    $hashedPassword = password_hash($password, PASSWORD_BCRYPT);
    $stmt = $db->prepare("INSERT INTO users (name, username, email, password) VALUES (:name, :username, :email, :password)");

    if ($stmt->execute(['name' => $name, 'username' => $username, 'email' => $email, 'password' => $hashedPassword])) {
        $userId = $db->lastInsertId();
        
        $_SESSION['user_id'] = $userId;
        $_SESSION['username'] = $username;
        $_SESSION['name'] = $name;

        http_response_code(201);
        echo json_encode([
            "success" => true,
            "message" => "Registration successful! Welcome to POSTA.",
            "user" => [
                "id" => $userId,
                "name" => $name,
                "username" => $username,
                "email" => $email
            ]
        ]);
    } else {
        http_response_code(500);
        echo json_encode(["success" => false, "message" => "Registration failed. Try again."]);
    }

} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false, 
        "message" => "Server error: " . $e->getMessage()
    ]);
}