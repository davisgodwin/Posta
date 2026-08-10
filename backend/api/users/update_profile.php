<?php
require_once '../../config/database.php';
require_once '../../config/session.php';

$userId = checkAuth();
$db = (new Database())->getConnection();

// Ensure columns exist in users table
try {
    $db->exec("ALTER TABLE users ADD COLUMN IF NOT EXISTS location VARCHAR(100) DEFAULT NULL");
    $db->exec("ALTER TABLE users ADD COLUMN IF NOT EXISTS website VARCHAR(255) DEFAULT NULL");
    $db->exec("ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT DEFAULT NULL");
    $db->exec("ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar VARCHAR(255) DEFAULT NULL");
} catch (PDOException $e) {
    // Columns already exist or database engine ignored
}

$name = trim($_POST['name'] ?? '');
$bio = trim($_POST['bio'] ?? '');
$location = trim($_POST['location'] ?? '');
$website = trim($_POST['website'] ?? '');

if (empty($name)) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Full name is required."]);
    exit();
}

$avatarPath = null;

// Handle Avatar Upload
if (isset($_FILES['avatar']) && $_FILES['avatar']['error'] === UPLOAD_ERR_OK) {
    $fileTmpPath = $_FILES['avatar']['tmp_name'];
    $fileName = $_FILES['avatar']['name'];
    $fileExtension = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));

    $allowedExtensions = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
    if (in_array($fileExtension, $allowedExtensions)) {
        $uploadDir = '../../uploads/avatars/';
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0777, true);
        }

        $newFileName = 'avatar_' . $userId . '_' . time() . '.' . $fileExtension;
        $destPath = $uploadDir . $newFileName;

        if (move_uploaded_file($fileTmpPath, $destPath)) {
            $avatarPath = 'uploads/avatars/' . $newFileName;
        }
    }
}

try {
    if ($avatarPath) {
        $stmt = $db->prepare("
            UPDATE users 
            SET name = :name, bio = :bio, location = :location, website = :website, avatar = :avatar 
            WHERE id = :id
        ");
        $stmt->execute([
            'name'     => $name,
            'bio'      => $bio,
            'location' => $location,
            'website'  => $website,
            'avatar'   => $avatarPath,
            'id'       => $userId
        ]);
    } else {
        $stmt = $db->prepare("
            UPDATE users 
            SET name = :name, bio = :bio, location = :location, website = :website 
            WHERE id = :id
        ");
        $stmt->execute([
            'name'     => $name,
            'bio'      => $bio,
            'location' => $location,
            'website'  => $website,
            'id'       => $userId
        ]);
    }

    $fetchStmt = $db->prepare("SELECT id, name, username, email, bio, location, website, avatar FROM users WHERE id = :id");
    $fetchStmt->execute(['id' => $userId]);
    $updatedUser = $fetchStmt->fetch(PDO::FETCH_ASSOC);

    echo json_encode([
        "success" => true,
        "message" => "Profile updated successfully!",
        "user"    => $updatedUser
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Database error: " . $e->getMessage()]);
}