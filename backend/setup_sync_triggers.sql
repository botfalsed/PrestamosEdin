-- =====================================================
-- CONFIGURACIÓN DE SINCRONIZACIÓN PARA POSTGRESQL
-- =====================================================

-- 1. Crear tabla para registrar cambios
CREATE TABLE IF NOT EXISTS cambios_sync (
    id_cambio SERIAL PRIMARY KEY,
    tabla VARCHAR(50) NOT NULL,
    id_registro INTEGER NOT NULL,
    tipo_accion VARCHAR(10) NOT NULL, -- INSERT, UPDATE, DELETE
    datos_cambio JSONB,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    sincronizado BOOLEAN DEFAULT FALSE
);

-- 2. Crear índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_cambios_sync_timestamp ON cambios_sync(timestamp);
CREATE INDEX IF NOT EXISTS idx_cambios_sync_sincronizado ON cambios_sync(sincronizado);
CREATE INDEX IF NOT EXISTS idx_cambios_sync_tabla ON cambios_sync(tabla);

-- 3. Función para registrar cambios
CREATE OR REPLACE FUNCTION registrar_cambio()
RETURNS TRIGGER AS $$
BEGIN
    -- Para INSERT
    IF TG_OP = 'INSERT' THEN
        INSERT INTO cambios_sync (tabla, id_registro, tipo_accion, datos_cambio)
        VALUES (TG_TABLE_NAME, NEW.id_prestamo, 'INSERT', row_to_json(NEW)::jsonb);
        RETURN NEW;
    END IF;
    
    -- Para UPDATE
    IF TG_OP = 'UPDATE' THEN
        INSERT INTO cambios_sync (tabla, id_registro, tipo_accion, datos_cambio)
        VALUES (TG_TABLE_NAME, NEW.id_prestamo, 'UPDATE', row_to_json(NEW)::jsonb);
        RETURN NEW;
    END IF;
    
    -- Para DELETE
    IF TG_OP = 'DELETE' THEN
        INSERT INTO cambios_sync (tabla, id_registro, tipo_accion, datos_cambio)
        VALUES (TG_TABLE_NAME, OLD.id_prestamo, 'DELETE', row_to_json(OLD)::jsonb);
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 4. Función específica para pagos
CREATE OR REPLACE FUNCTION registrar_cambio_pagos()
RETURNS TRIGGER AS $$
BEGIN
    -- Para INSERT
    IF TG_OP = 'INSERT' THEN
        INSERT INTO cambios_sync (tabla, id_registro, tipo_accion, datos_cambio)
        VALUES (TG_TABLE_NAME, NEW.id_pago, 'INSERT', row_to_json(NEW)::jsonb);
        RETURN NEW;
    END IF;
    
    -- Para UPDATE
    IF TG_OP = 'UPDATE' THEN
        INSERT INTO cambios_sync (tabla, id_registro, tipo_accion, datos_cambio)
        VALUES (TG_TABLE_NAME, NEW.id_pago, 'UPDATE', row_to_json(NEW)::jsonb);
        RETURN NEW;
    END IF;
    
    -- Para DELETE
    IF TG_OP = 'DELETE' THEN
        INSERT INTO cambios_sync (tabla, id_registro, tipo_accion, datos_cambio)
        VALUES (TG_TABLE_NAME, OLD.id_pago, 'DELETE', row_to_json(OLD)::jsonb);
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 5. Función específica para prestatarios
CREATE OR REPLACE FUNCTION registrar_cambio_prestatarios()
RETURNS TRIGGER AS $$
BEGIN
    -- Para INSERT
    IF TG_OP = 'INSERT' THEN
        INSERT INTO cambios_sync (tabla, id_registro, tipo_accion, datos_cambio)
        VALUES (TG_TABLE_NAME, NEW.id_prestatario, 'INSERT', row_to_json(NEW)::jsonb);
        RETURN NEW;
    END IF;
    
    -- Para UPDATE
    IF TG_OP = 'UPDATE' THEN
        INSERT INTO cambios_sync (tabla, id_registro, tipo_accion, datos_cambio)
        VALUES (TG_TABLE_NAME, NEW.id_prestatario, 'UPDATE', row_to_json(NEW)::jsonb);
        RETURN NEW;
    END IF;
    
    -- Para DELETE
    IF TG_OP = 'DELETE' THEN
        INSERT INTO cambios_sync (tabla, id_registro, tipo_accion, datos_cambio)
        VALUES (TG_TABLE_NAME, OLD.id_prestatario, 'DELETE', row_to_json(OLD)::jsonb);
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 6. Eliminar triggers existentes si existen
DROP TRIGGER IF EXISTS trigger_prestamos_sync ON prestamos;
DROP TRIGGER IF EXISTS trigger_pagos_sync ON pagos;
DROP TRIGGER IF EXISTS trigger_prestatarios_sync ON prestatarios;

-- 7. Crear triggers para cada tabla
CREATE TRIGGER trigger_prestamos_sync
    AFTER INSERT OR UPDATE OR DELETE ON prestamos
    FOR EACH ROW EXECUTE FUNCTION registrar_cambio();

CREATE TRIGGER trigger_pagos_sync
    AFTER INSERT OR UPDATE OR DELETE ON pagos
    FOR EACH ROW EXECUTE FUNCTION registrar_cambio_pagos();

CREATE TRIGGER trigger_prestatarios_sync
    AFTER INSERT OR UPDATE OR DELETE ON prestatarios
    FOR EACH ROW EXECUTE FUNCTION registrar_cambio_prestatarios();

-- 8. Insertar un cambio de prueba para verificar
INSERT INTO cambios_sync (tabla, id_registro, tipo_accion, datos_cambio) 
VALUES ('test', 0, 'INSERT', '{"mensaje": "Sistema de sincronización configurado correctamente"}'::jsonb);

-- 9. Mostrar resultado
SELECT 'Triggers de sincronización configurados correctamente' as resultado;
SELECT COUNT(*) as total_cambios FROM cambios_sync;