import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.listeners = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10; // Aumentar intentos
    this.reconnectDelay = 1000; // Delay inicial
    this.maxReconnectDelay = 30000; // Delay máximo
    this.reconnectTimer = null;
  }

  // Conectar al servidor de tiempo real
  connect(url = 'http://localhost:3001') {
    if (this.socket && this.isConnected) {
      console.log('🔗 Socket ya está conectado');
      return;
    }

    try {
      this.socket = io(url, {
        transports: ['websocket', 'polling'],
        timeout: 10000, // Aumentar timeout
        reconnection: true,
        reconnectionDelay: this.reconnectDelay,
        reconnectionDelayMax: this.maxReconnectDelay,
        reconnectionAttempts: this.maxReconnectAttempts,
        randomizationFactor: 0.5, // Añadir randomización
        forceNew: false,
        autoConnect: true
      });

      this.setupEventListeners();
      console.log('🚀 Intentando conectar a Socket.io:', url);
      
    } catch (error) {
      console.error('❌ Error al conectar Socket.io:', error);
      this.scheduleReconnect();
    }
  }

  // Configurar listeners de eventos del socket
  setupEventListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      this.isConnected = true;
      this.resetReconnectAttempts(); // Resetear intentos al conectar exitosamente
      console.log('✅ Socket conectado:', this.socket.id);
      
      // Unirse a la sala del dashboard
      this.socket.emit('join_room', { room: 'dashboard' });
      
      // Notificar a todos los listeners sobre la conexión
      this.notifyListeners('connection_status', { 
        status: 'connected', 
        socketId: this.socket.id 
      });
    });

    this.socket.on('disconnect', (reason) => {
      this.isConnected = false;
      console.log('❌ Socket desconectado:', reason);
      
      this.notifyListeners('connection_status', { 
        status: 'disconnected', 
        reason 
      });
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ Error de conexión Socket:', error);
      this.reconnectAttempts++;
      
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('❌ Máximo de intentos de reconexión alcanzado');
        this.notifyListeners('connection_status', { 
          status: 'failed', 
          error: 'Máximo de intentos de reconexión alcanzado',
          attempts: this.reconnectAttempts
        });
      } else {
        console.log(`🔄 Intento de reconexión ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
        this.notifyListeners('connection_status', { 
          status: 'reconnecting', 
          attempts: this.reconnectAttempts,
          maxAttempts: this.maxReconnectAttempts
        });
      }
    });

    // Escuchar eventos específicos de la aplicación
    this.socket.on('pago_registrado', (data) => {
      console.log('💰 Pago registrado recibido:', data);
      this.notifyListeners('pago_registrado', data);
      
      // Mostrar notificación visual
      this.showNotification('💰 Nuevo Pago Registrado', 
        `Pago de $${data.monto_pago} para ${data.prestatario_nombre}`);
    });

    this.socket.on('prestamo_creado', (data) => {
      console.log('📋 Préstamo creado recibido:', data);
      this.notifyListeners('prestamo_creado', data);
      
      this.showNotification('📋 Nuevo Préstamo Creado', 
        `Préstamo por $${data.monto_inicial} registrado`);
    });

    this.socket.on('prestamo_actualizado', (data) => {
      console.log('🔄 Préstamo actualizado recibido:', data);
      this.notifyListeners('prestamo_actualizado', data);
    });
  }

  // Registrar listener para eventos específicos
  on(eventName, callback) {
    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, new Set());
    }
    this.listeners.get(eventName).add(callback);
    
    console.log(`📡 Listener registrado para: ${eventName}`);
  }

  // Desregistrar listener
  off(eventName, callback) {
    if (this.listeners.has(eventName)) {
      this.listeners.get(eventName).delete(callback);
      console.log(`🔌 Listener desregistrado para: ${eventName}`);
    }
  }

  // Notificar a todos los listeners de un evento
  notifyListeners(eventName, data) {
    if (this.listeners.has(eventName)) {
      this.listeners.get(eventName).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`❌ Error en listener ${eventName}:`, error);
        }
      });
    }
  }

  // Mostrar notificación visual
  showNotification(title, message, type = 'info') {
    // Verificar si el navegador soporta notificaciones
    if ('Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification(title, {
          body: message,
          icon: '/favicon.ico',
          tag: 'prestamos-notification'
        });
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') {
            new Notification(title, {
              body: message,
              icon: '/favicon.ico',
              tag: 'prestamos-notification'
            });
          }
        });
      }
    }

    // También mostrar notificación in-app
    this.notifyListeners('show_toast', {
      title,
      message,
      type,
      timestamp: new Date().toISOString()
    });
  }

  // Desconectar socket
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.listeners.clear();
      console.log('🔌 Socket desconectado manualmente');
    }
  }

  // Obtener estado de conexión
  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      socketId: this.socket?.id || null,
      reconnectAttempts: this.reconnectAttempts
    };
  }

  // Emitir evento al servidor (opcional)
  emit(eventName, data) {
    if (this.socket && this.isConnected) {
      this.socket.emit(eventName, data);
      console.log(`📤 Evento emitido: ${eventName}`, data);
    } else {
      console.warn('⚠️ Socket no conectado, no se puede emitir evento:', eventName);
    }
  }

  // Programar reconexión manual con backoff exponencial
  scheduleReconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('❌ Máximo de intentos de reconexión alcanzado');
      return;
    }

    // Backoff exponencial con jitter
    const delay = Math.min(
      this.reconnectDelay * Math.pow(2, this.reconnectAttempts),
      this.maxReconnectDelay
    );
    const jitter = delay * 0.1 * Math.random();
    const finalDelay = delay + jitter;

    console.log(`🔄 Programando reconexión en ${Math.round(finalDelay)}ms (intento ${this.reconnectAttempts + 1}/${this.maxReconnectAttempts})`);

    this.reconnectTimer = setTimeout(() => {
      this.reconnectAttempts++;
      this.connect();
    }, finalDelay);
  }

  // Resetear contador de reconexión
  resetReconnectAttempts() {
    this.reconnectAttempts = 0;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }
}

// Crear instancia singleton
const socketService = new SocketService();

export default socketService;