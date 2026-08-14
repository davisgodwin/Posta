<?php
// Ensure no broken output buffers interfere with headers
if (ob_get_length()) ob_clean();

// 1. Production and Local Origin Whitelist Map parameters
$allowed_origins = [
    'https://posta-q21g.onrender.com',
    'http://localhost:5173',
    'http://localhost:3000'
];

$http_origin = $_SERVER['HTTP_ORIGIN'] ?? '';

if (in_array($http_origin, $allowed_origins)) {
    header("Access-Control-Allow-Origin: " . $http_origin);
} else {
    header("Access-Control-Allow-Origin: https://posta-q21g.onrender.com");
}

header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS, PUT, DELETE");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, ngrok-skip-browser-warning");

// 2. ✅ FIXED PREFLIGHT REDIRECTS: Intercept OPTIONS immediately and exit with a clean 204 status
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204); // No Content
    exit();
}

// Early response format tracking
header("Content-Type: application/json; charset=UTF-8");
ini_set('display_errors', '0');
