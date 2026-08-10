<?php
header('Content-Type: application/json');
require_once '../config/db.php';

$data = json_decode(file_get_contents('php://input'), true);
$letter_id = filter_var($data['letter_id'] ?? null, FILTER_VALIDATE_INT);
$action = $data['action'] ?? 'archive'; // 'archive' or 'delete'

if (!$letter_id) {
    echo json_encode(['success' => false, 'message' => 'Missing letter ID']);
    exit;
}

$column = ($action === 'delete') ? 'is_deleted' : 'is_archived';
$stmt = $pdo->prepare("UPDATE letters SET {$column} = 1 WHERE id = ?");
$stmt->execute([$letter_id]);

echo json_encode(['success' => true]);