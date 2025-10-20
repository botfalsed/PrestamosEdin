import SYNC_CONFIG from '../config/syncConfig';

class SyncService {
  constructor() {
    this.lastSync = this.getLastSyncTime();
    this.retryCount = 0;
    this.isOnline = navigator.onLine;
    this.syncQueue = [];
  }

  /**
   * Obtener el último timestamp de sincronización
   */
  getLastSyncTime() {
    const stored = localStorage.getItem(SYNC_CONFIG.STORAGE_KEY_LAST_SYNC);
    return stored || '1970-01-01 00:00:00';
  }

  /**
   * Guardar el último timestamp de sincronización
   */
  setLastSyncTime(timestamp) {
    this.lastSync = timestamp;
    localStorage.setItem(SYNC_CONFIG.STORAGE_KEY_LAST_SYNC, timestamp);
  }

  /**
   * Obtener cambios desde la última sincronización
   */
  async obtenerCambios() {
    try {
      const url = new URL(SYNC_CONFIG.API_BASE_URL);
      url.searchParams.append('action', 'sync');
      url.searchParams.append('last_sync', this.lastSync);

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: SYNC_CONFIG.REQUEST_TIMEOUT,
      });

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        this.retryCount = 0; // Reset retry count
        this.setLastSyncTime(data.timestamp_actual);
        
        if (SYNC_CONFIG.onSyncSuccess) {
          SYNC_CONFIG.onSyncSuccess(data);
        }

        // Procesar cambios ANTES de marcar como sincronizados
        if (data.cambios && data.cambios.length > 0) {
          this.procesarCambios(data.cambios);
          
          // Marcar cambios como sincronizados después de procesarlos
          await this.marcarComoSincronizados(
            data.cambios.map(c => c.id_cambio)
          );
        }

        // IMPORTANTE: Retornar los cambios para que el hook los reciba
        return data;
      } else {
        throw new Error(data.error || 'Error desconocido en sincronización');
      }
    } catch (error) {
      console.error('Error al obtener cambios:', error);
      this.manejarErrorSync(error);
      throw error;
    }
  }

  /**
   * Procesar cambios recibidos
   */
  procesarCambios(cambios) {
    cambios.forEach(cambio => {
      if (SYNC_CONFIG.onChangeDetected) {
        SYNC_CONFIG.onChangeDetected(cambio);
      }

      // Log por tabla
      console.log(
        `[SYNC] ${cambio.tabla} - ${cambio.tipo_accion} (ID: ${cambio.id_registro})`
      );
    });
  }

  /**
   * Marcar cambios como sincronizados
   */
  async marcarComoSincronizados(ids) {
    try {
      const response = await fetch(
        `${SYNC_CONFIG.API_BASE_URL}?action=mark_synced`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ ids }),
          timeout: SYNC_CONFIG.REQUEST_TIMEOUT,
        }
      );

      const data = await response.json();
      if (data.success) {
        console.log(`[SYNC] ${ids.length} cambios marcados como sincronizados`);
      } else {
        console.warn('No se pudieron marcar cambios como sincronizados:', data.error);
      }
    } catch (error) {
      console.error('Error al marcar sincronización:', error);
    }
  }

  /**
   * Obtener estadísticas de sincronización
   */
  async obtenerEstadisticas() {
    try {
      const url = new URL(SYNC_CONFIG.API_BASE_URL);
      url.searchParams.append('action', 'sync_stats');

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: SYNC_CONFIG.REQUEST_TIMEOUT,
      });

      const data = await response.json();
      console.log('[SYNC STATS]', data.stats);
      return data.stats || {};
    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
      return null;
    }
  }

  /**
   * Limpiar cambios antiguos
   */
  async limpiarCambiosAntiguos(dias = SYNC_CONFIG.CLEANUP_DAYS) {
    try {
      const url = new URL(SYNC_CONFIG.API_BASE_URL);
      url.searchParams.append('action', 'clean_old_sync');
      url.searchParams.append('dias', dias);

      const response = await fetch(url.toString(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: SYNC_CONFIG.REQUEST_TIMEOUT,
      });

      const data = await response.json();
      if (data.success) {
        console.log(`[CLEANUP] ${data.message}`);
      }
      return data;
    } catch (error) {
      console.error('Error al limpiar cambios:', error);
      return { success: false };
    }
  }

  /**
   * Manejar errores de sincronización
   */
  manejarErrorSync(error) {
    this.retryCount++;

    if (this.retryCount >= SYNC_CONFIG.MAX_RETRIES) {
      console.error('Máximo de reintentos alcanzado:', error);
      
      if (SYNC_CONFIG.onSyncError) {
        SYNC_CONFIG.onSyncError(error);
      }

      this.retryCount = 0;
    }
  }

  /**
   * Verificar estado online/offline
   */
  verificarConexion() {
    const esOnline = navigator.onLine;

    if (esOnline && !this.isOnline) {
      console.log('[CONEXIÓN] Volvimos a conectar');
      if (SYNC_CONFIG.onOnline) {
        SYNC_CONFIG.onOnline();
      }
    } else if (!esOnline && this.isOnline) {
      console.log('[CONEXIÓN] Desconectado');
      if (SYNC_CONFIG.onOffline) {
        SYNC_CONFIG.onOffline();
      }
    }

    this.isOnline = esOnline;
    return esOnline;
  }

  /**
   * Resetear sincronización (para debug)
   */
  resetearSync() {
    this.lastSync = '1970-01-01 00:00:00';
    this.retryCount = 0;
    localStorage.removeItem(SYNC_CONFIG.STORAGE_KEY_LAST_SYNC);
    console.log('[DEBUG] Sincronización reseteada');
  }
}

// Instancia singleton
const syncServiceInstance = new SyncService();
export default syncServiceInstance;
