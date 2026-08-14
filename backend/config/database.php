<?php
class Database {
    private $host;
    private $db_name;
    private $username;
    private $password;
    private $port;
    public $conn;

    public function __construct() {
        // Automatically injects Render environment variables, falling back to local defaults
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
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES   => false,
            ];

            // Enforce secure Aiven cluster configurations if hosted remotely
            if ($this->host !== "localhost" && $this->host !== "127.0.0.1") {
                // ✅ FIXED: Map the SSL mode constant safely inside the existing options array
                if (defined('PDO::MYSQL_ATTR_SSL_MODE')) {
                    $options[PDO::MYSQL_ATTR_SSL_MODE] = 1; // 1 represents 'REQUIRED' mode
                } else {
                    $options[1009] = 1; // Direct fallback to integer constant mapping assignment code
                }
                
                // Explicitly disable strict file certificate validation on the container host
                $options[PDO::MYSQL_ATTR_SSL_VERIFY_SERVER_CERT] = false;
            }

            $this->conn = new PDO($dsn, $this->username, $this->password, $options);
            
        } catch(PDOException $exception) {
            // Prevent debug strings from breaking JSON structures
            if (ob_get_length()) ob_clean();
            
            if (!headers_sent()) {
                http_response_code(500);
                header("Content-Type: application/json; charset=UTF-8");
            }
            
            echo json_encode([
                "success" => false, 
                "message" => "Database Connection Failure.",
                "debug_error" => $exception->getMessage()
            ]);
            exit();
        }
        return $this->conn;
    }
}

// Global variable export initialization instance execution 
$databaseInstance = new Database();
$pdo = $databaseInstance->getConnection();
