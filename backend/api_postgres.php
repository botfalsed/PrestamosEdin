<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE');
header('Access-Control-Allow-Headers: Content-Type');

require 'vendor/autoload.php';
use PhpOffice\PhpSpreadsheet\IOFactory;

// Incluir configuración PostgreSQL
require_once 'db_connect_postgres.php';

$action = $_GET['action'] ?? '';

// LOGIN
if ($_SERVER['REQUEST_METHOD'] === 'POST' && $action === 'login') {
    $raw_input = file_get_contents('php://input');
    $data = json_decode($raw_input, true);
    
    // DEBUG: Input data received
    error_log("=== DEBUG LOGIN START ===");
    error_log("Raw input: " . $raw_input);
    error_log("Decoded data: " . print_r($data, true));
    
    $usuario = $data['usuario'] ?? '';
    $password = $data['password'] ?? '';
    
    // DEBUG: Extracted credentials
    error_log("Usuario extraído: '$usuario'");
    error_log("Password extraído: '$password'");

    if (empty($usuario) || empty($password)) {
        error_log("ERROR: Campos vacíos detectados");
        echo json_encode(['success' => false, 'error' => 'Usuario y contraseña requeridos', 'debug' => ['raw' => $raw_input, 'data' => $data]]);
        exit();
    }

    // DEBUG: Connection Status Check
    try {
        error_log("Estado de conexión a PostgreSQL: " . ($conn ? "CONECTADO" : "NO CONECTADO"));
        error_log("Tipo de conexión: " . get_class($conn));
    } catch (Exception $e) {
        error_log("ERROR verificando conexión: " . $e->getMessage());
    }

    // DEBUG: SQL Query Check
    $query = 'SELECT id_admin, usuario, password FROM admin WHERE usuario = ?';
    error_log("Consulta SQL para PostgreSQL: $query");
    error_log("Parámetro de búsqueda: '$usuario'");
    
    $stmt = $conn->prepare($query);
    $stmt->execute([$usuario]);
    $admin = $stmt->fetch();

    // DEBUG: Result Check
    error_log("Resultado de la consulta (Usuario encontrado): " . ($admin ? "SÍ" : "NO"));
    if ($admin) {
        error_log("Datos del usuario encontrado: " . print_r($admin, true));
        error_log("Password HASH de la BD: '" . $admin['password'] . "'");
        error_log("Password enviado por usuario: '$password'");
        error_log("¿Passwords coinciden?: " . ($password === $admin['password'] ? "SÍ" : "NO"));
    }

    // Comparación directa de texto plano (sin hash)
    if ($admin && $password === $admin['password']) {
        error_log("LOGIN EXITOSO para usuario: $usuario");
        echo json_encode(['success' => true, 'message' => 'Login exitoso']);
    } else {
        error_log("LOGIN FALLIDO para usuario: $usuario");
        echo json_encode(['success' => false, 'error' => 'Usuario o contraseña incorrectos']);
    }
    error_log("=== DEBUG LOGIN END ===");
    exit();
}

