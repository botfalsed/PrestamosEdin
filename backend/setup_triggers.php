<?php
$host = 'localhost';
$dbname = 'PrestamosEdin';
$username = 'postgres';
$password = 'solsolperez';

try {
    $pdo = new PDO("pgsql:host=$host;dbname=$dbname", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    echo "Conectado a PostgreSQL correctamente\n";
    
    $sql = file_get_contents('setup_sync_triggers.sql');
    $pdo->exec($sql);
    
    echo "✓ Triggers de sincronización configurados correctamente\n";
    
    // Verificar que la tabla existe
    $stmt = $pdo->query("SELECT COUNT(*) FROM cambios_sync");
    $count = $stmt->fetchColumn();
    echo "✓ Tabla cambios_sync creada con $count registros\n";
    
    // Mostrar los últimos cambios
    $stmt = $pdo->query("SELECT * FROM cambios_sync ORDER BY timestamp DESC LIMIT 5");
    $cambios = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo "\nÚltimos cambios registrados:\n";
    foreach ($cambios as $cambio) {
        echo "- {$cambio['tabla']}: {$cambio['tipo_accion']} (ID: {$cambio['id_registro']})\n";
    }
    
} catch (PDOException $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>