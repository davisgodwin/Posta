<?php
require_once '../../config/database.php';
require_once '../../config/session.php';

$data = json_decode(file_get_contents("php://input"), true);

$name = trim($data['name'] ?? '');
$username = trim($data['username'] ?? '');
$email = trim($data['email'] ?? '');
$password = $data['password'] ?? '';
$confirm_password = $data['confirmPassword'] ?? '';

// Validation
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

$db = (new Database())->getConnection();

// Check if username or email already exists
$stmt = $db->prepare("SELECT id FROM users WHERE username = :username OR email = :email");
$stmt->execute(['username' => $username, 'email' => $email]);

if ($stmt->fetch()) {
    http_response_code(409);
    echo json_encode(["success" => false, "message" => "Username or email is already taken."]);
    exit();
}

// Hash password and insert user
$hashedPassword = password_hash($password, PASSWORD_BCRYPT);
$stmt = $db->prepare("INSERT INTO users (name, username, email, password) VALUES (:name, :username, :email, :password)");

if ($stmt->execute(['name' => $name, 'username' => $username, 'email' => $email, 'password' => $hashedPassword])) {
    $userId = $db->lastInsertId();
    
    $_SESSION['user_id'] = $userId;
    $_SESSION['username'] = $username;
    $_SESSION['name'] = $name;

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