<?php
// backend/api/letters/send.php
if (ob_get_length()) ob_clean();

require_once '../../config/database.php';
require_once '../../config/session.php';

$senderId = checkAuth();
if (is_array($senderId)) {
    $senderId = $senderId['id'];
}

$data = json_decode(file_get_contents("php://input"), true);

$recipientInput = trim($data['recipient'] ?? '');
$subject = trim($data['subject'] ?? '');
$message = trim($data['message'] ?? '');
$theme = trim($data['theme'] ?? 'classic');
$scheduledAt = !empty($data['scheduled_at']) ? $data['scheduled_at'] : null;

if (empty($recipientInput) || empty($subject) || empty($message)) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "All fields are required."]);
    exit();
}

$db = (new Database())->getConnection();

$stmtUser = $db->prepare("SELECT id FROM users WHERE username = :username OR email = :email");
$stmtUser->execute([
    'username' => $recipientInput,
    'email'    => $recipientInput
]);
$recipient = $stmtUser->fetch(PDO::FETCH_ASSOC);

if (!$recipient) {
    http_response_code(404);
    echo json_encode(["success" => false, "message" => "Recipient not found."]);
    exit();
}

if ($recipient['id'] == $senderId) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "You cannot send a letter to yourself."]);
    exit();
}

try {
    $db->beginTransaction();

    $stmt = $db->prepare("
        INSERT INTO letters (sender_id, receiver_id, subject, message, theme, scheduled_at, created_at) 
        VALUES (:sender_id, :receiver_id, :subject, :message, :theme, :scheduled_at, NOW())
    ");

    $stmt->execute([
        'sender_id'    => $senderId,
        'receiver_id'  => $recipient['id'],
        'subject'      => $subject,
        'message'      => $message,
        'theme'        => $theme,
        'scheduled_at' => $scheduledAt
    ]);

    $letterId = $db->lastInsertId();

    // Only create immediate notification if the letter is NOT scheduled for the future
    if (!$scheduledAt || strtotime($scheduledAt) <= time()) {
        $stmtNotif = $db->prepare("
            INSERT INTO notifications (user_id, actor_id, letter_id, type, is_read, created_at) 
            VALUES (:user_id, :actor_id, :letter_id, 'letter', 0, NOW())
        ");
        $stmtNotif->execute([
            'user_id'   => $recipient['id'],
            'actor_id'  => $senderId,
            'letter_id' => $letterId
        ]);
    }

    $db->commit();

    $successMsg = $scheduledAt 
        ? "Your letter has been scheduled! ⏳" 
        : "Your letter has been delivered! 📮";

    echo json_encode(["success" => true, "message" => $successMsg]);
} catch (PDOException $e) {
    if ($db->inTransaction()) {
        $db->rollBack();
    }
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Database error: " . $e->getMessage()]);
}