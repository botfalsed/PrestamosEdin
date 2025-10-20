/**
 * Servicio de Socket.io para PrestamosMobile
 * Maneja la conexión en tiempo real y las notificaciones push
 */

import io from 'socket.io-client';
import { Alert, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.listeners = new Map();
    this.connectionStatus = {
      isConnected: false,
      socketId: null,
      reconnectAttempts: 0
    };
  }

  /**
   * Conectar al servidor Socket.io
   */
  connect() {
    try {
      // URL del servidor Socket.io (localhost para desarrollo)
      const serverUrl = Platform.OS === 'web' 
        ? 'http://localhost:3001' 
        : 'http://10.0.2.2:3001'; // Para Android Emulator

      console.log('🔌 [SocketService] Conectando a:', serverUrl);

      this.socket = io(serverUrl, {
        transports: ['websocket', 'polling'],
        timeout: 10000,
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: 2000,
        reconnectionDelayMax: 10000,
        forceNew: true
      });

      this.setupEventListeners();
      
    } catch (error) {
      console.error('❌ [SocketService] Error conectando:', error);
      this.handleConnectionError(error);
    }
  }

  /**
   * Configurar listeners de eventos del socket
   */
  setupEventListeners() {
    if (!this.socket) return;

    // Evento de conexión exitosa
    this.socket.on('connect', () => {
      console.log('✅ [SocketService] Conectado con ID:', this.socket.id);
      this.isConnected = true;
      this.reconnectAttempts = 0;
      
      this.connectionStatus = {
        isConnected: true,
        socketId: this.socket.id,
        reconnectAttempts: 0
      };

      // Registrar como cliente móvil
      this.socket.emit('register_client', {
        clientType: 'mobile',
        platform: Platform.OS,
        timestamp: new Date().toISOString()
      });

      // Notificar a listeners sobre el cambio de estado
      this.emit('connection_status', {
        status: 'connected',
        socketId: this.socket.id
      });
    });

    // Evento de desconexión
    this.socket.on('disconnect', (reason) => {
      console.log('🔌 [SocketService] Desconectado:', reason);
      this.isConnected = false;
      
      this.connectionStatus = {
        isConnected: false,
        socketId: null,
        reconnectAttempts: this.reconnectAttempts
      };

      this.emit('connection_status', {
        status: 'disconnected',
        reason
      });
    });

    // Evento de error de conexión
    this.socket.on('connect_error', (error) => {
      console.error('❌ [SocketService] Error de conexión:', error.message);
      this.reconnectAttempts++;
      
      this.connectionStatus.reconnectAttempts = this.reconnectAttempts;
      
      this.handleConnectionError(error);
    });

    // Eventos específicos de la aplicación
    this.socket.on('pago_registrado', (data) => {
      console.log('💰 [SocketService] Pago registrado:', data);
      this.handlePagoRegistrado(data);
    });

    this.socket.on('prestamo_creado', (data) => {
      console.log('📋 [SocketService] Préstamo creado:', data);
      this.handlePrestamoCreado(data);
    });

    this.socket.on('prestamo_actualizado', (data) => {
      console.log('📝 [SocketService] Préstamo actualizado:', data);
      this.handlePrestamoActualizado(data);
    });

    // Evento de reconexión exitosa
    this.socket.on('reconnect', (attemptNumber) => {
      console.log('🔄 [SocketService] Reconectado después de', attemptNumber, 'intentos');
      this.reconnectAttempts = 0;
    });
  }

  /**
   * Manejar evento de pago registrado
   */
  handlePagoRegistrado(data) {
    const notification = {
      type: 'success',
      title: '💰 Nuevo Pago Registrado',
      message: `${data.prestatario?.nombre || 'Cliente'} pagó S/. ${data.monto || '0.00'}`,
      data: data
    };

    this.showNotification(notification);
    this.emit('pago_registrado', data);
  }

  /**
   * Manejar evento de préstamo creado
   */
  handlePrestamoCreado(data) {
    const notification = {
      type: 'info',
      title: '📋 Nuevo Préstamo Creado',
      message: `Préstamo de S/. ${data.monto || '0.00'} para ${data.prestatario?.nombre || 'Cliente'}`,
      data: data
    };

    this.showNotification(notification);
    this.emit('prestamo_creado', data);
  }

  /**
   * Manejar evento de préstamo actualizado
   */
  handlePrestamoActualizado(data) {
    const notification = {
      type: 'warning',
      title: '📝 Préstamo Actualizado',
      message: `Estado del préstamo ID ${data.id || 'N/A'} ha cambiado`,
      data: data
    };

    this.showNotification(notification);
    this.emit('prestamo_actualizado', data);
  }

  /**
   * Mostrar notificación al usuario
   */
  showNotification(notification) {
    // Emitir evento para componentes que escuchen
    this.emit('show_notification', notification);

    // Mostrar Alert nativo como fallback
    if (Platform.OS !== 'web') {
      Alert.alert(
        notification.title,
        notification.message,
        [{ text: 'OK', style: 'default' }],
        { cancelable: true }
      );
    }
  }

  /**
   * Manejar errores de conexión
   */
  handleConnectionError(error) {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('❌ [SocketService] Máximo de intentos de reconexión alcanzado');
      
      this.emit('connection_error', {
        error: error.message,
        maxAttemptsReached: true
      });
    } else {
      console.log(`🔄 [SocketService] Reintentando conexión (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      this.emit('connection_error', {
        error: error.message,
        attempt: this.reconnectAttempts,
        maxAttempts: this.maxReconnectAttempts
      });
    }
  }

  /**
   * Registrar listener para eventos
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  /**
   * Remover listener de eventos
   */
  off(event, callback) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  /**
   * Emitir evento a listeners locales
   */
  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`❌ [SocketService] Error en callback de ${event}:`, error);
        }
      });
    }
  }

  /**
   * Desconectar del servidor
   */
  disconnect() {
    if (this.socket) {
      console.log('🔌 [SocketService] Desconectando...');
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      
      this.connectionStatus = {
        isConnected: false,
        socketId: null,
        reconnectAttempts: 0
      };
    }
  }

  /**
   * Obtener estado de conexión
   */
  getConnectionStatus() {
    return {
      ...this.connectionStatus,
      isConnected: this.isConnected
    };
  }

  /**
   * Verificar si está conectado
   */
  isSocketConnected() {
    return this.isConnected && this.socket && this.socket.connected;
  }

  /**
   * Enviar evento al servidor (si es necesario)
   */
  sendEvent(eventName, data) {
    if (this.isSocketConnected()) {
      this.socket.emit(eventName, data);
    } else {
      console.warn('⚠️ [SocketService] No conectado, no se puede enviar evento:', eventName);
    }
  }
}

// Exportar instancia singleton
const socketService = new SocketService();
export default socketService;