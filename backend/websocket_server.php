<?php
/**
 * WebSocket Server para Sincronización en Tiempo Real
 * Sistema de Préstamos - Notificaciones Instantáneas
 */

require_once 'vendor/autoload.php';

use React\EventLoop\Loop;
use React\Socket\SocketServer;
use Ratchet\RFC6455\Messaging\MessageInterface;

class PrestamosWebSocketServer {
    protected $clients = [];
    protected $dashboards = [];
    protected $collectors = [];
    protected $loop;
    protected $socket;

    public function __construct() {
        $this->loop = Loop::get();
        echo "WebSocket Server iniciado para Sistema de Préstamos\n";
    }

    public function start($port = 8081) {
        $this->socket = new SocketServer("0.0.0.0:$port", [], $this->loop);
        
        $this->socket->on('connection', function ($connection) {
            $clientId = uniqid();
            $this->clients[$clientId] = $connection;
            
            echo "Nueva conexión: $clientId\n";
            
            // Enviar mensaje de bienvenida
            $this->sendMessage($connection, [
                'type' => 'connection',
                'message' => 'Conectado al servidor de sincronización',
                'connection_id' => $clientId
            ]);

            $connection->on('data', function ($data) use ($clientId, $connection) {
                $this->handleMessage($clientId, $connection, $data);
            });

            $connection->on('close', function () use ($clientId) {
                $this->handleDisconnection($clientId);
            });

            $connection->on('error', function ($error) use ($clientId) {
                echo "Error en conexión $clientId: {$error->getMessage()}\n";
                $this->handleDisconnection($clientId);
            });
        });

        echo "Servidor WebSocket iniciado en puerto $port\n";
        echo "Esperando conexiones...\n";
        
        $this->loop->run();
    }

    private function handleMessage($clientId, $connection, $rawData) {
        try {
            // Buscar el inicio del mensaje JSON
            $jsonStart = strpos($rawData, '{');
            if ($jsonStart === false) {
                echo "No se encontró JSON válido en el mensaje\n";
                return;
            }

            $jsonData = substr($rawData, $jsonStart);
            $data = json_decode($jsonData, true);
            
            if (!$data) {
                echo "Mensaje JSON inválido recibido de $clientId\n";
                return;
            }

            echo "Mensaje recibido de $clientId: " . json_encode($data) . "\n";

            switch ($data['type']) {
                case 'register_dashboard':
                    $this->dashboards[$clientId] = $connection;
                    $this->sendMessage($connection, [
                        'type' => 'registered',
                        'role' => 'dashboard',
                        'message' => 'Dashboard registrado correctamente'
                    ]);
                    break;

                case 'register_collector':
                    $this->collectors[$clientId] = $connection;
                    $this->sendMessage($connection, [
                        'type' => 'registered',
                        'role' => 'collector',
                        'message' => 'Cobrador registrado correctamente'
                    ]);
                    break;

                case 'payment_notification':
                    $this->broadcastPaymentToDashboards($data);
                    break;

                case 'sync_request':
                    $this->handleSyncRequest($connection, $data);
                    break;

                default:
                    echo "Tipo de mensaje no reconocido: {$data['type']}\n";
            }
        } catch (Exception $e) {
            echo "Error procesando mensaje de $clientId: {$e->getMessage()}\n";
        }
    }

    private function handleDisconnection($clientId) {
        unset($this->clients[$clientId]);
        unset($this->dashboards[$clientId]);
        unset($this->collectors[$clientId]);
        echo "Conexión cerrada: $clientId\n";
    }

    private function sendMessage($connection, $data) {
        try {
            $message = json_encode($data);
            $connection->write($message);
        } catch (Exception $e) {
            echo "Error enviando mensaje: {$e->getMessage()}\n";
        }
    }

    /**
     * Enviar notificación de pago a todos los dashboards conectados
     */
    private function broadcastPaymentToDashboards($paymentData) {
        $notification = [
            'type' => 'payment_received',
            'timestamp' => date('Y-m-d H:i:s'),
            'data' => [
                'prestatario_id' => $paymentData['prestatario_id'] ?? null,
                'prestatario_nombre' => $paymentData['prestatario_nombre'] ?? 'Desconocido',
                'monto' => $paymentData['monto'] ?? 0,
                'prestamo_id' => $paymentData['prestamo_id'] ?? null,
                'collector_id' => $paymentData['collector_id'] ?? null,
                'fecha_pago' => $paymentData['fecha_pago'] ?? date('Y-m-d H:i:s')
            ],
            'message' => "Nuevo pago registrado: $" . number_format($paymentData['monto'] ?? 0, 2)
        ];

        $dashboardCount = 0;
        foreach ($this->dashboards as $clientId => $dashboard) {
            try {
                $this->sendMessage($dashboard, $notification);
                $dashboardCount++;
            } catch (Exception $e) {
                echo "Error enviando a dashboard $clientId: {$e->getMessage()}\n";
            }
        }

        echo "Notificación de pago enviada a {$dashboardCount} dashboard(s)\n";
    }

    /**
     * Manejar solicitudes de sincronización
     */
    private function handleSyncRequest($connection, $data) {
        $response = [
            'type' => 'sync_response',
            'timestamp' => date('Y-m-d H:i:s'),
            'status' => 'success',
            'message' => 'Sincronización completada'
        ];

        $this->sendMessage($connection, $response);
    }

    /**
     * Obtener estadísticas del servidor
     */
    public function getStats() {
        return [
            'total_connections' => count($this->clients),
            'dashboards_connected' => count($this->dashboards),
            'collectors_connected' => count($this->collectors),
            'timestamp' => date('Y-m-d H:i:s')
        ];
    }
}

// Iniciar el servidor
$port = 8081;

try {
    $server = new PrestamosWebSocketServer();
    $server->start($port);
} catch (Exception $e) {
    echo "Error iniciando servidor WebSocket: {$e->getMessage()}\n";
}
?>