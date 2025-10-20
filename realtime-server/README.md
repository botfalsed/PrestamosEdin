# 🚀 Servidor de Tiempo Real - PrestamosEdin

Servidor independiente Socket.io para notificaciones en tiempo real sin afectar la funcionalidad existente.

## 📋 Instalación

```bash
cd realtime-server
npm install
```

## 🏃‍♂️ Ejecución

### Desarrollo
```bash
npm run dev
```

### Producción
```bash
npm start
```

## 🔗 Endpoints

- **WebSocket**: `ws://localhost:3001`
- **Health Check**: `http://localhost:3001/health`
- **Estadísticas**: `http://localhost:3001/stats`
- **Emitir Evento**: `POST http://localhost:3001/emit-event`

## 📡 Uso desde Backend PHP

```php
// Ejemplo de emisión de evento desde PHP
$data = [
    'eventType' => 'pago_registrado',
    'data' => [
        'prestamoId' => $prestamoId,
        'monto' => $monto,
        'usuario' => $usuario
    ]
];

$ch = curl_init('http://localhost:3001/emit-event');
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_exec($ch);
curl_close($ch);
```

## 🎯 Eventos Disponibles

- `pago_registrado`: Nuevo pago registrado
- `prestamo_creado`: Nuevo préstamo creado
- `prestamo_actualizado`: Préstamo modificado
- `connection_status`: Estado de conexión

## 🔧 Configuración

El servidor escucha en el puerto 3001 por defecto. Puede cambiarse con la variable de entorno `PORT`.