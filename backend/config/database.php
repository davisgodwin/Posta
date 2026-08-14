<?php

class Database {
    private string $host;
    private string $db_name;
    private string $username;
    private string $password;
    private string $port;
    public ?PDO $conn = null;

    public function __construct() {
        $this->host     = getenv('DB_HOST')     ?: 'localhost';
        $this->db_name  = getenv('DB_NAME')     ?: 'posta_db';
        $this->username = getenv('DB_USER')     ?: 'root';
        $this->password = getenv('DB_PASS')     ?: '';
        $this->port     = getenv('DB_PORT')     ?: '3306';
    }

    public function getConnection(): PDO {
        if ($this->conn instanceof PDO) {
            return $this->conn;
        }

        try {
            $dsn = sprintf(
                'mysql:host=%s;port=%s;dbname=%s;charset=utf8mb4',
                $this->host,
                $this->port,
                $this->db_name
            );

            $options = [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES   => false,
                PDO::ATTR_PERSISTENT         => false,
            ];

            // ===== SSL handling for remote hosts (Aiven, etc.) =====
            if ($this->host !== 'localhost' && $this->host !== '127.0.0.1') {

                // Option A – Recommended: Use a real CA certificate
                // 1. Download the Aiven CA from your Aiven console
                // 2. Store it as an environment variable (or place the file in the project)
                $caCert = getenv('DB_SSL_CA'); // full path or the PEM content

                if ($caCert && file_exists($caCert)) {
                    // Path to a real .pem / .crt file
                    $options[PDO::MYSQL_ATTR_SSL_CA] = $caCert;
                    $options[PDO::MYSQL_ATTR_SSL_VERIFY_SERVER_CERT] = true;
                } 
                elseif ($caCert) {
                    // You stored the PEM content itself in the env var
                    $options[PDO::MYSQL_ATTR_SSL_CA] = $caCert;
                    $options[PDO::MYSQL_ATTR_SSL_VERIFY_SERVER_CERT] = true;
                } 
                else {
                    // Temporary fallback while debugging (NOT for production)
                    // This disables certificate verification
                    $options[PDO::MYSQL_ATTR_SSL_VERIFY_SERVER_CERT] = false;
                }
            }

            $this->conn = new PDO($dsn, $this->username, $this->password, $options);
            return $this->conn;

        } catch (PDOException $e) {
            // Clean any previous output
            if (ob_get_length()) {
                ob_clean();
            }

            if (!headers_sent()) {
                http_response_code(500);
                header('Content-Type: application/json');
            }

            echo json_encode([
                'success'     => false,
                'message'     => 'Database Connection Failure.',
                'debug_error' => $e->getMessage()   // remove or gate this in production
            ]);
            exit();
        }
    }
}