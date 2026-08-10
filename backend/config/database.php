<?php
class Database {
    private $host = "localhost";
    private $db_name = "posta_db";
    private $username = "root";
    private $password = "";
    public $conn;

    public function getConnection() {
        $this->conn = null;
        try {
            $this->conn = new PDO(
                "mysql:host=" . $this->host . ";dbname=" . $this->db_name . ";charset=utf8mb4",
                $this->username,
                $this->password,
                [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_EMULATE_PREPARES => false,
                ]
            );
        } catch(PDOException $exception) {
            if (!headers_sent()) {
                http_response_code(500);
                header("Content-Type: application/json");
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