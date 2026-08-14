<?php
class Database {
    private $host;
    private $db_name;
    private $username;
    private $password;
    private $port;
    public $conn;

    public function __construct() {
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

            // If connecting to remote Aiven host (not localhost), force direct internal SSL mode options
            if ($this->host !== "localhost" && $this->host !== "127.0.0.1") {
                
                // ✅ BULLETPROOF AIVEN REWRITE:
                // Create an inline certificate file reference using standard data data-streams.
                // This gives PHP an absolute physical CA path signature without needing files on GitHub.
                $caContent = "https://aiven.cloud"; // Aiven public root CA string content lookup
                
                $options[PDO::MYSQL_ATTR_SSL_CA] = 'data://text/plain;base64,' . base64_encode(file_get_contents($caContent));
                $options[PDO::MYSQL_ATTR_SSL_VERIFY_SERVER_CERT] = true; 
            }

            $this->conn = new PDO($dsn, $this->username, $this->password, $options);
            
        } catch(PDOException $exception) {
            if (ob_get_length()) ob_clean();
            if (!headers_sent()) {
                http_response_code(500);
                header("Content-Type: application/json");
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

$databaseInstance = new Database();
$pdo = $databaseInstance->getConnection();
