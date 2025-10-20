<?php
require_once 'db_connect_postgres.php';

echo "=== ACTUALIZANDO MONTO_TOTAL ===\n";

try {
    $stmt = $conn->prepare('UPDATE prestamos SET monto_total = monto_inicial WHERE monto_total IS NULL');
    $stmt->execute();
    $affected = $stmt->rowCount();
    echo "✅ Actualizados $affected registros\n";
    
    // Verificar los resultados
    echo "\n=== VERIFICANDO RESULTADOS ===\n";
    $stmt = $conn->prepare('SELECT id_prestamo, monto_inicial, monto_total FROM prestamos LIMIT 5');
    $stmt->execute();
    $prestamos = $stmt->fetchAll();
    
    foreach ($prestamos as $prestamo) {
        echo "ID: {$prestamo['id_prestamo']}, Inicial: {$prestamo['monto_inicial']}, Total: {$prestamo['monto_total']}\n";
    }
    
} catch (Exception $e) {
    echo "❌ ERROR: " . $e->getMessage() . "\n";
    exit(1);
}
?>