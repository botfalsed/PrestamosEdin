<?php
/**
 * PrestamosEdin - Sistema de Gestión de Préstamos
 * Archivo principal que redirige a la API backend
 */

// Configuración básica
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Manejar preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Redirigir todas las peticiones de API al backend
$request_uri = $_SERVER['REQUEST_URI'];

// Si es una petición a la API, incluir el archivo correspondiente del backend
if (strpos($request_uri, '/api') === 0 || strpos($request_uri, 'api_postgres.php') !== false) {
    // Incluir el archivo principal de la API
    if (file_exists(__DIR__ . '/backend/api_postgres.php')) {
        include __DIR__ . '/backend/api_postgres.php';
    } else {
        http_response_code(404);
        echo json_encode(['error' => 'API endpoint not found']);
    }
} else {
    // Para cualquier otra ruta, servir el frontend React
    if (file_exists(__DIR__ . '/build/index.html')) {
        include __DIR__ . '/build/index.html';
    } else {
        // Respuesta por defecto si no hay build del frontend
        echo json_encode([
            'message' => 'PrestamosEdin API',
            'version' => '1.0.0',
            'status' => 'running',
            'endpoints' => [
                'GET /api/prestamos' => 'Obtener todos los préstamos',
                'POST /api/prestamos' => 'Crear nuevo préstamo',
                'GET /api/clientes' => 'Obtener todos los clientes',
                'POST /api/clientes' => 'Crear nuevo cliente'
            ]
        ]);
    }
}
?>