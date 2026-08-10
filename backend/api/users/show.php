<?php
header("Access-Control-Allow-Origin: http://localhost:5173"); // Or your React frontend URL
header("Access-Control-Allow-Credentials: true");
header("Content-Type: application/json; charset=UTF-8");

require_once '../../config/database.php';
require_once '../../config/session.php';

$username = $_GET['username'] ?? null;

if (!$username) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Username parameter missing."]);
    exit();
}

$db = (new Database())->getConnection();

try {
    // Fetch target user public profile
    $stmt = $db->prepare("
        SELECT id, name, username, bio, location, website, avatar, created_at 
        FROM users 
        WHERE username = :username
    ");
    $stmt->execute(['username' => $username]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
        http_response_code(404);
        echo json_encode(["success" => false, "message" => "User @" . htmlspecialchars($username) . " not found."]);
        exit();
    }

    echo json_encode([
        "success" => true,
        "user" => $user
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Database error: " . $e->getMessage()]);
}