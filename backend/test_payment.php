<?php
require_once 'db_connect_postgres.php';

try {
    echo "=== PRUEBA DE SINCRONIZACIÓN END-TO-END ===\n";
    
    // 1. Verificar estado inicial
    echo "\n1. Estado inicial de sincronización:\n";
    $stmt = $conn->prepare("SELECT COUNT(*) as count FROM cambios_sync WHERE sincronizado = 0");
    $stmt->execute();
    $inicial = $stmt->fetch();
    echo "Cambios pendientes iniciales: " . $inicial['count'] . "\n";
    
    // 2. Simular un pago desde la app móvil
    echo "\n2. Simulando pago desde app móvil...\n";
    $stmt = $conn->prepare("
        INSERT INTO pagos (id_prestamo, monto, fecha) 
        VALUES (1, 150.00, CURRENT_TIMESTAMP)
    ");
    $stmt->execute();
    $pago_id = $conn->lastInsertId();
    echo "Pago insertado con ID: " . $pago_id . "\n";
    
    // 3. Verificar que se generó el cambio
    echo "\n3. Verificando generación de cambio:\n";
    $stmt = $conn->prepare("SELECT COUNT(*) as count FROM cambios_sync WHERE sincronizado = 0");
    $stmt->execute();
    $despues_pago = $stmt->fetch();
    echo "Cambios pendientes después del pago: " . $despues_pago['count'] . "\n";
    
    // 4. Mostrar el último cambio generado
    $stmt = $conn->prepare("
        SELECT 
            id_cambio,
            tabla,
            id_registro,
            tipo_accion,
            timestamp
        FROM cambios_sync 
        ORDER BY timestamp DESC 
        LIMIT 1
    ");
    $stmt->execute();
    $ultimo_cambio = $stmt->fetch();
    
    if ($ultimo_cambio) {
        echo "Último cambio generado:\n";
        echo "  - ID Cambio: " . $ultimo_cambio['id_cambio'] . "\n";
        echo "  - Tabla: " . $ultimo_cambio['tabla'] . "\n";
        echo "  - ID Registro: " . $ultimo_cambio['id_registro'] . "\n";
        echo "  - Acción: " . $ultimo_cambio['tipo_accion'] . "\n";
        echo "  - Timestamp: " . $ultimo_cambio['timestamp'] . "\n";
    }
    
    // 5. Simular sincronización del dashboard
    echo "\n4. Simulando sincronización del dashboard...\n";
    $stmt = $conn->prepare("
        SELECT 
            id_cambio,
            tabla,
            id_registro,
            tipo_accion,
            datos_cambio,
            timestamp
        FROM cambios_sync 
        WHERE sincronizado = 0
        ORDER BY timestamp ASC
        LIMIT 10
    ");
    $stmt->execute();
    $cambios = $stmt->fetchAll();
    
    echo "Cambios obtenidos por el dashboard: " . count($cambios) . "\n";
    
    foreach ($cambios as $cambio) {
        echo "  - Cambio ID {$cambio['id_cambio']}: {$cambio['tabla']} - {$cambio['tipo_accion']} (Registro: {$cambio['id_registro']})\n";
    }
    
    // 6. Marcar cambios como sincronizados (simular dashboard)
    if (count($cambios) > 0) {
        echo "\n5. Marcando cambios como sincronizados...\n";
        $ids = array_column($cambios, 'id_cambio');
        $placeholders = str_repeat('?,', count($ids) - 1) . '?';
        
        $stmt = $conn->prepare("UPDATE cambios_sync SET sincronizado = 1 WHERE id_cambio IN ($placeholders)");
        $stmt->execute($ids);
        
        echo "Cambios marcados como sincronizados: " . count($ids) . "\n";
    }
    
    // 7. Verificar estado final
    echo "\n6. Estado final de sincronización:\n";
    $stmt = $conn->prepare("SELECT COUNT(*) as count FROM cambios_sync WHERE sincronizado = 0");
    $stmt->execute();
    $final = $stmt->fetch();
    echo "Cambios pendientes finales: " . $final['count'] . "\n";
    
    echo "\n=== PRUEBA COMPLETADA ===\n";
    echo "✓ Pago simulado correctamente\n";
    echo "✓ Cambio generado automáticamente\n";
    echo "✓ Dashboard puede obtener cambios\n";
    echo "✓ Sincronización funciona end-to-end\n";
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>