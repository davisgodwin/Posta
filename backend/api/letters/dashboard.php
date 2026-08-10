<?php
require_once '../../config/database.php';
require_once '../../config/session.php';

$userId = checkAuth();
$db = (new Database())->getConnection();

// Metrics queries
$stmtReceived = $db->prepare("SELECT COUNT(*) FROM letters WHERE receiver_id = :uid");
$stmtReceived->execute(['uid' => $userId]);
$totalReceived = $stmtReceived->fetchColumn();

$stmtUnread = $db->prepare("SELECT COUNT(*) FROM letters WHERE receiver_id = :uid AND is_read = 0");
$stmtUnread->execute(['uid' => $userId]);
$totalUnread = $stmtUnread->fetchColumn();

$stmtSent = $db->prepare("SELECT COUNT(*) FROM letters WHERE sender_id = :uid");
$stmtSent->execute(['uid' => $userId]);
$totalSent = $stmtSent->fetchColumn();

// Recent letters (Received or Sent)
$stmtRecent = $db->prepare("
    SELECT l.id, l.subject, l.theme, l.is_read, l.created_at, 
           u.username as sender_name, u.name as sender_full_name
    FROM letters l
    JOIN users u ON l.sender_id = u.id
    WHERE l.receiver_id = :uid
    ORDER BY l.created_at DESC
    LIMIT 5
");
$stmtRecent->execute(['uid' => $userId]);
$recentLetters = $stmtRecent->fetchAll();

echo json_encode([
    "success" => true,
    "stats" => [
        "received" => (int)$totalReceived,
        "unread" => (int)$totalUnread,
        "sent" => (int)$totalSent
    ],
    "recent_letters" => $recentLetters
]);