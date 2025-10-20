/**
 * Hook para manejar actualizaciones en tiempo real en PrestamosMobile
 * Integra Socket.io para notificaciones push y sincronización automática
 */

import { useEffect, useRef, useState } from 'react';
import { AppState, Platform } from 'react-native';
import socketService from '../services/socketService';

/**
 * Hook personalizado para actualizaciones en tiempo real
 * @param {Object} options - Opciones de configuración
 * @param {Function} onPagoRegistrado - Callback cuando se registra un pago
 * @param {Function} onPrestamoCreado - Callback cuando se crea un préstamo
 * @param {Function} onPrestamoActualizado - Callback cuando se actualiza un préstamo
 * @param {Function} onConnectionChange - Callback cuando cambia el estado de conexión
 * @param {boolean} autoConnect - Si debe conectar automáticamente
 * @param {boolean} reconnectOnForeground - Si debe reconectar cuando la app vuelve al foreground
 */
export const useRealtimeUpdates = ({
  onPagoRegistrado = null,
  onPrestamoCreado = null,
  onPrestamoActualizado = null,
  onConnectionChange = null,
  onNotification = null,
  autoConnect = true,
  reconnectOnForeground = true
} = {}) => {
  
  const [connectionStatus, setConnectionStatus] = useState({
    isConnected: false,
    socketId: null,
    reconnectAttempts: 0
  });
  
  const [notifications, setNotifications] = useState([]);
  const [lastUpdate, setLastUpdate] = useState(null);
  
  // Referencias para evitar re-renders innecesarios
  const callbacksRef = useRef({
    onPagoRegistrado,
    onPrestamoCreado,
    onPrestamoActualizado,
    onConnectionChange,
    onNotification
  });

  const appStateRef = useRef(AppState.currentState);

  // Actualizar callbacks
  callbacksRef.current = {
    onPagoRegistrado,
    onPrestamoCreado,
    onPrestamoActualizado,
    onConnectionChange,
    onNotification
  };

  useEffect(() => {
    if (!autoConnect) return;

    // Conectar al servicio de Socket.io
    socketService.connect();

    // Handlers para eventos específicos
    const handlePagoRegistrado = (data) => {
      console.log('🎯 [useRealtimeUpdates] Pago registrado:', data);
      setLastUpdate({
        type: 'pago_registrado',
        data,
        timestamp: new Date().toISOString()
      });
      
      if (callbacksRef.current.onPagoRegistrado) {
        callbacksRef.current.onPagoRegistrado(data);
      }
    };

    const handlePrestamoCreado = (data) => {
      console.log('🎯 [useRealtimeUpdates] Préstamo creado:', data);
      setLastUpdate({
        type: 'prestamo_creado',
        data,
        timestamp: new Date().toISOString()
      });
      
      if (callbacksRef.current.onPrestamoCreado) {
        callbacksRef.current.onPrestamoCreado(data);
      }
    };

    const handlePrestamoActualizado = (data) => {
      console.log('🎯 [useRealtimeUpdates] Préstamo actualizado:', data);
      setLastUpdate({
        type: 'prestamo_actualizado',
        data,
        timestamp: new Date().toISOString()
      });
      
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

    const handleShowNotification = (data) => {
      console.log('🎯 [useRealtimeUpdates] Mostrar notificación:', data);
      const notification = {
        id: Date.now() + Math.random(),
        ...data,
        timestamp: new Date().toISOString()
      };
      
      setNotifications(prev => [notification, ...prev.slice(0, 4)]); // Mantener solo las últimas 5
      
      if (callbacksRef.current.onNotification) {
        callbacksRef.current.onNotification(notification);
      }
      
      // Auto-remover después de 8 segundos
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== notification.id));
      }, 8000);
    };

    const handleConnectionError = (data) => {
      console.log('🎯 [useRealtimeUpdates] Error de conexión:', data);
      setConnectionStatus(prev => ({
        ...prev,
        isConnected: false,
        reconnectAttempts: data.attempt || 0
      }));
    };

    // Registrar listeners
    socketService.on('pago_registrado', handlePagoRegistrado);
    socketService.on('prestamo_creado', handlePrestamoCreado);
    socketService.on('prestamo_actualizado', handlePrestamoActualizado);
    socketService.on('connection_status', handleConnectionStatus);
    socketService.on('show_notification', handleShowNotification);
    socketService.on('connection_error', handleConnectionError);

    // Cleanup al desmontar
    return () => {
      socketService.off('pago_registrado', handlePagoRegistrado);
      socketService.off('prestamo_creado', handlePrestamoCreado);
      socketService.off('prestamo_actualizado', handlePrestamoActualizado);
      socketService.off('connection_status', handleConnectionStatus);
      socketService.off('show_notification', handleShowNotification);
      socketService.off('connection_error', handleConnectionError);
    };
  }, [autoConnect]);

  // Manejar cambios de estado de la app (foreground/background)
  useEffect(() => {
    if (!reconnectOnForeground) return;

    const handleAppStateChange = (nextAppState) => {
      console.log('🎯 [useRealtimeUpdates] App state cambió:', appStateRef.current, '->', nextAppState);
      
      if (appStateRef.current.match(/inactive|background/) && nextAppState === 'active') {
        // App volvió al foreground
        console.log('🎯 [useRealtimeUpdates] App en foreground, verificando conexión...');
        
        if (!socketService.isSocketConnected()) {
          console.log('🎯 [useRealtimeUpdates] Reconectando Socket.io...');
          socketService.connect();
        }
      }
      
      appStateRef.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription?.remove();
    };
  }, [reconnectOnForeground]);

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

  // Función para forzar reconexión
  const reconnect = () => {
    disconnect();
    setTimeout(() => {
      connect();
    }, 1000);
  };

  // Función para enviar evento al servidor
  const sendEvent = (eventName, data) => {
    socketService.sendEvent(eventName, data);
  };

  return {
    // Estado de conexión
    connectionStatus,
    isConnected: connectionStatus.isConnected,
    
    // Notificaciones
    notifications,
    hasNotifications: notifications.length > 0,
    
    // Última actualización recibida
    lastUpdate,
    
    // Funciones de control
    removeNotification,
    clearAllNotifications,
    connect,
    disconnect,
    reconnect,
    sendEvent,
    
    // Información adicional
    platform: Platform.OS,
    socketId: connectionStatus.socketId
  };
};

export default useRealtimeUpdates;