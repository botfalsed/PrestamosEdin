<?php
/**
 * Servidor WebSocket Simple para Sincronización en Tiempo Real
 * Sistema de Préstamos - Notificaciones Instantáneas
 */

class SimpleWebSocketServer {
    private $socket;
    private $clients = [];
    private $dashboards = [];
    private $collectors = [];
    private $port;

    public function __construct($port = 8081) {
        $this->port = $port;
    }

    public function start() {
        // Crear socket
        $this->socket = socket_create(AF_INET, SOCK_STREAM, SOL_TCP);
        socket_set_option($this->socket, SOL_SOCKET, SO_REUSEADDR, 1);
        socket_bind($this->socket, '0.0.0.0', $this->port);
        socket_listen($this->socket, 5);
        socket_set_nonblock($this->socket);

        echo "Servidor WebSocket iniciado en puerto {$this->port}\n";
        echo "Esperando conexiones...\n";

        while (true) {
            // Aceptar nuevas conexiones
            $newSocket = @socket_accept($this->socket);
            if ($newSocket !== false) {
                $this->handleNewConnection($newSocket);
            }

            // Procesar mensajes de clientes existentes
            $this->processClientMessages();

            // Pequeña pausa para no saturar el CPU
            usleep(10000); // 10ms
        }
    }

    private function handleNewConnection($socket) {
        $clientId = uniqid();
        $this->clients[$clientId] = [
            'socket' => $socket,
            'handshake' => false,
            'type' => null
        ];

        echo "Nueva conexión: $clientId\n";
    }

    private function processClientMessages() {
        foreach ($this->clients as $clientId => $client) {
            $socket = $client['socket'];
            
            // Verificar si hay datos para leer
            $read = [$socket];
            $write = null;
            $except = null;
            
            if (socket_select($read, $write, $except, 0) > 0) {
                $data = @socket_read($socket, 2048);
                
                if ($data === false || $data === '') {
                    $this->disconnectClient($clientId);
                    continue;
                }

                if (!$client['handshake']) {
                    $this->performHandshake($clientId, $data);
                } else {
                    $this->handleMessage($clientId, $data);
                }
            }
        }
    }

    private function performHandshake($clientId, $data) {
        $lines = explode("\n", $data);
        $headers = [];
        
        foreach ($lines as $line) {
            if (strpos($line, ':') !== false) {
                list($key, $value) = explode(':', $line, 2);
                $headers[trim($key)] = trim($value);
            }
        }

        if (isset($headers['Sec-WebSocket-Key'])) {
            $key = $headers['Sec-WebSocket-Key'];
            $acceptKey = base64_encode(sha1($key . '258EAFA5-E914-47DA-95CA-C5AB0DC85B11', true));
            
            $response = "HTTP/1.1 101 Switching Protocols\r\n";
            $response .= "Upgrade: websocket\r\n";
            $response .= "Connection: Upgrade\r\n";
            $response .= "Sec-WebSocket-Accept: $acceptKey\r\n\r\n";
            
            socket_write($this->clients[$clientId]['socket'], $response);
            $this->clients[$clientId]['handshake'] = true;
            
            // Enviar mensaje de bienvenida
            $this->sendMessage($clientId, [
                'type' => 'connection',
                'message' => 'Conectado al servidor de sincronización',
                'connection_id' => $clientId
            ]);
            
            echo "Handshake completado para cliente: $clientId\n";
        }
    }

    private function handleMessage($clientId, $data) {
        $decoded = $this->decodeFrame($data);
        if (!$decoded) return;

        $message = json_decode($decoded, true);
        if (!$message) return;

        echo "Mensaje recibido de $clientId: " . json_encode($message) . "\n";

        switch ($message['type']) {
            case 'register_dashboard':
                $this->dashboards[$clientId] = $this->clients[$clientId];
                $this->clients[$clientId]['type'] = 'dashboard';
                $this->sendMessage($clientId, [
                    'type' => 'registered',
                    'role' => 'dashboard',
                    'message' => 'Dashboard registrado correctamente'
                ]);
                break;

            case 'register_collector':
                $this->collectors[$clientId] = $this->clients[$clientId];
                $this->clients[$clientId]['type'] = 'collector';
                $this->sendMessage($clientId, [
                    'type' => 'registered',
                    'role' => 'collector',
                    'message' => 'Cobrador registrado correctamente'
                ]);
                break;

            case 'payment_notification':
                $this->broadcastPaymentToDashboards($message);
                break;

            case 'ping':
                $this->sendMessage($clientId, ['type' => 'pong']);
                break;
        }
    }

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
            if ($this->sendMessage($clientId, $notification)) {
                $dashboardCount++;
            }
        }

        echo "Notificación de pago enviada a {$dashboardCount} dashboard(s)\n";
    }

    private function sendMessage($clientId, $data) {
        if (!isset($this->clients[$clientId])) {
            return false;
        }

        $message = json_encode($data);
        $frame = $this->encodeFrame($message);
        
        $result = @socket_write($this->clients[$clientId]['socket'], $frame);
        
        if ($result === false) {
            $this->disconnectClient($clientId);
            return false;
        }
        
        return true;
    }

    private function encodeFrame($message) {
        $length = strlen($message);
        $frame = chr(0x81); // Text frame

        if ($length < 126) {
            $frame .= chr($length);
        } elseif ($length < 65536) {
            $frame .= chr(126) . pack('n', $length);
        } else {
            $frame .= chr(127) . pack('J', $length);
        }

        return $frame . $message;
    }

    private function decodeFrame($data) {
        if (strlen($data) < 2) return false;

        $firstByte = ord($data[0]);
        $secondByte = ord($data[1]);
        
        $opcode = $firstByte & 0x0F;
        $masked = ($secondByte & 0x80) === 0x80;
        $payloadLength = $secondByte & 0x7F;
        
        $offset = 2;
        
        if ($payloadLength === 126) {
            if (strlen($data) < $offset + 2) return false;
            $payloadLength = unpack('n', substr($data, $offset, 2))[1];
            $offset += 2;
        } elseif ($payloadLength === 127) {
            if (strlen($data) < $offset + 8) return false;
            $payloadLength = unpack('J', substr($data, $offset, 8))[1];
            $offset += 8;
        }
        
        if ($masked) {
            if (strlen($data) < $offset + 4) return false;
            $maskingKey = substr($data, $offset, 4);
            $offset += 4;
        }
        
        if (strlen($data) < $offset + $payloadLength) return false;
        
        $payload = substr($data, $offset, $payloadLength);
        
        if ($masked) {
            for ($i = 0; $i < $payloadLength; $i++) {
                $payload[$i] = $payload[$i] ^ $maskingKey[$i % 4];
            }
        }
        
        return $payload;
    }

    private function disconnectClient($clientId) {
        if (isset($this->clients[$clientId])) {
            @socket_close($this->clients[$clientId]['socket']);
            unset($this->clients[$clientId]);
            unset($this->dashboards[$clientId]);
            unset($this->collectors[$clientId]);
            echo "Cliente desconectado: $clientId\n";
        }
    }

    public function __destruct() {
        if ($this->socket) {
            socket_close($this->socket);
        }
    }
}

// Iniciar el servidor
$server = new SimpleWebSocketServer(8081);
$server->start();
?>