<?php
// CORS Headers
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Access-Control-Allow-Credentials: true");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

header("Content-Type: application/json");
ini_set('display_errors', '0');

$baseDir = dirname(__DIR__, 2);
require_once $baseDir . '/config/database.php';

$page = isset($_GET['page']) && is_numeric($_GET['page']) ? max(1, (int)$_GET['page']) : 1;
$limit = isset($_GET['limit']) && is_numeric($_GET['limit']) ? min(50, max(1, (int)$_GET['limit'])) : 20;
$offset = ($page - 1) * $limit;

try {
    $db = $pdo ?? (new Database())->getConnection();

    $sql = "
        SELECT 
            l.id,
            l.subject,
            l.message,
            l.created_at,
            u.id AS sender_id,
            u.username AS sender_username,
            u.avatar AS sender_avatar
        FROM letters l
        JOIN users u ON l.sender_id = u.id
        ORDER BY l.created_at DESC
        LIMIT :limit OFFSET :offset
    ";

    $stmt = $db->prepare($sql);
    $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
    $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
    $stmt->execute();

    $letters = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        "success" => true,
        "letters" => $letters
    ]);

} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Failed to load feed posts."
    ]);
}