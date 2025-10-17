<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE');
header('Access-Control-Allow-Headers: Content-Type');

require 'vendor/autoload.php';
use PhpOffice\PhpSpreadsheet\IOFactory;

$host = 'localhost';
$db = 'prestamos_db';
$user = 'root';
$pass = '';
$conn = new mysqli($host, $user, $pass, $db);

if ($conn->connect_error) {
    echo json_encode(['error' => 'Conexión fallida: ' . $conn->connect_error]);
    exit();
}

$action = $_GET['action'] ?? '';

// LOGIN
if ($_SERVER['REQUEST_METHOD'] === 'POST' && $action === 'login') {
    $data = json_decode(file_get_contents('php://input'), true);
    $usuario = $data['usuario'] ?? '';
    $contraseña = $data['contraseña'] ?? '';

    if (empty($usuario) || empty($contraseña)) {
        echo json_encode(['success' => false, 'error' => 'Usuario y contraseña requeridos']);
        exit();
    }

    $stmt = $conn->prepare('SELECT id_admin, usuario, contraseña FROM admin WHERE usuario = ?');
    $stmt->bind_param('s', $usuario);
    $stmt->execute();
    $result = $stmt->get_result();
    $admin = $result->fetch_assoc();

    if ($admin && $contraseña === $admin['contraseña']) {
        echo json_encode(['success' => true, 'message' => 'Login exitoso']);
    } else {
        echo json_encode(['success' => false, 'error' => 'Usuario o contraseña incorrectos']);
    }
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

    $conn->begin_transaction();
    $registros_exitosos = 0;
    $errores = [];

    try {
        if ($extension === 'csv') {
            if (($handle = fopen($archivo_tmp, "r")) !== FALSE) {
                $encabezados = fgetcsv($handle, 1000, ",");
                $numero_fila = 2;
                
                while (($row = fgetcsv($handle, 1000, ",")) !== FALSE) {
                    $dni_index = array_search('DNI', $encabezados);
                    $nombre_index = array_search('NOMBRE COMPLETO', $encabezados);
                    $telefono_index = array_search('TELÉFONO', $encabezados);
                    $direccion_index = array_search('DIRECCIÓN', $encabezados);
                    $estado_index = array_search('ESTADO', $encabezados);
                    
                    if ($nombre_index === false) $nombre_index = array_search('NOMBRE', $encabezados);
                    if ($dni_index === false) $dni_index = array_search('DOCUMENTO', $encabezados);
                    
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
    $stmt->bind_param('s', $dni);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows > 0) {
        $errores[] = "Fila $numero_fila: DNI ya existe";
        return false;
    }

    $stmt = $conn->prepare('INSERT INTO prestatarios (dni, nombre, telefono, direccion, estado) VALUES (?, ?, ?, ?, ?)');
    $stmt->bind_param('sssss', $dni, $nombre, $telefono, $direccion, $estado);
    
    if ($stmt->execute()) {
        return true;
    } else {
        $errores[] = "Fila $numero_fila: Error al guardar";
        return false;
    }
}

// GET REQUESTS
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if ($action === 'prestamos') {
        $result = $conn->query('
            SELECT p.*, pr.nombre, pr.dni, pr.telefono 
            FROM prestamos p 
            JOIN prestatarios pr ON p.id_prestatario = pr.id_prestatario 
            WHERE p.estado != "archivado" OR p.estado IS NULL
            ORDER BY p.fecha_inicio DESC
        ');
        echo json_encode($result->fetch_all(MYSQLI_ASSOC));
    } 
    elseif ($action === 'prestatarios') {
        $result = $conn->query('SELECT * FROM prestatarios ORDER BY nombre ASC');
        echo json_encode($result->fetch_all(MYSQLI_ASSOC));
    } 
    elseif ($action === 'pagos') {
        $id_prestamo = $_GET['id_prestamo'] ?? '';
        if ($id_prestamo) {
            $stmt = $conn->prepare('SELECT * FROM pagos WHERE id_prestamo = ? ORDER BY fecha DESC');
            $stmt->bind_param('i', $id_prestamo);
            $stmt->execute();
            echo json_encode($stmt->get_result()->fetch_all(MYSQLI_ASSOC));
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
            $stmt->bind_param('i', $id_prestamo);
            $stmt->execute();
            echo json_encode($stmt->get_result()->fetch_assoc());
        } else {
            echo json_encode(['error' => 'ID requerido']);
        }
    }
    elseif ($action === 'prestatario-por-dni') {
        $dni = $_GET['dni'] ?? '';
        if ($dni) {
            $stmt = $conn->prepare('SELECT * FROM prestatarios WHERE dni = ?');
            $stmt->bind_param('i', $dni);
            $stmt->execute();
            echo json_encode($stmt->get_result()->fetch_assoc() ?: ['error' => 'No encontrado']);
        } else {
            echo json_encode(['error' => 'DNI requerido']);
        }
    }
    elseif ($action === 'prestamos_archivados') {
        $result = $conn->query('
            SELECT p.*, pr.nombre, pr.dni, pr.telefono 
            FROM prestamos p 
            JOIN prestatarios pr ON p.id_prestatario = pr.id_prestatario 
            WHERE p.estado = "archivado"
            ORDER BY p.fecha_inicio DESC
        ');
        echo json_encode($result->fetch_all(MYSQLI_ASSOC));
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
            $stmt->bind_param('i', $id_prestatario);
            $stmt->execute();
            echo json_encode(['success' => true, 'pagos' => $stmt->get_result()->fetch_all(MYSQLI_ASSOC)]);
        } else {
            echo json_encode(['success' => false, 'error' => 'ID requerido']);
        }
    }
        elseif ($action === 'sync') {
        $lastSync = $_GET['last_sync'] ?? '1970-01-01 00:00:00';
        $limit = intval($_GET['limit'] ?? 100);
        
        // IMPORTANTE: Filtrar por sincronizado = 0
        $stmt = $conn->prepare('
            SELECT 
                id_cambio,
                tabla,
                id_registro,
                tipo_accion,
                datos_cambio,
                timestamp
            FROM cambios_sync 
            WHERE timestamp > ? AND sincronizado = 0
            ORDER BY timestamp ASC
            LIMIT ?
        ');
        
        $stmt->bind_param('si', $lastSync, $limit);
        $stmt->execute();
        $cambios = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
        
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
        $result = $conn->query('SELECT COUNT(*) as total FROM cambios_sync WHERE sincronizado = 0');
        $stats['cambios_pendientes'] = $result->fetch_assoc()['total'];
        
        $result = $conn->query('SELECT MAX(timestamp) as ultimo_cambio FROM cambios_sync');
        $stats['ultimo_cambio'] = $result->fetch_assoc()['ultimo_cambio'];
        
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

        $stmt = $conn->prepare('INSERT INTO prestamos (id_prestatario, monto_inicial, tasa_interes, fecha_inicio, tipo_periodo, cantidad_periodo, fecha_primer_pago, fecha_ultimo_pago, monto_total, saldo_pendiente, estado) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, "activo")');
        $stmt->bind_param('iddssissdd', $id_prestatario, $monto_inicial, $tasa_interes, $fecha_inicio, $tipo_periodo, $cantidad_periodo, $fecha_primer_pago, $fecha_ultimo_pago, $monto_total, $saldo_pendiente);
        
        echo json_encode(['success' => $stmt->execute(), 'message' => $stmt->execute() ? 'Registrado' : 'Error']);
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
        $stmt->bind_param('i', $dni);
        $stmt->execute();
        
        if ($stmt->get_result()->num_rows > 0) {
            echo json_encode(['success' => false, 'error' => 'DNI ya registrado']);
            exit();
        }

        $stmt = $conn->prepare('INSERT INTO prestatarios (nombre, dni, direccion, telefono, estado) VALUES (?, ?, ?, ?, ?)');
        $stmt->bind_param('sisss', $nombre, $dni, $direccion, $telefono, $estado);
        
        echo json_encode(['success' => $stmt->execute(), 'message' => 'Registrado']);
    } 
    elseif ($action === 'pago') {
        $id_prestamo = $data['id_prestamo'];
        $monto_pago = $data['monto_pago'];

        $stmt = $conn->prepare('SELECT saldo_pendiente FROM prestamos WHERE id_prestamo = ?');
        $stmt->bind_param('i', $id_prestamo);
        $stmt->execute();
        $prestamo = $stmt->get_result()->fetch_assoc();

        if (!$prestamo) {
            echo json_encode(['success' => false, 'error' => 'Préstamo no encontrado']);
            exit();
        }

        $nuevo_saldo = $prestamo['saldo_pendiente'] - $monto_pago;

        if ($nuevo_saldo < 0) {
            echo json_encode(['success' => false, 'error' => 'Pago excede saldo']);
            exit();
        }

        $conn->begin_transaction();

        try {
            $stmt = $conn->prepare('INSERT INTO pagos (id_prestamo, monto, fecha) VALUES (?, ?, NOW())');
            $stmt->bind_param('id', $id_prestamo, $monto_pago);
            $stmt->execute();

            $stmt = $conn->prepare('UPDATE prestamos SET saldo_pendiente = ? WHERE id_prestamo = ?');
            $stmt->bind_param('di', $nuevo_saldo, $id_prestamo);
            $stmt->execute();

            $conn->commit();

            $stmt = $conn->prepare('SELECT p.*, pr.nombre FROM prestamos p JOIN prestatarios pr ON p.id_prestatario = pr.id_prestatario WHERE p.id_prestamo = ?');
            $stmt->bind_param('i', $id_prestamo);
            $stmt->execute();
            
            echo json_encode(['success' => true, 'message' => 'Pago registrado', 'data' => $stmt->get_result()->fetch_assoc()]);

        } catch (Exception $e) {
            $conn->rollback();
            echo json_encode(['success' => false, 'error' => $e->getMessage()]);
        }
    }
    elseif ($action === 'archivar_prestamo') {
        $id_prestamo = $data['id_prestamo'];
        $stmt = $conn->prepare('UPDATE prestamos SET estado = "archivado" WHERE id_prestamo = ?');
        $stmt->bind_param('i', $id_prestamo);
        echo json_encode(['success' => $stmt->execute()]);
    }
    elseif ($action === 'reactivar_prestamo') {
        $id_prestamo = $data['id_prestamo'];
        $stmt = $conn->prepare('UPDATE prestamos SET estado = "activo" WHERE id_prestamo = ?');
        $stmt->bind_param('i', $id_prestamo);
        echo json_encode(['success' => $stmt->execute()]);
    }
    elseif ($action === 'mark_synced') {
        $ids = $data['ids'] ?? [];
        if (empty($ids)) {
            echo json_encode(['success' => false]);
            exit();
        }
        $placeholders = implode(',', array_fill(0, count($ids), '?'));
        $stmt = $conn->prepare("UPDATE cambios_sync SET sincronizado = 1 WHERE id_cambio IN ($placeholders)");
        $types = str_repeat('i', count($ids));
        $stmt->bind_param($types, ...$ids);
        echo json_encode(['success' => $stmt->execute()]);
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
        $stmt->bind_param('ii', $dni, $id_prestatario);
        $stmt->execute();
        
        if ($stmt->get_result()->num_rows > 0) {
            echo json_encode(['success' => false, 'error' => 'DNI duplicado']);
            exit();
        }

        $stmt = $conn->prepare('UPDATE prestatarios SET nombre = ?, dni = ?, direccion = ?, telefono = ?, estado = ? WHERE id_prestatario = ?');
        $stmt->bind_param('sisssi', $nombre, $dni, $direccion, $telefono, $estado, $id_prestatario);
        
        echo json_encode(['success' => $stmt->execute()]);
    }
    exit();
}

// DELETE REQUESTS
if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    if ($action === 'prestatarios') {
        $id_prestatario = $data['id_prestatario'];

        $stmt = $conn->prepare('SELECT COUNT(*) as total FROM prestamos WHERE id_prestatario = ? AND saldo_pendiente > 0');
        $stmt->bind_param('i', $id_prestatario);
        $stmt->execute();
        $result = $stmt->get_result()->fetch_assoc();

        if ($result['total'] > 0) {
            echo json_encode(['success' => false, 'error' => 'Tiene préstamos activos']);
            exit();
        }

        $stmt = $conn->prepare('DELETE FROM prestatarios WHERE id_prestatario = ?');
        $stmt->bind_param('i', $id_prestatario);
        
        echo json_encode(['success' => $stmt->execute()]);
    }
    exit();
}

echo json_encode(['error' => 'Acción no válida']);
$conn->close();
?>