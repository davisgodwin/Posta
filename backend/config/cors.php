<?php
// Clear any active output buffers
if (ob_get_length()) {
    ob_clean();
}

// =====================================================
// Allowed Origins
// =====================================================
// You can override this via an environment variable on Render:
// CORS_ALLOWED_ORIGINS=https://posta-q21g.onrender.com,http://localhost:5173,http://localhost:3000

$default_origins = [
    'https://posta-q21g.onrender.com',          // ← no trailing slash
    'http://localhost:5173',
    'http://localhost:3000',
];

$env_origins = getenv('CORS_ALLOWED_ORIGINS');
$allowed_origins = $env_origins
    ? array_map('trim', explode(',', $env_origins))
    : $default_origins;

$http_origin = $_SERVER['HTTP_ORIGIN'] ?? '';

if (in_array($http_origin, $allowed_origins, true)) {
    header("Access-Control-Allow-Origin: " . $http_origin);
} else {
    // Fallback – your main production frontend
    header("Access-Control-Allow-Origin: https://posta-q21g.onrender.com");
}

header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, ngrok-skip-browser-warning");
header("Access-Control-Max-Age: 86400");

// =====================================================
// Critical: Handle preflight immediately
// =====================================================
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit();
}

// Standard API headers
header("Content-Type: application/json; charset=UTF-8");
ini_set('display_errors', '0');