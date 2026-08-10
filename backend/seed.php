<?php
// backend/seed.php
ini_set('display_errors', 1);
error_reporting(E_ALL);
header('Content-Type: text/html; charset=utf-8');

require_once __DIR__ . '/config/db.php'; // Ensure $pdo is available

// Increase execution time for bulk insertion
set_time_limit(180);

echo "<h2>🌱 Posta Database Seeder</h2>";

try {
    // Disable Foreign Key checks during table clean/seed
    $pdo->exec("SET FOREIGN_KEY_CHECKS = 0;");

    // Sample data generators
    $firstNames = ['Alex', 'Jordan', 'Taylor', 'Morgan', 'Sam', 'Chris', 'Pat', 'Riley', 'Avery', 'Dakota', 'Devon', 'Jesse', 'Casey', 'Skyler', 'Jamie', 'Rowan', 'Quinn', 'Reese'];
    $lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzales', 'Wilson', 'Anderson'];
    
    $letterSubjects = [
        "A quiet evening thought",
        "Greetings from across the valley",
        "Did you ever solve that bug?",
        "Reflections on minimalist software",
        "Coffee recommendation for your town",
        "A quick note on our next project",
        "Looking back at old code repositories",
        "Late night design inspirations",
        "The art of writing slow letters",
        "Building digital postboxes in 2026",
        "Thoughts on web speed and minimalism",
        "A recommendation for your reading list"
    ];

    $letterBodies = [
        "I was thinking today about how quickly we consume messages now. There's something peaceful about taking the time to send a letter, even if it's rendered in pixels. How have things been on your side?",
        "Working through some new user interface concepts today. It reminded me of our conversation about keeping digital tools simple and purposeful. Let me know what you think when you get a chance.",
        "Just finished a long coding session and decided to drop you a line. The weather here has been unusually calm. Hope your current projects are moving smoothly!",
        "I came across an interesting article on database performance optimization today and immediately thought of our recent debugging efforts. Hope all is well!"
    ];

    $replyMessages = [
        "Thanks for writing! It's always great to hear from you.",
        "I completely agree with your thoughts on that.",
        "Fascinating perspective! Let's talk more about this soon.",
        "I'm actually working on something similar right now.",
        "Good to catch up! Let me get back to you with a longer note tomorrow."
    ];

    // ----------------------------------------------------
    // 1. Seed 100 Users
    // ----------------------------------------------------
    echo "<p>Creating 100 users...</p>";
    $userStmt = $pdo->prepare("
        INSERT INTO users (username, full_name, email, password_hash, created_at) 
        VALUES (:username, :full_name, :email, :password_hash, :created_at)
    ");

    $defaultPasswordHash = password_hash('password123', PASSWORD_BCRYPT);
    $userIds = [];

    $pdo->beginTransaction();
    for ($i = 1; $i <= 100; $i++) {
        $fn = $firstNames[array_rand($firstNames)];
        $ln = $lastNames[array_rand($lastNames)];
        $username = strtolower($fn . $ln . rand(10, 999));
        $email = $username . "@example.com";
        $fullName = "$fn $ln";
        
        // Random date within the last 6 months
        $timestamp = rand(time() - (180 * 86400), time());
        $createdAt = date('Y-m-d H:i:s', $timestamp);

        $userStmt->execute([
            'username'      => $username,
            'full_name'     => $fullName,
            'email'         => $email,
            'password_hash' => $defaultPasswordHash,
            'created_at'    => $createdAt
        ]);

        $userIds[] = $pdo->lastInsertId();
    }
    $pdo->commit();
    echo "✅ 100 users inserted.<br>";

    // ----------------------------------------------------
    // 2. Seed 250 Letters
    // ----------------------------------------------------
    echo "<p>Generating letters...</p>";
    $letterStmt = $pdo->prepare("
        INSERT INTO letters (sender_id, recipient_id, subject, message, is_read, created_at)
        VALUES (:sender_id, :recipient_id, :subject, :message, :is_read, :created_at)
    ");

    $letterIds = [];
    $pdo->beginTransaction();

    for ($i = 0; $i < 250; $i++) {
        $senderId = $userIds[array_rand($userIds)];
        // Ensure recipient is not the sender
        do {
            $recipientId = $userIds[array_rand($userIds)];
        } while ($recipientId === $senderId);

        $subject = $letterSubjects[array_rand($letterSubjects)];
        $message = $letterBodies[array_rand($letterBodies)];
        $isRead = rand(0, 1);
        
        $timestamp = rand(time() - (90 * 86400), time());
        $createdAt = date('Y-m-d H:i:s', $timestamp);

        $letterStmt->execute([
            'sender_id'    => $senderId,
            'recipient_id' => $recipientId,
            'subject'      => $subject,
            'message'      => $message,
            'is_read'      => $isRead,
            'created_at'   => $createdAt
        ]);

        $letterIds[] = [
            'id' => $pdo->lastInsertId(),
            'sender_id' => $senderId,
            'recipient_id' => $recipientId
        ];
    }
    $pdo->commit();
    echo "✅ 250 letters created.<br>";

    // ----------------------------------------------------
    // 3. Seed Replies for Conversations
    // ----------------------------------------------------
    echo "<p>Generating replies...</p>";
    $replyStmt = $pdo->prepare("
        INSERT INTO letter_replies (letter_id, sender_id, message, is_read, created_at)
        VALUES (:letter_id, :sender_id, :message, :is_read, :created_at)
    ");

    $pdo->beginTransaction();
    foreach ($letterIds as $letter) {
        // 60% chance a letter has replies
        if (rand(1, 100) <= 60) {
            $numReplies = rand(1, 5);
            for ($r = 0; $r < $numReplies; $r++) {
                // Reply sender is alternate between recipient and sender
                $replySenderId = ($r % 2 === 0) ? $letter['recipient_id'] : $letter['sender_id'];
                $replyMessage = $replyMessages[array_rand($replyMessages)];
                $isRead = rand(0, 1);
                
                $timestamp = rand(time() - (30 * 86400), time());
                $createdAt = date('Y-m-d H:i:s', $timestamp);

                $replyStmt->execute([
                    'letter_id'  => $letter['id'],
                    'sender_id'  => $replySenderId,
                    'message'    => $replyMessage,
                    'is_read'    => $isRead,
                    'created_at' => $createdAt
                ]);
            }
        }
    }
    $pdo->commit();
    echo "✅ Letter replies generated.<br>";

    // Re-enable Foreign Key checks
    $pdo->exec("SET FOREIGN_KEY_CHECKS = 1;");

    echo "<h3>🎉 Seeding Complete!</h3>";
    echo "<p>All 100 dummy users have password: <code>password123</code></p>";

} catch (Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    echo "<h3 style='color:red;'>Seeding Failed: " . $e->getMessage() . "</h3>";
}