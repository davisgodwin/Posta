<?php
// Ensure any open buffers are completely flushed for direct hosting environments
while (ob_get_level()) {
    ob_end_clean();
}

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

header("Content-Type: application/json; charset=UTF-8");
ini_set('display_errors', '0');

try {
    // 3. ✅ LINUX CASE-SENSITIVE FALLBACK ROUTING ENGINE
    $baseConfigDir = dirname(__DIR__, 2) . '/config/';

    // Resolve session configuration file name
    if (file_exists($baseConfigDir . 'session.php')) {
        require_once $baseConfigDir . 'session.php';
    } else {
        require_once $baseConfigDir . 'Session.php';
    }

    // Resolve database connection file name
    if (file_exists($baseConfigDir . 'database.php')) {
        require_once $baseConfigDir . 'database.php';
    } else if (file_exists($baseConfigDir . 'Database.php')) {
        require_once $baseConfigDir . 'Database.php';
    } else if (file_exists($baseConfigDir . 'db.php')) {
        require_once $baseConfigDir . 'db.php';
    } else {
        throw new Exception("Core database configuration file could not be resolved in the config layout folder structure.");
    }

    // 4. Ensure request method is POST
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

    $username = trim($data['username'] ?? '');
    $email = trim($data['email'] ?? '');
    $password = $data['password'] ?? '';
    $confirm_password = $data['confirmPassword'] ?? '';

    // Validations
    if (empty($username) || empty($email) || empty($password)) {
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

    // 5. Connect and execute
    $db = (new Database())->getConnection();

    // Check existing user
    $stmt = $db->prepare("SELECT id FROM users WHERE username = :username OR email = :email LIMIT 1");
    $stmt->execute(['username' => $username, 'email' => $email]);

    if ($stmt->fetch()) {
        http_response_code(409);
        echo json_encode(["success" => false, "message" => "Username or email is already taken."]);
        exit();
    }

    $hashedPassword = password_hash($password, PASSWORD_BCRYPT);
    $stmt = $db->prepare("INSERT INTO users (username, email, password) VALUES (:username, :email, :password)");
    $executionResult = $stmt->execute([
        'username' => $username, 
        'email'    => $email, 
        'password' => $hashedPassword
    ]);

    if ($executionResult) {
        $userId = $db->lastInsertId();
        
        if (session_status() == PHP_SESSION_NONE) {
            session_start();
        }
        $_SESSION['user_id'] = $userId;
        $_SESSION['username'] = $username;

        http_response_code(201);
        echo json_encode([
            "success" => true,
            "message" => "Registration successful! Welcome to POSTA.",
            "user" => [
                "id" => $userId,
                "username" => $username,
                "email" => $email
            ]
        ]);
    } else {
        http_response_code(500);
        echo json_encode(["success" => false, "message" => "Registration failed. Try again."]);
    }

} catch (Throwable $e) {
    // Keep error description visible for dev tools monitoring logs
    http_response_code(500);
    echo json_encode([
        "success" => false, 
        "message" => "Server error during registration.",
        "debug_error" => $e->getMessage()
    ]);
}
