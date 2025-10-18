<?php
require_once 'db_connect_postgres.php';

try {
    echo "Conectando a la base de datos...\n";
    
    // Crear tabla cambios_sync
    $sql = "
    CREATE TABLE IF NOT EXISTS cambios_sync (
        id_cambio SERIAL PRIMARY KEY,
        tabla VARCHAR(50) NOT NULL,
        id_registro INTEGER NOT NULL,
        tipo_accion VARCHAR(10) NOT NULL,
        datos_cambio JSONB,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        sincronizado BOOLEAN DEFAULT FALSE
    );
    ";
    
    $conn->exec($sql);
    echo "Tabla cambios_sync creada correctamente.\n";
    
    // Crear índices
    $indices = [
        "CREATE INDEX IF NOT EXISTS idx_cambios_sync_timestamp ON cambios_sync(timestamp);",
        "CREATE INDEX IF NOT EXISTS idx_cambios_sync_sincronizado ON cambios_sync(sincronizado);",
        "CREATE INDEX IF NOT EXISTS idx_cambios_sync_tabla ON cambios_sync(tabla);"
    ];
    
    foreach ($indices as $indice) {
        $conn->exec($indice);
    }
    echo "Índices creados correctamente.\n";
    
    // Crear función para registrar cambios en prestamos
    $funcion_prestamos = "
    CREATE OR REPLACE FUNCTION registrar_cambio_prestamos()
    RETURNS TRIGGER AS \$\$
    BEGIN
        IF TG_OP = 'INSERT' THEN
            INSERT INTO cambios_sync (tabla, id_registro, tipo_accion, datos_cambio)
            VALUES (TG_TABLE_NAME, NEW.id_prestamo, 'INSERT', row_to_json(NEW)::jsonb);
            RETURN NEW;
        END IF;
        
        IF TG_OP = 'UPDATE' THEN
            INSERT INTO cambios_sync (tabla, id_registro, tipo_accion, datos_cambio)
            VALUES (TG_TABLE_NAME, NEW.id_prestamo, 'UPDATE', row_to_json(NEW)::jsonb);
            RETURN NEW;
        END IF;
        
        IF TG_OP = 'DELETE' THEN
            INSERT INTO cambios_sync (tabla, id_registro, tipo_accion, datos_cambio)
            VALUES (TG_TABLE_NAME, OLD.id_prestamo, 'DELETE', row_to_json(OLD)::jsonb);
            RETURN OLD;
        END IF;
        
        RETURN NULL;
    END;
    \$\$ LANGUAGE plpgsql;
    ";
    
    $conn->exec($funcion_prestamos);
    echo "Función para prestamos creada correctamente.\n";
    
    // Crear función para registrar cambios en pagos
    $funcion_pagos = "
    CREATE OR REPLACE FUNCTION registrar_cambio_pagos()
    RETURNS TRIGGER AS \$\$
    BEGIN
        IF TG_OP = 'INSERT' THEN
            INSERT INTO cambios_sync (tabla, id_registro, tipo_accion, datos_cambio)
            VALUES (TG_TABLE_NAME, NEW.id_pago, 'INSERT', row_to_json(NEW)::jsonb);
            RETURN NEW;
        END IF;
        
        IF TG_OP = 'UPDATE' THEN
            INSERT INTO cambios_sync (tabla, id_registro, tipo_accion, datos_cambio)
            VALUES (TG_TABLE_NAME, NEW.id_pago, 'UPDATE', row_to_json(NEW)::jsonb);
            RETURN NEW;
        END IF;
        
        IF TG_OP = 'DELETE' THEN
            INSERT INTO cambios_sync (tabla, id_registro, tipo_accion, datos_cambio)
            VALUES (TG_TABLE_NAME, OLD.id_pago, 'DELETE', row_to_json(OLD)::jsonb);
            RETURN OLD;
        END IF;
        
        RETURN NULL;
    END;
    \$\$ LANGUAGE plpgsql;
    ";
    
    $conn->exec($funcion_pagos);
    echo "Función para pagos creada correctamente.\n";
    
    // Crear triggers
    $triggers = [
        "DROP TRIGGER IF EXISTS trigger_prestamos_sync ON prestamos;",
        "CREATE TRIGGER trigger_prestamos_sync
         AFTER INSERT OR UPDATE OR DELETE ON prestamos
         FOR EACH ROW EXECUTE FUNCTION registrar_cambio_prestamos();",
        
        "DROP TRIGGER IF EXISTS trigger_pagos_sync ON pagos;",
        "CREATE TRIGGER trigger_pagos_sync
         AFTER INSERT OR UPDATE OR DELETE ON pagos
         FOR EACH ROW EXECUTE FUNCTION registrar_cambio_pagos();"
    ];
    
    foreach ($triggers as $trigger) {
        $conn->exec($trigger);
    }
    echo "Triggers creados correctamente.\n";
    
    echo "¡Configuración de sincronización completada!\n";
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>