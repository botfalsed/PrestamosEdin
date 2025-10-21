-- =====================================================
-- SCRIPT PARA CONFIGURAR USUARIO ADMIN EN RAILWAY
-- =====================================================

-- Crear tabla admin si no existe
CREATE TABLE IF NOT EXISTS admin (
    id_admin SERIAL PRIMARY KEY,
    usuario VARCHAR(50) NOT NULL,
    nombre_completo VARCHAR(100),
    contraseña VARCHAR(255) NOT NULL,
    password VARCHAR(255),
    rol VARCHAR(20) DEFAULT 'cobrador' CHECK (rol IN ('admin', 'cobrador')),
    activo SMALLINT DEFAULT 1 CHECK (activo IN (0, 1)),
    ultima_conexion TIMESTAMP
);

-- Eliminar usuario admin existente si existe
DELETE FROM admin WHERE usuario = 'admin';

-- Insertar usuario admin con contraseña en texto plano
INSERT INTO admin (usuario, nombre_completo, contraseña, password, rol, activo) 
VALUES ('admin', 'Administrador del Sistema', 'admin', 'admin', 'admin', 1);

-- Verificar que se creó correctamente
SELECT usuario, contraseña, password, rol, activo FROM admin WHERE usuario = 'admin';

-- =====================================================
-- INSTRUCCIONES PARA RAILWAY:
-- 1. Conectarse a la base de datos PostgreSQL en Railway
-- 2. Ejecutar este script completo
-- 3. Verificar que el usuario admin existe con contraseña 'admin'
-- =====================================================