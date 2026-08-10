<?php
if (ob_get_length()) ob_clean();

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Credentials: true");

// Suppress unhandled diagnostic strings from forcing a broken 200 OK header status
ini_set('display_errors', '0');

require_once '../../config/database.php';
require_once '../../config/session.php';

try {
    $userId = checkAuth();
    if (is_array($userId)) {
        $userId = $userId['id'];
    }

    if (!$userId) {
        http_response_code(401);
        echo json_encode(["success" => false, "message" => "Authentication required."]);
        exit();
    }

    $data = json_decode(file_get_contents("php://input"), true);
    $replyId = isset($data['reply_id']) ? (int)$data['reply_id'] : 0;

    if (!$replyId) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Valid message reference required."]);
        exit();
    }

    $db = (new Database())->getConnection();

    // 1. Ownership Verification: Ensure this user actually wrote the message
    $stmtCheck = $db->prepare("SELECT sender_id FROM letter_replies WHERE id = :reply_id");
    $stmtCheck->execute(['reply_id' => $replyId]);
    $reply = $stmtCheck->fetch(PDO::FETCH_ASSOC);

    if (!$reply) {
        http_response_code(404);
        echo json_encode(["success" => false, "message" => "Message not found."]);
        exit();
    }

    if ((int)$reply['sender_id'] !== (int)$userId) {
        http_response_code(403);
        echo json_encode(["success" => false, "message" => "You are not authorized to delete this message."]);
        exit();
    }

    // 2. Execution: Remove the row from the database
    $stmtDelete = $db->prepare("DELETE FROM letter_replies WHERE id = :reply_id");
    $stmtDelete->execute(['reply_id' => $replyId]);

    echo json_encode([
        "success" => true,
        "message" => "Message successfully removed."
    ]);
    exit();

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Internal database transaction exception occurred."
    ]);
}
