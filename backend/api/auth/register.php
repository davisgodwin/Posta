<?php
// Calculate absolute path routing constraints cleanly
require_once dirname(__DIR__, 2) . '/config/cors.php';
require_once dirname(__DIR__, 2) . '/config/session.php';
require_once dirname(__DIR__, 2) . '/config/database.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode([
        "success" => false,
        "message" => "Method Not Allowed. Expected POST."
    ]);
    exit();
}

$data = json_decode(file_get_contents("php://input"), true);

if (!$data || !is_array($data)) {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => "Invalid request payload."
    ]);
    exit();
}

$username         = trim($data['username'] ?? '');
$email            = trim($data['email'] ?? '');
$password         = $data['password'] ?? '';
$confirm_password = $data['confirmPassword'] ?? '';

// Validation
if (empty($username) || empty($email) || empty($password)) {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => "All fields are required."
    ]);
    exit();
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => "Invalid email format."
    ]);
    exit();
}

if ($password !== $confirm_password) {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => "Passwords do not match."
    ]);
    exit();
}

if (strlen($password) < 6) {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => "Password must be at least 6 characters long."
    ]);
    exit();
}

try {
    $db = (new Database())->getConnection();

    // Check if username or email already exists
    $stmt = $db->prepare(
        "SELECT id FROM users WHERE username = :username OR email = :email LIMIT 1"
    );
    $stmt->execute([
        'username' => $username,
        'email'    => $email
    ]);

    if ($stmt->fetch()) {
        http_response_code(409);
        echo json_encode([
            "success" => false,
            "message" => "Username or email is already taken."
        ]);
        exit();
    }

    // Create user
    $hashedPassword = password_hash($password, PASSWORD_BCRYPT);

    $stmt = $db->prepare(
        "INSERT INTO users (username, email, password) VALUES (:username, :email, :password)"
    );

    $success = $stmt->execute([
        'username' => $username,
        'email'    => $email,
        'password' => $hashedPassword
    ]);

    if (!$success) {
        throw new Exception("Failed to insert user.");
    }

    $userId = $db->lastInsertId();

    // Start session safely
    if (session_status() === PHP_SESSION_NONE) {
        session_start();
    }

    $_SESSION['user_id']  = $userId;
    $_SESSION['username'] = $username;

    http_response_code(201);
    echo json_encode([
        "success" => true,
        "message" => "Registration successful!",
        "user" => [
            "id"       => (int)$userId,
            "username" => $username,
            "email"    => $email
        ]
    ]);

} catch (Throwable $e) {
    http_response_code(500);

    $response = [
        "success" => false,
        "message" => "Server error during registration."
    ];

    // Only expose the real error while debugging (remove this in production)
    if (getenv('APP_ENV') === 'development' || true) { // ← change to false later
        $response['debug_error'] = $e->getMessage();
    }

    echo json_encode($response);
}