<?php
header('Content-Type: application/json');
require_once '../config/db.php'; // Adjust path as needed

$data = json_decode(file_get_contents('php_input'), true);
$letter_id = filter_var($data['letter_id'] ?? null, FILTER_VALIDATE_INT);
$user_id = $data['user_id'] ?? null; // Pass from session/auth token

if (!$letter_id || !$user_id) {
    echo json_encode(['success' => false, 'message' => 'Invalid parameters']);
    exit;
}

// Mark letter as read for recipient
$stmt = $pdo->prepare("UPDATE letters SET is_read = 1 WHERE id = ? AND recipient_id = ?");
$stmt->execute([$letter_id, $user_id]);

// Mark all incoming replies as read
$stmtReplies = $pdo->prepare("UPDATE replies SET is_read = 1 WHERE letter_id = ? AND sender_id != ?");
$stmtReplies->execute([$letter_id, $user_id]);

echo json_encode(['success' => true]);