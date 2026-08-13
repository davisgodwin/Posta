<?php
class Database {
    private $host;
    private $db_name;
    private $username;
    private $password;
    private $port;
    public $conn;

    public function __construct() {
        // Read environment variables provided by Render, falling back to local defaults
        $this->host     = getenv('DB_HOST') ?: "localhost";
        $this->db_name  = getenv('DB_NAME') ?: "posta_db";
        $this->username = getenv('DB_USER') ?: "root";
        $this->password = getenv('DB_PASS') ?: "";
        $this->port     = getenv('DB_PORT') ?: "3306";
    }

    public function getConnection() {
        $this->conn = null;
        try {
            $dsn = "mysql:host=" . $this->host . ";port=" . $this->port . ";dbname=" . $this->db_name . ";charset=utf8mb4";
            
            $options = [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
            ];

            // If connecting to remote Aiven host (not localhost), force SSL mode
            if ($this->host !== "localhost" && $this->host !== "127.0.0.1") {
                $options[PDO::MYSQL_ATTR_SSL_CA] = true;
                $options[PDO::MYSQL_ATTR_SSL_VERIFY_SERVER_CERT] = false;
            }

            $this->conn = new PDO(
                $dsn,
                $this->username,
                $this->password,
                $options
            );
        } catch(PDOException $exception) {
            if (!headers_sent()) {
                http_response_code(500);
                header("Content-Type: application/json; charset=UTF-8");
            }
            echo json_encode(["success" => false, "message" => "Database Connection Error: " . $exception->getMessage()]);
            exit();
        }
        return $this->conn;
    }
}

// Global $pdo instance to prevent 'Undefined variable $pdo' in legacy endpoints
$databaseInstance = new Database();
$pdo = $databaseInstance->getConnection();