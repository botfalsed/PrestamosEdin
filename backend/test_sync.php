<?php
require_once 'db_connect_postgres.php';

try {
    echo "Verificando tabla de sincronización...\n";
    
    // Verificar si existe la tabla cambios_sync
    $stmt = $conn->prepare("SELECT COUNT(*) as count FROM cambios_sync");
    $stmt->execute();
    $result = $stmt->fetch();
    
    echo "Registros en cambios_sync: " . $result['count'] . "\n";
    
    // Mostrar los últimos 5 cambios
    $stmt = $conn->prepare("
        SELECT 
            id_cambio,
            tabla,
            id_registro,
            tipo_accion,
            timestamp,
            sincronizado
        FROM cambios_sync 
        ORDER BY timestamp DESC 
        LIMIT 5
    ");
    $stmt->execute();
    $cambios = $stmt->fetchAll();
    
    if (count($cambios) > 0) {
        echo "\nÚltimos cambios registrados:\n";
        foreach ($cambios as $cambio) {
            echo "ID: {$cambio['id_cambio']}, Tabla: {$cambio['tabla']}, Registro: {$cambio['id_registro']}, Acción: {$cambio['tipo_accion']}, Sincronizado: " . ($cambio['sincronizado'] ? 'Sí' : 'No') . ", Timestamp: {$cambio['timestamp']}\n";
        }
    } else {
        echo "\nNo hay cambios registrados aún.\n";
    }
    
    // Verificar cambios pendientes
    $stmt = $conn->prepare("SELECT COUNT(*) as count FROM cambios_sync WHERE sincronizado = 0");
    $stmt->execute();
    $pendientes = $stmt->fetch();
    
    echo "\nCambios pendientes de sincronizar: " . $pendientes['count'] . "\n";
    
    // Insertar un registro de prueba en pagos para generar un cambio
    echo "\nInsertando registro de prueba para generar cambio...\n";
    $stmt = $conn->prepare("
        INSERT INTO pagos (id_prestamo, monto_pago, fecha_pago, metodo_pago, observaciones) 
        VALUES (1, 100.00, CURRENT_DATE, 'efectivo', 'Pago de prueba para sincronización')
    ");
    $stmt->execute();
    
    echo "Registro de prueba insertado.\n";
    
    // Verificar si se generó el cambio
    $stmt = $conn->prepare("SELECT COUNT(*) as count FROM cambios_sync WHERE sincronizado = 0");
    $stmt->execute();
    $nuevos_pendientes = $stmt->fetch();
    
    echo "Cambios pendientes después de la inserción: " . $nuevos_pendientes['count'] . "\n";
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>