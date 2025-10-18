<?php
$host = 'localhost';
$port = 5432;
$dbname = 'PrestamosEdin';
$user = 'postgres';
$password = 'solsolperez';

try {
    $pdo = new PDO("pgsql:host=$host;port=$port;dbname=$dbname", $user, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Verificar si existe la tabla de sincronización
    $stmt = $pdo->query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE '%sincroniz%'");
    $tables = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo "Tablas de sincronización encontradas:\n";
    foreach($tables as $table) {
        echo "- " . $table['table_name'] . "\n";
    }
    
    // Verificar cambios pendientes (si existe la tabla)
    $stmt = $pdo->query("SELECT COUNT(*) as total FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'cambios_sincronizacion'");
    $tableExists = $stmt->fetch(PDO::FETCH_ASSOC)['total'] > 0;
    
    if ($tableExists) {
        $stmt = $pdo->query('SELECT COUNT(*) as total FROM cambios_sincronizacion WHERE sincronizado = 0');
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        echo "Cambios pendientes en BD: " . $result['total'] . "\n";
        
        // Ver algunos registros pendientes
        $stmt = $pdo->query('SELECT * FROM cambios_sincronizacion WHERE sincronizado = 0 LIMIT 5');
        $cambios = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo "Registros pendientes:\n";
        foreach($cambios as $cambio) {
            echo "- ID: " . $cambio['id'] . ", Tabla: " . $cambio['tabla'] . ", Operacion: " . $cambio['operacion'] . "\n";
        }
        
        // Verificar último timestamp de sincronización
        $stmt = $pdo->query('SELECT MAX(timestamp_cambio) as ultimo_cambio FROM cambios_sincronizacion');
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        echo "Último cambio: " . $result['ultimo_cambio'] . "\n";
    } else {
        echo "La tabla cambios_sincronizacion no existe.\n";
        
        // Verificar si hay datos en las tablas principales
        $stmt = $pdo->query('SELECT COUNT(*) as total FROM prestamos');
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        echo "Total prestamos: " . $result['total'] . "\n";
        
        $stmt = $pdo->query('SELECT COUNT(*) as total FROM pagos');
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        echo "Total pagos: " . $result['total'] . "\n";
    }
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>