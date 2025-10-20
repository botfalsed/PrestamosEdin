<?php
/**
 * PrestamosEdin - Sistema de Gestión de Préstamos
 * Archivo principal que redirige a la API backend
 */

// Obtener la URI de la petición
$request_uri = $_SERVER['REQUEST_URI'];
$path = parse_url($request_uri, PHP_URL_PATH);

// Si es una petición a la API, configurar headers JSON y procesar
if (strpos($path, '/api') === 0 || strpos($path, 'api_postgres.php') !== false) {
    // Configuración para API
    header('Content-Type: application/json');
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization');

    // Manejar preflight requests
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(200);
        exit();
    }

    // Incluir el archivo principal de la API
    if (file_exists(__DIR__ . '/backend/api_postgres.php')) {
        include __DIR__ . '/backend/api_postgres.php';
    } else {
        http_response_code(404);
        echo json_encode(['error' => 'API endpoint not found']);
    }
} else {
    // Para el dashboard y otras rutas, servir el frontend React
    if (strpos($path, '/dashboard') === 0 || $path === '/') {
        if (file_exists(__DIR__ . '/build/index.html')) {
            // Configurar headers para HTML
            header('Content-Type: text/html; charset=utf-8');
            header('Access-Control-Allow-Origin: *');
            
            // Servir el archivo HTML del dashboard
            readfile(__DIR__ . '/build/index.html');
        } else {
            // Si no hay build, mostrar mensaje de error
            header('Content-Type: application/json');
            http_response_code(404);
            echo json_encode([
                'error' => 'Dashboard not built',
                'message' => 'Please run npm run build in the dashboard directory'
            ]);
        }
    } else {
        // Para archivos estáticos (CSS, JS, imágenes)
        $file_path = __DIR__ . '/build' . $path;
        if (file_exists($file_path) && is_file($file_path)) {
            // Determinar el tipo MIME
            $mime_types = [
                'css' => 'text/css',
                'js' => 'application/javascript',
                'png' => 'image/png',
                'jpg' => 'image/jpeg',
                'jpeg' => 'image/jpeg',
                'gif' => 'image/gif',
                'svg' => 'image/svg+xml',
                'ico' => 'image/x-icon',
                'json' => 'application/json',
                'txt' => 'text/plain'
            ];
            
            $extension = pathinfo($file_path, PATHINFO_EXTENSION);
            $mime_type = isset($mime_types[$extension]) ? $mime_types[$extension] : 'application/octet-stream';
            
            header('Content-Type: ' . $mime_type);
            readfile($file_path);
        } else {
            // Respuesta por defecto para rutas no encontradas
            header('Content-Type: application/json');
            echo json_encode([
                'message' => 'PrestamosEdin API',
                'version' => '1.0.0',
                'status' => 'running',
                'endpoints' => [
                    'GET /api/prestamos' => 'Obtener todos los préstamos',
                    'POST /api/prestamos' => 'Crear nuevo préstamo',
                    'GET /api/clientes' => 'Obtener todos los clientes',
                    'POST /api/clientes' => 'Crear nuevo cliente'
                ],
                'dashboard' => '/dashboard'
            ]);
        }
    }
}
?>