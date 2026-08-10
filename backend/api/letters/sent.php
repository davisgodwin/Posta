<?php
if (ob_get_length()) ob_clean();

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Credentials: true");

// Strict Error Masking for API security
ini_set('display_errors', '0');

// Use the absolute robust path fix we established
require_once dirname(__DIR__, 2) . '/config/database.php';
require_once dirname(__DIR__, 2) . '/config/session.php';

try {
    $userId = checkAuth();
    if (is_array($userId)) {
        $userId = $userId['id'];
    }

    if (!$userId) {
        http_response_code(401);
        echo json_encode(["success" => false, "message" => "Unauthorized access."]);
        exit();
    }

    $db = (new Database())->getConnection();

    // Your exact correct query
    $query = "
        SELECT 
            l.id,
            l.subject,
            l.message,
            l.created_at,
            u.username AS recipient_username
        FROM letters l
        LEFT JOIN users u ON l.receiver_id = u.id
        WHERE l.sender_id = :user_id
        ORDER BY l.created_at DESC
        LIMIT 10
    ";

    $stmt = $db->prepare($query);
    
    // ✅ Securely bind the active user session ID to the placeholder parameter
    $stmt->execute(['user_id' => $userId]);
    $letters = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        "success" => true,
        "letters" => $letters
    ]);

} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "An internal backend processing failure occurred."
    ]);
}
