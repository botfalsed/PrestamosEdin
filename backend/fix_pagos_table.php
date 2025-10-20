<?php
require_once 'db_connect_postgres.php';

echo "=== REPARANDO TABLA PAGOS ===\n";

try {
    // Verificar si la columna saldo_restante existe
    $stmt = $conn->prepare("
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'pagos' AND column_name = 'saldo_restante'
    ");
    $stmt->execute();
    $column_exists = $stmt->fetch();

    if (!$column_exists) {
        echo "❌ Columna 'saldo_restante' no existe. Agregándola...\n";
        
        // Agregar la columna saldo_restante
        $conn->exec("ALTER TABLE pagos ADD COLUMN saldo_restante NUMERIC(10,2) DEFAULT 0");
        echo "✅ Columna 'saldo_restante' agregada exitosamente\n";
        
        // Actualizar los valores existentes de saldo_restante
        echo "🔄 Actualizando valores de saldo_restante para pagos existentes...\n";
        
        // Primero, obtener todos los pagos y calcular el saldo restante correctamente
        $stmt = $conn->prepare("
            SELECT DISTINCT p.id_prestamo, p.monto_total
            FROM prestamos p
            INNER JOIN pagos pg ON p.id_prestamo = pg.id_prestamo
        ");
        $stmt->execute();
        $prestamos = $stmt->fetchAll();
        
        $updated_count = 0;
        foreach ($prestamos as $prestamo) {
            // Para cada préstamo, actualizar los pagos con el saldo restante correcto
            $stmt = $conn->prepare("
                UPDATE pagos 
                SET saldo_restante = (
                    ? - (
                        SELECT COALESCE(SUM(monto), 0)
                        FROM pagos pg2 
                        WHERE pg2.id_prestamo = ? 
                        AND pg2.fecha <= pagos.fecha
                    )
                )
                WHERE id_prestamo = ?
            ");
            $stmt->execute([$prestamo['monto_total'], $prestamo['id_prestamo'], $prestamo['id_prestamo']]);
            $updated_count += $stmt->rowCount();
        }
        
        echo "✅ Actualizados $updated_count registros de pagos\n";
        
    } else {
        echo "✅ Columna 'saldo_restante' ya existe\n";
    }

    // Verificar también si existe la columna cobrador_id
    $stmt = $conn->prepare("
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'pagos' AND column_name = 'cobrador_id'
    ");
    $stmt->execute();
    $cobrador_exists = $stmt->fetch();

    if (!$cobrador_exists) {
        echo "❌ Columna 'cobrador_id' no existe. Agregándola...\n";
        $conn->exec("ALTER TABLE pagos ADD COLUMN cobrador_id INTEGER DEFAULT 1");
        echo "✅ Columna 'cobrador_id' agregada exitosamente\n";
    } else {
        echo "✅ Columna 'cobrador_id' ya existe\n";
    }

    // Mostrar estructura final de la tabla pagos
    echo "\n=== ESTRUCTURA FINAL DE LA TABLA PAGOS ===\n";
    $stmt = $conn->prepare("
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'pagos'
        ORDER BY ordinal_position
    ");
    $stmt->execute();
    $columns = $stmt->fetchAll();
    
    foreach ($columns as $column) {
        echo "- {$column['column_name']}: {$column['data_type']} " . 
             ($column['is_nullable'] === 'NO' ? '(NOT NULL)' : '(NULLABLE)') . 
             ($column['column_default'] ? " DEFAULT {$column['column_default']}" : '') . "\n";
    }

    echo "\n✅ TABLA PAGOS REPARADA EXITOSAMENTE\n";

} catch (Exception $e) {
    echo "❌ ERROR: " . $e->getMessage() . "\n";
    exit(1);
}
?>