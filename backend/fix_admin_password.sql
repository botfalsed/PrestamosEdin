-- =====================================================
-- SCRIPT PARA CAMBIAR LA CONTRASEÑA DEL ADMIN
-- =====================================================

-- Opción 1: Cambiar la contraseña del usuario existente
UPDATE admin 
SET "contraseña" = 'admin' 
WHERE usuario = 'admin';

-- Opción 2: Si prefieres cambiar el nombre de la columna a 'password'
-- ALTER TABLE admin RENAME COLUMN "contraseña" TO password;
-- UPDATE admin SET password = 'admin' WHERE usuario = 'admin';

-- Verificar el cambio
SELECT usuario, "contraseña" FROM admin WHERE usuario = 'admin';

-- =====================================================
-- INSTRUCCIONES:
-- 1. Ejecuta la línea 6-8 para cambiar la contraseña
-- 2. Ejecuta la línea 13 para verificar el cambio
-- =====================================================