// IMPORTAR PRESTATARIOS
if ($_SERVER['REQUEST_METHOD'] === 'POST' && $action === 'importar-prestatarios') {
    if (!isset($_FILES['archivo']) || $_FILES['archivo']['error'] !== UPLOAD_ERR_OK) {
        echo json_encode(['success' => false, 'error' => 'No se subió ningún archivo o hubo un error']);
        exit();
    }

    $archivo_tmp = $_FILES['archivo']['tmp_name'];
    $nombre_archivo = $_FILES['archivo']['name'];
    $extension = strtolower(pathinfo($nombre_archivo, PATHINFO_EXTENSION));

    if (!in_array($extension, ['xlsx', 'xls', 'csv'])) {
        echo json_encode(['success' => false, 'error' => 'Formato no válido']);
        exit();
    }

    $conn->beginTransaction();
    $registros_exitosos = 0;
    $errores = [];

    try {
        if ($extension === 'csv') {
            if (($handle = fopen($archivo_tmp, "r")) !== FALSE) {
                $encabezados = fgetcsv($handle, 1000, ",");
                $numero_fila = 2;
                
                while (($row = fgetcsv($handle, 1000, ",")) !== FALSE) {
                    // Buscar índices de columnas con múltiples variaciones
                    $dni_index = array_search('DNI', $encabezados);
                    if ($dni_index === false) $dni_index = array_search('dni', $encabezados);
                    if ($dni_index === false) $dni_index = array_search('DOCUMENTO', $encabezados);
                    if ($dni_index === false) $dni_index = array_search('documento', $encabezados);
                    
                    $nombre_index = array_search('NOMBRE COMPLETO', $encabezados);
                    if ($nombre_index === false) $nombre_index = array_search('nombre completo', $encabezados);
                    if ($nombre_index === false) $nombre_index = array_search('NOMBRE', $encabezados);
                    if ($nombre_index === false) $nombre_index = array_search('nombre', $encabezados);
                    
                    $telefono_index = array_search('TELÉFONO', $encabezados);
                    if ($telefono_index === false) $telefono_index = array_search('telefono', $encabezados);
                    if ($telefono_index === false) $telefono_index = array_search('TELEFONO', $encabezados);
                    
                    $direccion_index = array_search('DIRECCIÓN', $encabezados);
                    if ($direccion_index === false) $direccion_index = array_search('direccion', $encabezados);
                    if ($direccion_index === false) $direccion_index = array_search('DIRECCION', $encabezados);
                    
                    $estado_index = array_search('ESTADO', $encabezados);
                    if ($estado_index === false) $estado_index = array_search('estado', $encabezados);
                    
                    // Valores por defecto si no se encuentran las columnas
                    if ($dni_index === false) $dni_index = 0;
                    if ($nombre_index === false) $nombre_index = 1;
                    if ($telefono_index === false) $telefono_index = 2;
                    if ($direccion_index === false) $direccion_index = 3;
                    if ($estado_index === false) $estado_index = 4;
                    
                    $dni = limpiarDNI($row[$dni_index] ?? '');
                    $nombre = trim($row[$nombre_index] ?? '');
                    $telefono = trim($row[$telefono_index] ?? '');
                    $direccion = trim($row[$direccion_index] ?? '');
                    $estado = mapearEstado(trim($row[$estado_index] ?? ''));
                    
                    if (importarPrestatario($dni, $nombre, $telefono, $direccion, $estado, $conn, $errores, $numero_fila)) {
                        $registros_exitosos++;
                    }
                    
                    $numero_fila++;
                }
                fclose($handle);
            }
        } else {
            $spreadsheet = IOFactory::load($archivo_tmp);
            $sheet = $spreadsheet->getActiveSheet();
            $rows = $sheet->toArray();
            
            for ($i = 1; $i < count($rows); $i++) {
                $fila = $rows[$i];
                
                $dni = limpiarDNI($fila[0] ?? '');
                $nombre = trim($fila[1] ?? '');
                $telefono = trim($fila[2] ?? '');
                $direccion = trim($fila[3] ?? '');
                $estado = mapearEstado(trim($fila[4] ?? ''));
                
                if (importarPrestatario($dni, $nombre, $telefono, $direccion, $estado, $conn, $errores, $i + 1)) {
                    $registros_exitosos++;
                }
            }
        }

        $conn->commit();

        $resultado = [
            'success' => $registros_exitosos > 0,
            'message' => $registros_exitosos > 0 ? "Importación completada: $registros_exitosos registros" : "No se importaron registros",
            'registros_exitosos' => $registros_exitosos,
            'tipo_archivo' => $extension
        ];

        if (!empty($errores)) {
            $resultado['errores'] = $errores;
        }

        echo json_encode($resultado);

    } catch (Exception $e) {
        $conn->rollback();
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
    exit();
}

// FUNCIONES AUXILIARES
function limpiarDNI($dni) {
    return preg_replace('/[^0-9]/', '', $dni);
}

function mapearEstado($estado) {
    $estado = strtolower(trim($estado));
    if ($estado == 'activo' || $estado == 'active') {
        return 'activo';
    } elseif ($estado == 'moroso') {
        return 'moroso';
    } elseif ($estado == 'inactivo' || $estado == 'inactive') {
        return 'inactivo';
    }
    return 'activo';
}

function importarPrestatario($dni, $nombre, $telefono, $direccion, $estado, $conn, &$errores, $numero_fila) {
    if (empty($dni) || strlen($dni) < 8) {
        $errores[] = "Fila $numero_fila: DNI inválido";
        return false;
    }
    
    if (empty($nombre)) {
        $errores[] = "Fila $numero_fila: Nombre requerido";
        return false;
    }
    
    $stmt = $conn->prepare('SELECT id_prestatario FROM prestatarios WHERE dni = ?');
    $stmt->execute([$dni]);
    
    if ($stmt->fetch()) {
        $errores[] = "Fila $numero_fila: DNI ya existe";
        return false;
    }

    $stmt = $conn->prepare('INSERT INTO prestatarios (dni, nombre, telefono, direccion, estado) VALUES (?, ?, ?, ?, ?)');
    
    if ($stmt->execute([$dni, $nombre, $telefono, $direccion, $estado])) {
        return true;
    } else {
        $errores[] = "Fila $numero_fila: Error al guardar";
        return false;
    }
}

// GET REQUESTS
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if ($action === 'prestamos') {
        $stmt = $conn->prepare('
            SELECT p.*, pr.nombre, pr.dni, pr.telefono 
            FROM prestamos p 
            JOIN prestatarios pr ON p.id_prestatario = pr.id_prestatario 
            WHERE p.estado != ? OR p.estado IS NULL
            ORDER BY p.fecha_inicio DESC
        ');
        $stmt->execute(['archivado']);
        echo json_encode($stmt->fetchAll());
    } 
    elseif ($action === 'prestatarios') {
        $stmt = $conn->prepare('SELECT * FROM prestatarios ORDER BY nombre ASC');
        $stmt->execute();
        echo json_encode($stmt->fetchAll());
    } 
    elseif ($action === 'pagos') {
        $id_prestamo = $_GET['id_prestamo'] ?? '';
        if ($id_prestamo) {
            $stmt = $conn->prepare('SELECT * FROM pagos WHERE id_prestamo = ? ORDER BY fecha DESC');
            $stmt->execute([$id_prestamo]);
            echo json_encode($stmt->fetchAll());
        } else {
            echo json_encode(['error' => 'ID requerido']);
        }
    }
    elseif ($action === 'prestamo') {
        $id_prestamo = $_GET['id_prestamo'] ?? '';
        if ($id_prestamo) {
            $stmt = $conn->prepare('
                SELECT p.*, pr.nombre, pr.dni, pr.telefono, pr.direccion 
                FROM prestamos p 
                JOIN prestatarios pr ON p.id_prestatario = pr.id_prestatario 
                WHERE p.id_prestamo = ?
            ');
            $stmt->execute([$id_prestamo]);
            echo json_encode($stmt->fetch() ?: ['error' => 'No encontrado']);
        } else {
            echo json_encode(['error' => 'ID requerido']);
        }
    }
    elseif ($action === 'prestatario-por-dni') {
        $dni = $_GET['dni'] ?? '';
        if ($dni) {
            $stmt = $conn->prepare('SELECT * FROM prestatarios WHERE dni = ?');
            $stmt->execute([$dni]);
            echo json_encode($stmt->fetch() ?: ['error' => 'No encontrado']);
        } else {
            echo json_encode(['error' => 'DNI requerido']);
        }
    }
    elseif ($action === 'prestamos_archivados') {
        $stmt = $conn->prepare('
            SELECT p.*, pr.nombre, pr.dni, pr.telefono 
            FROM prestamos p 
            JOIN prestatarios pr ON p.id_prestatario = pr.id_prestatario 
            WHERE p.estado = ?
            ORDER BY p.fecha_inicio DESC
        ');
        $stmt->execute(['archivado']);
        echo json_encode($stmt->fetchAll());
    }
    elseif ($action === 'pagos_prestatario') {
        $id_prestatario = $_GET['id_prestatario'] ?? '';
        if ($id_prestatario) {
            $stmt = $conn->prepare('
                SELECT pg.*, p.monto_total, pr.nombre 
                FROM pagos pg 
                JOIN prestamos p ON pg.id_prestamo = p.id_prestamo 
                JOIN prestatarios pr ON p.id_prestatario = pr.id_prestatario 
                WHERE pr.id_prestatario = ? 
                ORDER BY pg.fecha DESC
            ');
            $stmt->execute([$id_prestatario]);
            echo json_encode(['success' => true, 'pagos' => $stmt->fetchAll()]);
        } else {
            echo json_encode(['success' => false, 'error' => 'ID requerido']);
        }
    }
    
    // ===== ENDPOINTS PARA SINCRONIZACIÓN =====
    elseif ($action === 'sync') {
        $lastSync = $_GET['last_sync'] ?? '1970-01-01 00:00:00';
        $limit = intval($_GET['limit'] ?? 100);
        
        $stmt = $conn->prepare('
            SELECT 
                id_cambio,
                tabla,
                id_registro,
                tipo_accion,
                datos_cambio,
                timestamp
            FROM cambios_sync 
            WHERE timestamp >= ? AND sincronizado = 0
            ORDER BY timestamp ASC
            LIMIT ?
        ');
        
        $stmt->execute([$lastSync, $limit]);
        $cambios = $stmt->fetchAll();
        
        foreach ($cambios as &$cambio) {
            $cambio['datos_cambio'] = json_decode($cambio['datos_cambio'], true);
        }
        
        echo json_encode([
            'success' => true,
            'cambios' => $cambios,
            'total' => count($cambios),
            'timestamp_actual' => date('Y-m-d H:i:s')
        ]);
    }
    elseif ($action === 'sync_stats') {
        $stmt = $conn->prepare('SELECT COUNT(*) as total FROM cambios_sync WHERE sincronizado = 0');
        $stmt->execute();
        $stats['cambios_pendientes'] = $stmt->fetch()['total'];
        
        $stmt = $conn->prepare('SELECT MAX(timestamp) as ultimo_cambio FROM cambios_sync');
        $stmt->execute();
        $stats['ultimo_cambio'] = $stmt->fetch()['ultimo_cambio'];
        
        echo json_encode(['success' => true, 'stats' => $stats]);
    }
    exit();
}

// POST REQUESTS
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);

    if ($action === 'prestamos') {
        $id_prestatario = $data['id_prestatario'];
        $monto_inicial = $data['monto_inicial'];
        $tasa_interes = $data['tasa_interes'];
        $fecha_inicio = $data['fecha_inicio'];
        $tipo_periodo = $data['tipo_periodo'];
        $cantidad_periodo = $data['cantidad_periodo'];
        $fecha_primer_pago = $data['fecha_primer_pago'];
        $fecha_ultimo_pago = $data['fecha_ultimo_pago'];
        
        $monto_total = $monto_inicial + ($monto_inicial * $tasa_interes / 100);
        $saldo_pendiente = $monto_total;

        $stmt = $conn->prepare('INSERT INTO prestamos (id_prestatario, monto_inicial, tasa_interes, fecha_inicio, tipo_periodo, cantidad_periodo, fecha_primer_pago, fecha_ultimo_pago, monto_total, saldo_pendiente, estado) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
        $success = $stmt->execute([$id_prestatario, $monto_inicial, $tasa_interes, $fecha_inicio, $tipo_periodo, $cantidad_periodo, $fecha_primer_pago, $fecha_ultimo_pago, $monto_total, $saldo_pendiente, 'activo']);
        
        echo json_encode(['success' => $success, 'message' => $success ? 'Registrado' : 'Error']);
    } 
    elseif ($action === 'prestatarios') {
        $nombre = $data['nombre'];
        $dni = $data['dni'];
        $direccion = $data['direccion'];
        $telefono = $data['telefono'];
        $estado = $data['estado'] ?? 'activo';

        if (!is_numeric($dni) || strlen($dni) !== 8) {
            echo json_encode(['success' => false, 'error' => 'DNI debe tener 8 dígitos']);
            exit();
        }

        $dni = (int)$dni;

        $stmt = $conn->prepare('SELECT id_prestatario FROM prestatarios WHERE dni = ?');
        $stmt->execute([$dni]);
        
        if ($stmt->fetch()) {
            echo json_encode(['success' => false, 'error' => 'DNI ya registrado']);
            exit();
        }

        $stmt = $conn->prepare('INSERT INTO prestatarios (nombre, dni, direccion, telefono, estado) VALUES (?, ?, ?, ?, ?)');
        $success = $stmt->execute([$nombre, $dni, $direccion, $telefono, $estado]);
        
        echo json_encode(['success' => $success, 'message' => 'Registrado']);
    } 
    elseif ($action === 'pago') {
        $id_prestamo = $data['id_prestamo'];
        $monto_pago = $data['monto_pago'];

        $stmt = $conn->prepare('SELECT saldo_pendiente FROM prestamos WHERE id_prestamo = ?');
        $stmt->execute([$id_prestamo]);
        $prestamo = $stmt->fetch();

        if (!$prestamo) {
            echo json_encode(['success' => false, 'error' => 'Préstamo no encontrado']);
            exit();
        }

        $nuevo_saldo = $prestamo['saldo_pendiente'] - $monto_pago;

        if ($nuevo_saldo < 0) {
            echo json_encode(['success' => false, 'error' => 'Pago excede saldo']);
            exit();
        }

        $conn->beginTransaction();

        try {
            $stmt = $conn->prepare('INSERT INTO pagos (id_prestamo, monto, fecha) VALUES (?, ?, CURRENT_TIMESTAMP)');
            $stmt->execute([$id_prestamo, $monto_pago]);

            $stmt = $conn->prepare('UPDATE prestamos SET saldo_pendiente = ? WHERE id_prestamo = ?');
            $stmt->execute([$nuevo_saldo, $id_prestamo]);

            $conn->commit();

            $stmt = $conn->prepare('SELECT p.*, pr.nombre FROM prestamos p JOIN prestatarios pr ON p.id_prestatario = pr.id_prestatario WHERE p.id_prestamo = ?');
            $stmt->execute([$id_prestamo]);
            
            echo json_encode(['success' => true, 'message' => 'Pago registrado', 'data' => $stmt->fetch()]);

        } catch (Exception $e) {
            $conn->rollback();
            echo json_encode(['success' => false, 'error' => $e->getMessage()]);
        }
    }
    elseif ($action === 'archivar_prestamo') {
        $id_prestamo = $data['id_prestamo'];
        $stmt = $conn->prepare('UPDATE prestamos SET estado = ? WHERE id_prestamo = ?');
        $success = $stmt->execute(['archivado', $id_prestamo]);
        echo json_encode(['success' => $success]);
    }
    elseif ($action === 'reactivar_prestamo') {
        $id_prestamo = $data['id_prestamo'];
        $stmt = $conn->prepare('UPDATE prestamos SET estado = ? WHERE id_prestamo = ?');
        $success = $stmt->execute(['activo', $id_prestamo]);
        echo json_encode(['success' => $success]);
    }
    elseif ($action === 'mark_synced') {
        $ids = $data['ids'] ?? [];
        if (empty($ids)) {
            echo json_encode(['success' => false]);
            exit();
        }
        $placeholders = implode(',', array_fill(0, count($ids), '?'));
        $stmt = $conn->prepare("UPDATE cambios_sync SET sincronizado = 1 WHERE id_cambio IN ($placeholders)");
        $success = $stmt->execute($ids);
        echo json_encode(['success' => $success]);
    }
    elseif ($action === 'actualizar-admin') {
        $usuario = $data['usuario'];
        $password = $data['password'];
    
    $stmt = $conn->prepare('UPDATE admin SET password = ? WHERE usuario = ?');
    $success = $stmt->execute([$password, $usuario]);
        
        echo json_encode(['success' => $success, 'message' => $success ? 'Actualizado' : 'Error']);
    }
    elseif ($action === 'crear-admin') {
        $usuario = $data['usuario'];
        $password = $data['password'];
        
        // Verificar si ya existe
        $stmt = $conn->prepare('SELECT id_admin FROM admin WHERE usuario = ?');
        $stmt->execute([$usuario]);
        
        if ($stmt->fetch()) {
            echo json_encode(['success' => false, 'error' => 'Usuario ya existe']);
            exit();
        }
        
        $stmt = $conn->prepare('INSERT INTO admin (usuario, password, rol, activo) VALUES (?, ?, ?, ?)');
        $success = $stmt->execute([$usuario, $password, 'cobrador', 1]);
        
        echo json_encode(['success' => $success, 'message' => $success ? 'Creado' : 'Error']);
    }
    exit();
}

// PUT REQUESTS
if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    if ($action === 'prestatarios') {
        $id_prestatario = $data['id_prestatario'];
        $nombre = $data['nombre'];
        $dni = $data['dni'];
        $direccion = $data['direccion'];
        $telefono = $data['telefono'];
        $estado = $data['estado'];

        if (!is_numeric($dni) || strlen($dni) !== 8) {
            echo json_encode(['success' => false, 'error' => 'DNI inválido']);
            exit();
        }

        $dni = (int)$dni;

        $stmt = $conn->prepare('SELECT id_prestatario FROM prestatarios WHERE dni = ? AND id_prestatario != ?');
        $stmt->execute([$dni, $id_prestatario]);
        
        if ($stmt->fetch()) {
            echo json_encode(['success' => false, 'error' => 'DNI duplicado']);
            exit();
        }

        $stmt = $conn->prepare('UPDATE prestatarios SET nombre = ?, dni = ?, direccion = ?, telefono = ?, estado = ? WHERE id_prestatario = ?');
        $success = $stmt->execute([$nombre, $dni, $direccion, $telefono, $estado, $id_prestatario]);
        
        echo json_encode(['success' => $success]);
    }
    exit();
}

// DELETE REQUESTS
if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    if ($action === 'prestatarios') {
        $id_prestatario = $data['id_prestatario'];

        $stmt = $conn->prepare('SELECT COUNT(*) as total FROM prestamos WHERE id_prestatario = ? AND saldo_pendiente > 0');
        $stmt->execute([$id_prestatario]);
        $result = $stmt->fetch();

        if ($result['total'] > 0) {
            echo json_encode(['success' => false, 'error' => 'Tiene préstamos activos']);
            exit();
        }

        $stmt = $conn->prepare('DELETE FROM prestatarios WHERE id_prestatario = ?');
        $success = $stmt->execute([$id_prestatario]);
        
        echo json_encode(['success' => $success]);
    }
    exit();
}

// CREAR TABLA ADMIN
if ($_SERVER['REQUEST_METHOD'] === 'POST' && $action === 'crear-tabla-admin') {
    try {
        // Verificar si existe la tabla admin
        $check_table = $conn->query("SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'admin'
        )");
        
        $table_exists = $check_table->fetchColumn();
        
        if (!$table_exists) {
            // Crear tabla admin
            $create_table = "
            CREATE TABLE admin (
                id_admin SERIAL PRIMARY KEY,
                usuario VARCHAR(50) NOT NULL UNIQUE,
                password VARCHAR(255) NOT NULL,
                nombre VARCHAR(100),
                email VARCHAR(100),
                fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )";
            
            $conn->exec($create_table);
            echo json_encode(['success' => true, 'message' => 'Tabla admin creada exitosamente']);
        } else {
            echo json_encode(['success' => true, 'message' => 'Tabla admin ya existe']);
        }
    } catch (PDOException $e) {
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
    exit();
}

// INSERTAR USUARIO ADMIN
if ($_SERVER['REQUEST_METHOD'] === 'POST' && $action === 'insertar-admin') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    try {
        // Eliminar usuario admin existente si existe
        $delete_stmt = $conn->prepare("DELETE FROM admin WHERE usuario = ?");
        $delete_stmt->execute(['admin']);
        
        // Insertar nuevo usuario admin
        $insert_stmt = $conn->prepare("
            INSERT INTO admin (usuario, password, nombre, email) 
            VALUES (?, ?, ?, ?)
        ");
        
        $insert_stmt->execute([
            $data['usuario'],
            $data['password'],  // Contraseña en texto plano
            $data['nombre'],
            $data['email']
        ]);
        
        echo json_encode(['success' => true, 'message' => 'Usuario admin creado exitosamente']);
    } catch (PDOException $e) {
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
    exit();
}

echo json_encode(['error' => 'Acción no válida']);
?>