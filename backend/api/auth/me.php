<?php
require_once '../../config/database.php';
require_once '../../config/session.php';

if (!isset($_SESSION['user_id'])) {
    echo json_encode(["success" => false, "authenticated" => false]);
    exit();
}

$db = (new Database())->getConnection();
$stmt = $db->prepare("SELECT id, name, username, email, avatar, bio FROM users WHERE id = :id");
$stmt->execute(['id' => $_SESSION['user_id']]);
$user = $stmt->fetch();

if ($user) {
    echo json_encode(["success" => true, "authenticated" => true, "user" => $user]);
} else {
    echo json_encode(["success" => false, "authenticated" => false]);
}