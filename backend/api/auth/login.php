<?php
require_once '../../config/database.php';
require_once '../../config/session.php';

$data = json_decode(file_get_contents("php://input"), true);

$identifier = trim($data['login'] ?? $data['identifier'] ?? $data['username'] ?? $data['email'] ?? '');
$password = trim($data['password'] ?? '');

if (empty($identifier) || empty($password)) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Email/Username and password are required."]);
    exit();
}

$db = (new Database())->getConnection();

try {
    // Use distinct placeholders :username and :email
    $stmt = $db->prepare("SELECT id, name, username, email, password FROM users WHERE username = :username OR email = :email");
    $stmt->execute([
        'username' => $identifier,
        'email'    => $identifier
    ]);
    
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($user && password_verify($password, $user['password'])) {
        $_SESSION['user_id'] = $user['id'];
        $_SESSION['username'] = $user['username'];

        unset($user['password']);

        echo json_encode([
            "success" => true,
            "message" => "Login successful!",
            "user" => $user
        ]);
    } else {
        http_response_code(401);
        echo json_encode(["success" => false, "message" => "Invalid email/username or password."]);
    }
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Database error: " . $e->getMessage()]);
}