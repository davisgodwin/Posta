<?php
// Clear any active output buffer
if (ob_get_length()) ob_clean();

// Dynamic CORS Configuration
$allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    'http://127.0.0.1:5173',
    'https://posta-xi-three.vercel.app',
    'https://scorebook-divinity-bonding.ngrok-free.dev' // Added your active ngrok domain
];

$requestOrigin = $_SERVER['HTTP_ORIGIN'] ?? '';

if (in_array($requestOrigin, $allowedOrigins, true)) {
    header("Access-Control-Allow-Origin: " . $requestOrigin);
} else {
    // Dynamic fallback for ngrok or missing origins during development
    header("Access-Control-Allow-Origin: " . ($requestOrigin ?: "https://posta-xi-three.vercel.app"));
}

header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
// ADDED ngrok-skip-browser-warning to allowed headers below:
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, ngrok-skip-browser-warning");
header("Content-Type: application/json; charset=UTF-8");

// Handle preflight OPTIONS requests immediately
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Secure Cross-Origin Session Configuration
if (session_status() === PHP_SESSION_NONE) {
    ini_set('session.cookie_httponly', 1);
    ini_set('session.use_only_cookies', 1);

    // Configures cookies to work cross-site over HTTPS
    session_set_cookie_params([
        'lifetime' => 86400 * 7,
        'path' => '/',
        'domain' => '', 
        'secure' => true,     // Must be true over HTTPS (ngrok / live host)
        'httponly' => true,
        'samesite' => 'None'  // Mandatory for Vercel -> PHP cross-site requests
    ]);

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

// Authentication middleware check
function checkAuth() {
    if (!isset($_SESSION['user_id'])) {
        http_response_code(401);
        echo json_encode(["success" => false, "message" => "Unauthorized access. Please log in."]);
        exit();
    }
    return $_SESSION['user_id'];
}