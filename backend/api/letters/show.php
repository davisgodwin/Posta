<?php
require_once '../../config/database.php';
require_once '../../config/session.php';

$userId = checkAuth();
$letterId = $_GET['id'] ?? null;

if (!$letterId) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Letter ID required."]);
    exit();
}

$db = (new Database())->getConnection();

try {
    // Distinct parameters :receiver_id and :sender_id prevent HY093 errors
    $stmt = $db->prepare("
        SELECT l.id, l.subject, l.message, l.theme, l.is_read, l.created_at, l.receiver_id, l.sender_id,
               u.username as sender_username, u.name as sender_name
        FROM letters l
        JOIN users u ON l.sender_id = u.id
        WHERE l.id = :id AND (l.receiver_id = :receiver_id OR l.sender_id = :sender_id)
    ");
    
    $stmt->execute([
        'id'          => $letterId,
        'receiver_id' => $userId,
        'sender_id'   => $userId
    ]);
    
    $letter = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$letter) {
        http_response_code(404);
        echo json_encode(["success" => false, "message" => "Letter not found or unauthorized."]);
        exit();
    }

    // Mark letter as read if recipient is viewing it
    if ($letter['receiver_id'] == $userId && !$letter['is_read']) {
        $updateStmt = $db->prepare("UPDATE letters SET is_read = 1 WHERE id = :id");
        $updateStmt->execute(['id' => $letterId]);
        $letter['is_read'] = 1;
    }

    echo json_encode([
        "success" => true,
        "letter"  => $letter
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Database error: " . $e->getMessage()]);
}