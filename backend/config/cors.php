<?php
// Clear any active output buffers to ensure clean, precise header delivery
if (ob_get_length()) ob_clean();

// 1. Dynamic White-list Mapping Parameters
$allowed_origins = [
    'https://onrender.com',
    'http://localhost:5173',
    'http://localhost:3000'
];

$http_origin = $_SERVER['HTTP_ORIGIN'] ?? '';

if (in_array($http_origin, $allowed_origins)) {
    header("Access-Control-Allow-Origin: " . $http_origin);
} else {
    header("Access-Control-Allow-Origin: https://onrender.com");
}

header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS, PUT, DELETE");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, ngrok-skip-browser-warning");

// 2. 🚨 THE CORE FIXED ACTION: Intercept preflight calls instantly and stop execution
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204); // Returns a clean 204 No Content code, satisfying browser security checks
    exit();
}

// Format configurations for standard operational scripts
header("Content-Type: application/json; charset=UTF-8");
ini_set('display_errors', '0');
