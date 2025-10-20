import { useEffect, useState, useCallback, useRef } from 'react';
import syncService from '../services/syncService';

export const useSyncDashboard = (onCambiosRecibidos = null) => {
  console.log('🔧 useSyncDashboard MOUNTED');

  const [estado, setEstado] = useState({
    sincronizando: false,
    ultimaSincronizacion: syncService.getLastSyncTime(),
    cambiosRecibidos: [],
    error: null,
    estadisticas: {
      cambios_pendientes: 0,
      ultimo_cambio: null
    }
  });

  const intervalRef = useRef(null);
  const montadoRef = useRef(false);
  const callbackRef = useRef(onCambiosRecibidos);

  // Actualizar callback ref
  callbackRef.current = onCambiosRecibidos;

  /**
   * Ejecutar sincronización manualmente
   */
  const sincronizar = useCallback(async () => {
    console.log('📡 Iniciando sincronización...');
    setEstado(prev => ({ ...prev, sincronizando: true, error: null }));

    try {
      const resultado = await syncService.obtenerCambios();
      console.log('SYNC RESULTADO:', resultado);
      console.log('CAMBIOS RECIBIDOS:', resultado.cambios);
      
      setEstado(prev => ({
        ...prev,
        sincronizando: false,
        ultimaSincronizacion: syncService.getLastSyncTime(),
        cambiosRecibidos: resultado.cambios || [],
      }));

      // Callback si hay cambios
      if (resultado.cambios && resultado.cambios.length > 0 && callbackRef.current) {
        console.log('✓ Llamando callback con', resultado.cambios.length, 'cambios');
        callbackRef.current(resultado.cambios);
      }

      return resultado;
    } catch (error) {
      console.error('❌ Error en sincronización:', error);
      setEstado(prev => ({
        ...prev,
        sincronizando: false,
        error: error.message
      }));
    }
  }, []); // Sin dependencias para estabilidad

  /**
   * Obtener estadísticas
   */
  const obtenerEstadisticas = useCallback(async () => {
    try {
      const stats = await syncService.obtenerEstadisticas();
      setEstado(prev => ({
        ...prev,
        estadisticas: stats || { cambios_pendientes: 0, ultimo_cambio: null }
      }));
      return stats;
    } catch (error) {
      console.error('Error obteniendo estadísticas:', error);
    }
  }, []);

  /**
   * Efecto para inicializar polling automático
   * SIN dependencias para evitar loop infinito
   */
  useEffect(() => {
    if (montadoRef.current) return; // Evitar ejecutar 2 veces en desarrollo
    montadoRef.current = true;

    console.log('⚙️ Iniciando polling automático cada 5s');

    // Sincronizar al montar
    sincronizar();
    obtenerEstadisticas();

    // Polling cada 5 segundos
    intervalRef.current = setInterval(() => {
      console.log('🔄 Tick de sincronización...');
      sincronizar();
      obtenerEstadisticas();
    }, 5000);

    return () => {
      console.log('🛑 Limpiando interval');
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []); // CRÍTICO: Sin dependencias para evitar re-ejecuciones

  return {
    sincronizando: estado.sincronizando,
    ultimaSincronizacion: estado.ultimaSincronizacion,
    cambiosRecibidos: estado.cambiosRecibidos,
    error: estado.error,
    estadisticas: estado.estadisticas,
    sincronizar,
    obtenerEstadisticas
  };
};
