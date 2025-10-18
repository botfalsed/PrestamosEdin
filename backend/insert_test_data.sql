-- Insertar 5 prestatarios de prueba
INSERT INTO prestatarios (nombre, apellido, cedula, telefono, direccion, email, fecha_registro) VALUES 
('Juan Carlos', 'Pérez González', '12345678', '809-555-0101', 'Calle Principal #123, Santo Domingo', 'juan.perez@email.com', NOW()),
('María Elena', 'Rodríguez López', '23456789', '809-555-0102', 'Av. Independencia #456, Santiago', 'maria.rodriguez@email.com', NOW()),
('Pedro Antonio', 'Martínez Silva', '34567890', '809-555-0103', 'Calle Duarte #789, La Vega', 'pedro.martinez@email.com', NOW()),
('Ana Sofía', 'García Fernández', '45678901', '809-555-0104', 'Av. 27 de Febrero #321, Santo Domingo', 'ana.garcia@email.com', NOW()),
('Luis Miguel', 'Hernández Castro', '56789012', '809-555-0105', 'Calle Mella #654, San Cristóbal', 'luis.hernandez@email.com', NOW());

-- Insertar 1 préstamo por cada prestatario
INSERT INTO prestamos (id_prestatario, monto, tasa_interes, plazo_meses, fecha_prestamo, estado, cuota_mensual) VALUES 
(1, 50000.00, 15.00, 12, NOW(), 'activo', 4791.67),
(2, 75000.00, 12.00, 18, NOW(), 'activo', 4861.11),
(3, 30000.00, 18.00, 6, NOW(), 'activo', 5416.67),
(4, 100000.00, 10.00, 24, NOW(), 'activo', 4614.49),
(5, 25000.00, 20.00, 9, NOW(), 'activo', 3194.44);