<?php
/**
 * Script de configuración automática de base de datos para Heroku
 * Se ejecuta automáticamente después de la instalación de Composer
 */

echo "🚀 Configurando base de datos PostgreSQL en Heroku...\n";

// Obtener la URL de la base de datos de Heroku
$database_url = getenv('DATABASE_URL');

if (!$database_url) {
    echo "⚠️  DATABASE_URL no encontrada. Esto es normal en desarrollo local.\n";
    echo "✅ El script se ejecutará automáticamente en Heroku.\n";
    exit(0);
}

echo "✅ DATABASE_URL encontrada: " . substr($database_url, 0, 30) . "...\n";

try {
    // Parsear la URL de la base de datos
    $db_parts = parse_url($database_url);
    
    $host = $db_parts['host'];
    $port = $db_parts['port'];
    $dbname = ltrim($db_parts['path'], '/');
    $username = $db_parts['user'];
    $password = $db_parts['pass'];
    
    // Crear conexión PDO
    $dsn = "pgsql:host=$host;port=$port;dbname=$dbname;sslmode=require";
    $pdo = new PDO($dsn, $username, $password, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);
    
    echo "✅ Conexión a PostgreSQL establecida.\n";
    
    // Leer y ejecutar el archivo SQL
    $sql_file = __DIR__ . '/prestamodb.sql';
    
    if (!file_exists($sql_file)) {
        throw new Exception("Archivo prestamodb.sql no encontrado");
    }
    
    $sql_content = file_get_contents($sql_file);
    
    // Ejecutar el SQL
    $pdo->exec($sql_content);
    
    echo "✅ Base de datos configurada exitosamente.\n";
    
    // Verificar que las tablas se crearon
    $stmt = $pdo->query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
    $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
    
    echo "✅ Tablas creadas: " . implode(', ', $tables) . "\n";
    
    // Crear archivo de configuración para la APK
    $config = [
        'api_url' => 'https://' . getenv('HEROKU_APP_NAME') . '.herokuapp.com',
        'database_configured' => true,
        'setup_date' => date('Y-m-d H:i:s'),
        'tables_count' => count($tables)
    ];
    
    file_put_contents(__DIR__ . '/heroku_config.json', json_encode($config, JSON_PRETTY_PRINT));
    
    echo "✅ Configuración guardada en heroku_config.json\n";
    echo "🎉 ¡Setup completado! Tu backend está listo en Heroku.\n";
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    echo "⚠️  Revisa la configuración de la base de datos.\n";
    exit(1);
}
?>