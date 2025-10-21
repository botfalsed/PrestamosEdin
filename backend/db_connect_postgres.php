<?php
$host = $_ENV['DB_HOST'] ?? 'localhost';
$user = $_ENV['DB_USER'] ?? 'postgres';
$password = $_ENV['DB_PASSWORD'] ?? 'solsolperez';
$database = $_ENV['DB_NAME'] ?? 'PrestamosEdin';
$port = $_ENV['DB_PORT'] ?? 5432;

try {
    // Crear conexión PDO para PostgreSQL
    $dsn = "pgsql:host=$host;port=$port;dbname=$database";
    $conn = new PDO($dsn, $user, $password, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);
    
    // Configurar zona horaria
    $conn->exec("SET timezone = 'America/Lima'");
    
} catch (PDOException $e) {
    die('Conexión fallida: ' . $e->getMessage());
}
?>