-- =====================================================
-- MIGRACIÓN DE ESQUEMA MYSQL A POSTGRESQL
-- Base de datos: PrestamosEdin
-- Fecha: $(date)
-- =====================================================

-- Crear la base de datos (ejecutar como superusuario)
-- CREATE DATABASE "PrestamosEdin" WITH ENCODING 'UTF8';

-- Conectar a la base de datos PrestamosEdin antes de ejecutar el resto
-- \c PrestamosEdin;

-- =====================================================
-- TABLA: admin
-- =====================================================
CREATE TABLE admin (
    id_admin SERIAL PRIMARY KEY,
    usuario VARCHAR(50) NOT NULL,
    nombre_completo VARCHAR(100),
    contraseña VARCHAR(255) NOT NULL,
    rol VARCHAR(20) DEFAULT 'cobrador' CHECK (rol IN ('admin', 'cobrador')),
    activo SMALLINT DEFAULT 1 CHECK (activo IN (0, 1)),
    ultima_conexion TIMESTAMP
);

-- =====================================================
-- TABLA: cambios_sync
-- =====================================================
CREATE TABLE cambios_sync (
    id_cambio SERIAL PRIMARY KEY,
    tabla VARCHAR(50) NOT NULL,
    id_registro INTEGER NOT NULL,
    tipo_accion VARCHAR(10) NOT NULL CHECK (tipo_accion IN ('INSERT', 'UPDATE', 'DELETE')),
    datos_cambio TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    sincronizado SMALLINT DEFAULT 0 CHECK (sincronizado IN (0, 1))
);

-- =====================================================
-- TABLA: prestatarios
-- =====================================================
CREATE TABLE prestatarios (
    id_prestatario SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    direccion VARCHAR(255),
    telefono VARCHAR(20),
    estado VARCHAR(20) DEFAULT 'activo' CHECK (estado IN ('activo', 'moroso', 'inactivo')),
    dni INTEGER UNIQUE NOT NULL
);

-- =====================================================
-- TABLA: prestamos
-- =====================================================
CREATE TABLE prestamos (
    id_prestamo SERIAL PRIMARY KEY,
    id_prestatario INTEGER NOT NULL,
    monto_inicial DECIMAL(10,2) NOT NULL,
    tasa_interes DECIMAL(5,2) NOT NULL,
    fecha_inicio TIMESTAMP NOT NULL,
    saldo_pendiente DECIMAL(10,2) NOT NULL,
    tipo_periodo VARCHAR(20) DEFAULT 'dias',
    cantidad_periodo INTEGER DEFAULT 30,
    fecha_primer_pago DATE,
    fecha_ultimo_pago DATE,
    monto_total DECIMAL(10,2),
    estado VARCHAR(20) DEFAULT 'activo',
    FOREIGN KEY (id_prestatario) REFERENCES prestatarios(id_prestatario) ON DELETE CASCADE
);

-- =====================================================
-- TABLA: pagos
-- =====================================================
CREATE TABLE pagos (
    id_pago SERIAL PRIMARY KEY,
    id_prestamo INTEGER NOT NULL,
    monto DECIMAL(10,2) NOT NULL,
    fecha TIMESTAMP NOT NULL,
    FOREIGN KEY (id_prestamo) REFERENCES prestamos(id_prestamo) ON DELETE CASCADE
);

-- =====================================================
-- ÍNDICES PARA OPTIMIZACIÓN
-- =====================================================

-- Índices para tabla admin
CREATE INDEX idx_admin_usuario ON admin(usuario);
CREATE INDEX idx_admin_activo ON admin(activo);

-- Índices para tabla cambios_sync
CREATE INDEX idx_cambios_sync_tabla ON cambios_sync(tabla);
CREATE INDEX idx_cambios_sync_sincronizado ON cambios_sync(sincronizado);
CREATE INDEX idx_cambios_sync_timestamp ON cambios_sync(timestamp);

-- Índices para tabla prestatarios
CREATE INDEX idx_prestatarios_dni ON prestatarios(dni);
CREATE INDEX idx_prestatarios_estado ON prestatarios(estado);
CREATE INDEX idx_prestatarios_nombre ON prestatarios(nombre);

-- Índices para tabla prestamos
CREATE INDEX idx_prestamos_prestatario ON prestamos(id_prestatario);
CREATE INDEX idx_prestamos_estado ON prestamos(estado);
CREATE INDEX idx_prestamos_fecha_inicio ON prestamos(fecha_inicio);
CREATE INDEX idx_prestamos_saldo ON prestamos(saldo_pendiente);

-- Índices para tabla pagos
CREATE INDEX idx_pagos_prestamo ON pagos(id_prestamo);
CREATE INDEX idx_pagos_fecha ON pagos(fecha);

-- =====================================================
-- DATOS INICIALES (OPCIONAL)
-- =====================================================

-- Insertar usuario administrador por defecto
INSERT INTO admin (usuario, nombre_completo, contraseña, rol, activo) 
VALUES ('admin', 'Administrador del Sistema', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', 1);

-- =====================================================
-- COMENTARIOS SOBRE LA MIGRACIÓN
-- =====================================================

/*
CAMBIOS PRINCIPALES DE MYSQL A POSTGRESQL:

1. AUTO_INCREMENT → SERIAL (genera automáticamente secuencias)
2. INT(11) → INTEGER
3. TINYINT(1) → SMALLINT con CHECK constraint para simular boolean
4. ENUM → VARCHAR con CHECK constraint
5. datetime → TIMESTAMP
6. decimal(10,2) → DECIMAL(10,2) (compatible)
7. Agregados CHECK constraints para validación de datos
8. CURRENT_TIMESTAMP funciona igual en ambos
9. Claves foráneas con ON DELETE CASCADE para integridad referencial
10. Índices agregados para optimización de consultas

NOTAS IMPORTANTES:
- Los SERIAL en PostgreSQL crean secuencias automáticamente
- Los CHECK constraints reemplazan las validaciones ENUM de MySQL
- Las claves foráneas mantienen integridad referencial
- Los índices mejoran el rendimiento de consultas frecuentes
*/