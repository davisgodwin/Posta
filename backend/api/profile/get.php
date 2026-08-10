<?php
require_once '../../config/database.php';
require_once '../../config/session.php';

$userId = checkAuth();
$db = (new Database())->getConnection();

$stmt = $db->prepare("SELECT id, name, username, email, bio, avatar, created_at FROM users WHERE id = :id");
$stmt->execute(['id' => $userId]);
$user = $stmt->fetch();

echo json_encode([
    "success" => true,
    "user" => $user
]);