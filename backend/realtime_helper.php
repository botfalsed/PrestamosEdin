<?php
/**
 * Helper para emitir eventos al servidor de tiempo real
 * Sin afectar la funcionalidad existente del backend
 */

function emitRealtimeEvent($eventType, $data, $room = null) {
    // Solo emitir si el servidor de tiempo real está disponible
    $realtimeUrl = 'http://localhost:3001/emit-event';
    
    $payload = [
        'eventType' => $eventType,
        'data' => $data
    ];
    
    if ($room) {
        $payload['room'] = $room;
    }
    
    // Usar cURL de forma asíncrona para no bloquear la respuesta principal
    $ch = curl_init($realtimeUrl);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'Content-Length: ' . strlen(json_encode($payload))
    ]);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 1); // Timeout corto para no afectar rendimiento
    curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 1);
    curl_setopt($ch, CURLOPT_NOSIGNAL, 1); // Evitar problemas con señales
    
    // Ejecutar de forma no bloqueante
    $result = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    // Log opcional para debugging (no afecta la funcionalidad principal)
    if ($httpCode !== 200) {
        error_log("Realtime event failed: $eventType - HTTP $httpCode");
    }
    
    return $httpCode === 200;
}

/**
 * Emitir evento de pago registrado
 */
function emitPagoRegistrado($prestamoData, $montoPago, $saldoRestante) {
    return emitRealtimeEvent('pago_registrado', [
        'id_prestamo' => $prestamoData['id_prestamo'],
        'id_prestatario' => $prestamoData['id_prestatario'],
        'prestatario_nombre' => $prestamoData['nombre'],
        'monto_pago' => $montoPago,
        'saldo_restante' => $saldoRestante,
        'monto_total' => $prestamoData['monto_total'],
        'estado' => $prestamoData['estado']
    ]);
}

/**
 * Emitir evento de préstamo creado
 */
function emitPrestamoCreado($prestamoId, $prestatarioId, $montoInicial, $montoTotal) {
    return emitRealtimeEvent('prestamo_creado', [
        'id_prestamo' => $prestamoId,
        'id_prestatario' => $prestatarioId,
        'monto_inicial' => $montoInicial,
        'monto_total' => $montoTotal,
        'estado' => 'activo'
    ]);
}

/**
 * Emitir evento de préstamo actualizado
 */
function emitPrestamoActualizado($prestamoId, $nuevoEstado, $saldoPendiente = null) {
    $data = [
        'id_prestamo' => $prestamoId,
        'estado' => $nuevoEstado
    ];
    
    if ($saldoPendiente !== null) {
        $data['saldo_pendiente'] = $saldoPendiente;
    }
    
    return emitRealtimeEvent('prestamo_actualizado', $data);
}
?>