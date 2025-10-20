// dashboard/src/utils/sincronizacion.js
import axios from 'axios';

const API_URL = 'http://localhost:8080/api_postgres.php';

class SyncManager {
  constructor() {
    this.lastSync = this.getLastSyncTime();
    this.syncInterval = null;
    this.listeners = new Map();
    this.isRunning = false;
  }

  // Obtener última sincronización del localStorage
  getLastSyncTime() {
    const stored = localStorage.getItem('lastSync');
    return stored || '1970-01-01 00:00:00';
  }

  // Guardar timestamp de última sincronización
  setLastSyncTime(timestamp) {
    this.lastSync = timestamp;
    localStorage.setItem('lastSync', timestamp);
  }

  // Iniciar sincronización automática
  start(intervalSeconds = 5) {
    if (this.isRunning) {
      console.log('⏸️ Sincronización ya está corriendo');
      return;
    }

    console.log(`🔄 Iniciando sincronización cada ${intervalSeconds} segundos`);
    this.isRunning = true;

    // Primera sincronización inmediata
    this.sync();

    // Sincronizar cada X segundos
    this.syncInterval = setInterval(() => {
      this.sync();
    }, intervalSeconds * 1000);
  }

  // Detener sincronización automática
  stop() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
      this.isRunning = false;
      console.log('⏹️ Sincronización detenida');
    }
  }

  // Sincronizar cambios con el servidor
  async sync() {
    try {
      console.log('🔄 Sincronizando cambios desde:', this.lastSync);

      const response = await axios.get(`${API_URL}?action=sync`, {
        params: { last_sync: this.lastSync }
      });

      if (response.data.success) {
        const { cambios, timestamp_actual } = response.data;

        if (cambios.length > 0) {
          console.log(`✅ ${cambios.length} cambios recibidos`);

          // Procesar cambios por tabla
          this.procesarCambios(cambios);

          // Actualizar timestamp
          this.setLastSyncTime(timestamp_actual);

          // Marcar como sincronizados
          const ids = cambios.map(c => c.id_cambio);
          await this.marcarComoSincronizados(ids);
        } else {
          console.log('✓ Sin cambios nuevos');
        }

        return { success: true, cambios };
      }
    } catch (error) {
      console.error('❌ Error sincronizando:', error.message);
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
      console.log(`📊 Procesando ${cambiosTabla.length} cambios en tabla: ${tabla}`);
      this.notifyListeners(tabla, cambiosTabla);
    });
  }

  // Marcar cambios como sincronizados en el servidor
  async marcarComoSincronizados(ids) {
    try {
      await axios.post(`${API_URL}?action=mark_synced`, { ids });
      console.log('✓ Cambios marcados como sincronizados');
    } catch (error) {
      console.error('Error marcando sincronizados:', error);
    }
  }

  // Registrar listener para una tabla específica
  on(tabla, callback) {
    if (!this.listeners.has(tabla)) {
      this.listeners.set(tabla, []);
    }
    this.listeners.get(tabla).push(callback);
    console.log(`📡 Listener registrado para tabla: ${tabla}`);
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

  // Obtener estadísticas de sincronización
  async getStats() {
    try {
      const response = await axios.get(`${API_URL}?action=sync_stats`);
      return response.data;
    } catch (error) {
      console.error('Error obteniendo stats:', error);
      return null;
    }
  }

  // Limpiar cambios antiguos del servidor
  async cleanOldChanges(dias = 7) {
    try {
      const response = await axios.post(`${API_URL}?action=clean_old_sync&dias=${dias}`);
      return response.data;
    } catch (error) {
      console.error('Error limpiando cambios antiguos:', error);
      return null;
    }
  }

  // Forzar sincronización completa (resetear timestamp)
  async forceFullSync() {
    console.log('🔄 Forzando sincronización completa...');
    this.setLastSyncTime('1970-01-01 00:00:00');
    return await this.sync();
  }
}

// Crear instancia global
const syncManager = new SyncManager();

export default syncManager;
