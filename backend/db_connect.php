<?php
$host = 'localhost';
$user = 'root'; // Cambia si usas otro usuario en XAMPP
$password = ''; // Por defecto, XAMPP no usa contraseña para root
$database = 'prestamos_db';

$conn = new mysqli($host, $user, $password, $database);
if ($conn->connect_error) {
    die('Conexión fallida: ' . $conn->connect_error);
}
?>