import { useEffect, useRef, useState } from 'react';
import socketService from '../services/socketService';

/**
 * Hook para manejar actualizaciones en tiempo real
 * @param {Object} options - Opciones de configuración
 * @param {Function} onPagoRegistrado - Callback cuando se registra un pago
 * @param {Function} onPrestamoCreado - Callback cuando se crea un préstamo
 * @param {Function} onPrestamoActualizado - Callback cuando se actualiza un préstamo
 * @param {boolean} autoConnect - Si debe conectar automáticamente
 */
export const useRealtimeUpdates = ({
  onPagoRegistrado = null,
  onPrestamoCreado = null,
  onPrestamoActualizado = null,
  onConnectionChange = null,
  autoConnect = true
} = {}) => {
  const [connectionStatus, setConnectionStatus] = useState({
    isConnected: false,
    socketId: null,
    reconnectAttempts: 0
  });
  const [notifications, setNotifications] = useState([]);
  
  // Referencias para evitar re-renders innecesarios
  const callbacksRef = useRef({
    onPagoRegistrado,
    onPrestamoCreado,
    onPrestamoActualizado,
    onConnectionChange
  });

  // Actualizar callbacks
  callbacksRef.current = {
    onPagoRegistrado,
    onPrestamoCreado,
    onPrestamoActualizado,
    onConnectionChange
  };

  useEffect(() => {
    if (!autoConnect) return;

    // Conectar al servicio de Socket.io
    socketService.connect();

    // Handlers para eventos específicos
    const handlePagoRegistrado = (data) => {
      console.log('🎯 [useRealtimeUpdates] Pago registrado:', data);
      if (callbacksRef.current.onPagoRegistrado) {
        callbacksRef.current.onPagoRegistrado(data);
      }
    };

    const handlePrestamoCreado = (data) => {
      console.log('🎯 [useRealtimeUpdates] Préstamo creado:', data);
      if (callbacksRef.current.onPrestamoCreado) {
        callbacksRef.current.onPrestamoCreado(data);
      }
    };

    const handlePrestamoActualizado = (data) => {
      console.log('🎯 [useRealtimeUpdates] Préstamo actualizado:', data);
      if (callbacksRef.current.onPrestamoActualizado) {
        callbacksRef.current.onPrestamoActualizado(data);
      }
    };

    const handleConnectionStatus = (data) => {
      console.log('🎯 [useRealtimeUpdates] Estado de conexión:', data);
      const newStatus = {
        isConnected: data.status === 'connected',
        socketId: data.socketId || null,
        reconnectAttempts: socketService.getConnectionStatus().reconnectAttempts
      };
      
      setConnectionStatus(newStatus);
      
      if (callbacksRef.current.onConnectionChange) {
        callbacksRef.current.onConnectionChange(newStatus);
      }
    };

    const handleShowToast = (data) => {
      console.log('🎯 [useRealtimeUpdates] Mostrar notificación:', data);
      const notification = {
        id: Date.now() + Math.random(),
        ...data,
        timestamp: new Date().toISOString()
      };
      
      setNotifications(prev => [...prev.slice(-4), notification]); // Mantener solo las últimas 5
      
      // Auto-remover después de 5 segundos
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== notification.id));
      }, 5000);
    };

    // Registrar listeners
    socketService.on('pago_registrado', handlePagoRegistrado);
    socketService.on('prestamo_creado', handlePrestamoCreado);
    socketService.on('prestamo_actualizado', handlePrestamoActualizado);
    socketService.on('connection_status', handleConnectionStatus);
    socketService.on('show_toast', handleShowToast);

    // Cleanup al desmontar
    return () => {
      socketService.off('pago_registrado', handlePagoRegistrado);
      socketService.off('prestamo_creado', handlePrestamoCreado);
      socketService.off('prestamo_actualizado', handlePrestamoActualizado);
      socketService.off('connection_status', handleConnectionStatus);
      socketService.off('show_toast', handleShowToast);
    };
  }, [autoConnect]);

  // Función para remover notificación manualmente
  const removeNotification = (notificationId) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  // Función para limpiar todas las notificaciones
  const clearAllNotifications = () => {
    setNotifications([]);
  };

  // Función para conectar manualmente
  const connect = () => {
    socketService.connect();
  };

  // Función para desconectar manualmente
  const disconnect = () => {
    socketService.disconnect();
    setConnectionStatus({
      isConnected: false,
      socketId: null,
      reconnectAttempts: 0
    });
  };

  return {
    connectionStatus,
    notifications,
    removeNotification,
    clearAllNotifications,
    connect,
    disconnect,
    // Funciones de utilidad
    isConnected: connectionStatus.isConnected,
    hasNotifications: notifications.length > 0
  };
};

export default useRealtimeUpdates;