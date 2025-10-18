// PrestamosMobile/app/utils/sincronizacion.js
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState } from 'react-native';

const API_URL = 'http://192.168.18.22:8080/api_postgres.php'; // Nueva API con PostgreSQL

class SyncManagerMobile {
  constructor() {
    this.lastSync = null;
    this.syncInterval = null;
    this.listeners = new Map();
    this.isRunning = false;
    this.appStateSubscription = null;
    this.initLastSync();
  }

  // Inicializar última sincronización desde AsyncStorage
  async initLastSync() {
    try {
      const stored = await AsyncStorage.getItem('lastSync');
      this.lastSync = stored || '1970-01-01 00:00:00';
    } catch (error) {
      console.error('Error cargando lastSync:', error);
      this.lastSync = '1970-01-01 00:00:00';
    }
  }

  // Guardar timestamp de última sincronización
  async setLastSyncTime(timestamp) {
    this.lastSync = timestamp;
    try {
      await AsyncStorage.setItem('lastSync', timestamp);
    } catch (error) {
      console.error('Error guardando lastSync:', error);
    }
  }

  // Iniciar sincronización automática (solo cuando app está activa)
  start(intervalSeconds = 10) {
    if (this.isRunning) {
      console.log('⏸️ Sincronización ya está corriendo');
      return;
    }

    console.log(`🔄 Iniciando sincronización móvil cada ${intervalSeconds} segundos`);
    this.isRunning = true;

    // Primera sincronización inmediata
    this.sync();

    // Sincronizar cada X segundos
    this.syncInterval = setInterval(() => {
      this.sync();
    }, intervalSeconds * 1000);

    // Escuchar cambios de estado de la app
    this.appStateSubscription = AppState.addEventListener('change', this.handleAppStateChange);
  }

  // Manejar cambios de estado de la app (activa/background)
  handleAppStateChange = (nextAppState) => {
    if (nextAppState === 'active') {
      console.log('📱 App activa - Reanudando sincronización');
      this.sync(); // Sincronizar inmediatamente al volver
    } else if (nextAppState === 'background') {
      console.log('📱 App en background - Manteniendo sync');
    }
  }

  // Detener sincronización automática
  stop() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
      this.isRunning = false;
      console.log('⏹️ Sincronización detenida');
    }

    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
      this.appStateSubscription = null;
    }
  }

  // Sincronizar cambios con el servidor
  async sync() {
    try {
      if (!this.lastSync) {
        await this.initLastSync();
      }

      console.log('🔄 [MOBILE] Sincronizando desde:', this.lastSync);

      const response = await axios.get(`${API_URL}?action=sync`, {
        params: { last_sync: this.lastSync },
        timeout: 5000 // Timeout de 5 segundos
      });

      if (response.data.success) {
        const { cambios, timestamp_actual } = response.data;

        if (cambios.length > 0) {
          console.log(`✅ [MOBILE] ${cambios.length} cambios recibidos`);

          // Procesar cambios por tabla
          this.procesarCambios(cambios);

          // Actualizar timestamp
          await this.setLastSyncTime(timestamp_actual);

          // Marcar como sincronizados
          const ids = cambios.map(c => c.id_cambio);
          await this.marcarComoSincronizados(ids);
        } else {
          console.log('✓ [MOBILE] Sin cambios nuevos');
        }

        return { success: true, cambios };
      }
    } catch (error) {
      console.error('❌ [MOBILE] Error sincronizando:', error.message);
      return { success: false, error };
    }
  }

  // Procesar cambios por tabla
  procesarCambios(cambios) {
    // Agrupar cambios por tabla
    const cambiosPorTabla = cambios.reduce((acc, cambio) => {
      if (!acc[cambio.tabla]) {
        acc[cambio.tabla] = [];
      }
      acc[cambio.tabla].push(cambio);
      return acc;
    }, {});

    // Notificar a los listeners de cada tabla
    Object.entries(cambiosPorTabla).forEach(([tabla, cambiosTabla]) => {
      console.log(`📊 [MOBILE] Procesando ${cambiosTabla.length} cambios en: ${tabla}`);
      this.notifyListeners(tabla, cambiosTabla);
    });
  }

  // Marcar cambios como sincronizados en el servidor
  async marcarComoSincronizados(ids) {
    try {
      await axios.post(`${API_URL}?action=mark_synced`, { ids });
      console.log('✓ [MOBILE] Cambios marcados como sincronizados');
    } catch (error) {
      console.error('[MOBILE] Error marcando sincronizados:', error);
    }
  }

  // Registrar listener para una tabla específica
  on(tabla, callback) {
    if (!this.listeners.has(tabla)) {
      this.listeners.set(tabla, []);
    }
    this.listeners.get(tabla).push(callback);
    console.log(`📡 [MOBILE] Listener registrado para: ${tabla}`);
  }

  // Eliminar listener
  off(tabla, callback) {
    if (this.listeners.has(tabla)) {
      const callbacks = this.listeners.get(tabla);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  // Notificar a todos los listeners de una tabla
  notifyListeners(tabla, cambios) {
    if (this.listeners.has(tabla)) {
      this.listeners.get(tabla).forEach(callback => {
        callback(cambios);
      });
    }
  }

  // Forzar sincronización completa
  async forceFullSync() {
    console.log('🔄 [MOBILE] Forzando sincronización completa...');
    await this.setLastSyncTime('1970-01-01 00:00:00');
    return await this.sync();
  }

  // Limpiar caché de sincronización
  async clearSyncCache() {
    try {
      await AsyncStorage.removeItem('lastSync');
      this.lastSync = '1970-01-01 00:00:00';
      console.log('🗑️ [MOBILE] Caché de sincronización limpiado');
    } catch (error) {
      console.error('Error limpiando caché:', error);
    }
  }
}

// Crear instancia global
const syncManagerMobile = new SyncManagerMobile();

export default syncManagerMobile;