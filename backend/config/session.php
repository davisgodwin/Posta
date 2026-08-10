<?php
// Clear any active output buffer
if (ob_get_length()) ob_clean();

// Secure session configuration
if (session_status() === PHP_SESSION_NONE) {
    ini_set('session.cookie_httponly', 1);
    ini_set('session.use_only_cookies', 1);
    session_start();
}

// Global Exception Handler: Guarantees a clean 500 JSON payload on uncaught runtime errors
set_exception_handler(function ($e) {
    if (ob_get_length()) ob_clean();
    http_response_code(500);
    header('Content-Type: application/json; charset=UTF-8');
    echo json_encode([
        "success" => false,
        "message" => "Fatal Server Error: " . $e->getMessage()
    ]);
    exit();
});

// Dynamic CORS Configuration
$allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    'http://127.0.0.1:5173'
];

if (isset($_SERVER['HTTP_ORIGIN']) && in_array($_SERVER['HTTP_ORIGIN'], $allowedOrigins)) {
    header("Access-Control-Allow-Origin: " . $_SERVER['HTTP_ORIGIN']);
} else {
    header("Access-Control-Allow-Origin: http://localhost:5173");
}

header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Content-Type: application/json; charset=UTF-8");

// Handle preflight OPTIONS requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Authentication middleware check
function checkAuth() {
    if (!isset($_SESSION['user_id'])) {
        http_response_code(401);
        echo json_encode(["success" => false, "message" => "Unauthorized access. Please log in."]);
        exit();
    }
    return $_SESSION['user_id'];
}