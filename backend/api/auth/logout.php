<?php
require_once '../../config/session.php';

session_unset();
session_destroy();

echo json_encode(["success" => true, "message" => "Logged out successfully."]);