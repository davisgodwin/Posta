<?php
// backend/api/auth/me.php

// ✅ FIXED: Injects clean, instant preflight intercept rules immediately
require_once dirname(__DIR__, 2) . '/config/cors.php'; 
require_once dirname(__DIR__, 2) . '/config/session.php';
require_once dirname(__DIR__, 2) . '/config/database.php';

$userId = checkAuth();
if (is_array($userId)) {
    $userId = $userId['id'];
}

if (!$userId) {
    http_response_code(401);
    echo json_encode(["success" => false, "message" => "Not logged in."]);
    exit();
}

// ... continue with fetch profile logic loop database processing queries
