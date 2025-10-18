import { useEffect, useRef, useState, useCallback } from 'react';
import syncService from '../services/syncService';
import SYNC_CONFIG from '../config/syncConfig';

/**
 * Hook personalizado para sincronización en tiempo real
 * Maneja polling automático, cambios en tiempo real y notificaciones
 */
export const useSyncronizacion = (callbacks = {}) => {
  const [syncState, setSyncState] = useState({
    isLoading: false,
    isOnline: navigator.onLine,
    lastSync: syncService.getLastSyncTime(),
    cambiosDetectados: 0,
    estadisticas: null,
    error: null,
  });

  const intervalRef = useRef(null);
  const onlineListenerRef = useRef(null);

  /**
   * Ejecutar sincronización
   */
  const sincronizar = useCallback(async () => {
    setSyncState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const resultado = await syncService.obtenerCambios();
      
      setSyncState(prev => ({
        ...prev,
        lastSync: syncService.getLastSyncTime(),
        cambiosDetectados: resultado.total || 0,
        isLoading: false,
      }));

      // Callback personalizado
      if (callbacks.onSyncSuccess) {
        callbacks.onSyncSuccess(resultado);
      }
    } catch (error) {
      setSyncState(prev => ({
        ...prev,
        error: error.message,
        isLoading: false,
      }));

      if (callbacks.onSyncError) {
        callbacks.onSyncError(error);
      }
    }
  }, [callbacks]);

  /**
   * Obtener estadísticas
   */
  const obtenerEstadisticas = useCallback(async () => {
    try {
      const stats = await syncService.obtenerEstadisticas();
      setSyncState(prev => ({ ...prev, estadisticas: stats }));
      return stats;
    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
      return null;
    }
  }, []);

  /**
   * Limpiar cambios antiguos
   */
  const limpiarAntiguos = useCallback(async (dias) => {
    try {
      const resultado = await syncService.limpiarCambiosAntiguos(dias);
      return resultado;
    } catch (error) {
      console.error('Error al limpiar:', error);
      return { success: false };
    }
  }, []);

  /**
   * Resetear sincronización (debug)
   */
  const resetear = useCallback(() => {
    syncService.resetearSync();
    setSyncState(prev => ({
      ...prev,
      lastSync: syncService.getLastSyncTime(),
      cambiosDetectados: 0,
      error: null,
    }));
  }, []);

  /**
   * Manejar cambios detectados
   */
  useEffect(() => {
    SYNC_CONFIG.onChangeDetected = (cambio) => {
      setSyncState(prev => ({
        ...prev,
        cambiosDetectados: prev.cambiosDetectados + 1,
      }));

      if (callbacks.onCambioDetectado) {
        callbacks.onCambioDetectado(cambio);
      }
    };

    return () => {
      SYNC_CONFIG.onChangeDetected = null;
    };
  }, [callbacks]);

  /**
   * Manejar online/offline
   */
  useEffect(() => {
    const handleOnline = () => {
      setSyncState(prev => ({ ...prev, isOnline: true }));
      if (callbacks.onOnline) callbacks.onOnline();
      sincronizar(); // Sincronizar apenas se conecte
    };

    const handleOffline = () => {
      setSyncState(prev => ({ ...prev, isOnline: false }));
      if (callbacks.onOffline) callbacks.onOffline();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [sincronizar, callbacks]);

  /**
   * Iniciar polling automático
   */
  useEffect(() => {
    if (!syncState.isOnline) return;

    // Sincronizar al montar
    sincronizar();

    // Iniciar polling
    intervalRef.current = setInterval(() => {
      syncService.verificarConexion();
      if (navigator.onLine) {
        sincronizar();
      }
    }, SYNC_CONFIG.SYNC_INTERVAL);

    // Limpiar cambios antiguos cada hora
    const cleanupInterval = setInterval(() => {
      limpiarAntiguos();
    }, 3600000); // 1 hora

    return () => {
      clearInterval(intervalRef.current);
      clearInterval(cleanupInterval);
    };
  }, [sincronizar, limpiarAntiguos, syncState.isOnline]);

  /**
   * Detener sincronización
   */
  const detener = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  /**
   * Reanudar sincronización
   */
  const reanudar = useCallback(() => {
    if (!intervalRef.current) {
      intervalRef.current = setInterval(() => {
        if (navigator.onLine) {
          sincronizar();
        }
      }, SYNC_CONFIG.SYNC_INTERVAL);
    }
  }, [sincronizar]);

  return {
    // Estado
    isLoading: syncState.isLoading,
    isOnline: syncState.isOnline,
    lastSync: syncState.lastSync,
    cambiosDetectados: syncState.cambiosDetectados,
    estadisticas: syncState.estadisticas,
    error: syncState.error,

    // Métodos
    sincronizar,
    obtenerEstadisticas,
    limpiarAntiguos,
    detener,
    reanudar,
    resetear,
  };
};
