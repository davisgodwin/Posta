<?php
header('Content-Type: application/json');
require_once '../config/db.php';

$user_id = $_GET['user_id'] ?? null; // Pass from auth token or query param

if (!$user_id) {
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

$stmt = $pdo->prepare("
    SELECT l.*, u.username as recipient_username, u.name as recipient_name,
           (SELECT COUNT(*) FROM replies r WHERE r.letter_id = l.id) as reply_count
    FROM letters l
    JOIN users u ON l.recipient_id = u.id
    WHERE l.sender_id = ? AND l.is_deleted = 0
    ORDER BY l.created_at DESC
");
$stmt->execute([$user_id]);
$letters = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo json_encode(['success' => true, 'letters' => $letters]);