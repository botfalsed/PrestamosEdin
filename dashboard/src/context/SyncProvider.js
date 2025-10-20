// dashboard/src/context/SyncProvider.js
import React, { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { useNotification } from './NotificationProvider';

const API_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080/api_postgres.php';

const SyncContext = createContext();

export const useSyncContext = () => {
  const context = useContext(SyncContext);
  if (!context) {
    throw new Error('useSyncContext debe ser usado dentro de SyncProvider');
  }
  return context;
};

export const SyncProvider = ({ children }) => {
  const notification = useNotification();
  
  const [syncStatus, setSyncStatus] = useState({
    isActive: false,
    lastSync: null,
    pendingChanges: 0,
    error: null
  });

  const [listeners, setListeners] = useState({
    pagos: [],
    prestamos: [],
    prestatarios: []
  });

  const [syncInterval, setSyncInterval] = useState(null);

  // Obtener última sincronización del localStorage
  const getLastSyncTime = () => {
    return localStorage.getItem('lastSync') || '1970-01-01 00:00:00';
  };

  // Guardar timestamp de última sincronización
  const setLastSyncTime = (timestamp) => {
    localStorage.setItem('lastSync', timestamp);
    setSyncStatus(prev => ({ ...prev, lastSync: timestamp }));
  };

  // Sincronizar cambios con el servidor
  const sync = async () => {
    try {
      const lastSync = getLastSyncTime();
      console.log('🔄 [DASHBOARD] Sincronizando desde:', lastSync);

      const response = await axios.get(`${API_URL}?action=sync`, {
        params: { last_sync: lastSync }
      });

      if (response.data.success) {
        const { cambios, timestamp_actual } = response.data;

        if (cambios.length > 0) {
          console.log(`✅ [DASHBOARD] ${cambios.length} cambios recibidos`);

          // Procesar cambios por tabla
          procesarCambios(cambios);

          // Actualizar timestamp
          setLastSyncTime(timestamp_actual);

          // Marcar como sincronizados
          const ids = cambios.map(c => c.id_cambio);
          await marcarComoSincronizados(ids);

          setSyncStatus(prev => ({ 
            ...prev, 
            pendingChanges: 0,
            error: null 
          }));
        } else {
          console.log('✓ [DASHBOARD] Sin cambios nuevos');
        }

        return { success: true, cambios };
      }
    } catch (error) {
      console.error('❌ [DASHBOARD] Error sincronizando:', error.message);
      setSyncStatus(prev => ({ 
        ...prev, 
        error: error.message 
      }));
      return { success: false, error };
    }
  };

  // Procesar cambios por tabla
  const procesarCambios = (cambios) => {
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
      console.log(`📊 [DASHBOARD] Procesando ${cambiosTabla.length} cambios en: ${tabla}`);
      notifyListeners(tabla, cambiosTabla);
      
      // Mostrar notificaciones push para pagos
      if (tabla === 'pagos') {
        cambiosTabla.forEach(cambio => {
          try {
            const datos = JSON.parse(cambio.datos_nuevos || '{}');
            notification.showPaymentNotification({
              monto: datos.monto,
              prestatario: datos.prestatario_nombre || 'Cliente',
              fecha: datos.fecha_pago
            });
          } catch (error) {
            // Si no se pueden parsear los datos, mostrar notificación genérica
            notification.showPaymentNotification({
              monto: 'N/A',
              prestatario: 'Cliente'
            });
          }
        });
      }
      
      // Mostrar notificación de sincronización general si hay muchos cambios
      if (cambios.length > 3) {
        notification.showSyncNotification({
          cambios: cambios.length,
          timestamp: new Date().toISOString()
        });
      }
    });
  };

  // Marcar cambios como sincronizados
  const marcarComoSincronizados = async (ids) => {
    try {
      await axios.post(`${API_URL}?action=mark_synced`, { ids });
      console.log('✓ [DASHBOARD] Cambios marcados como sincronizados');
    } catch (error) {
      console.error('Error marcando sincronizados:', error);
    }
  };

  // Notificar a todos los listeners de una tabla
  const notifyListeners = (tabla, cambios) => {
    if (listeners[tabla]) {
      listeners[tabla].forEach(callback => {
        callback(cambios);
      });
    }
  };

  // Registrar listener para una tabla
  const registerListener = (tabla, callback) => {
    setListeners(prev => ({
      ...prev,
      [tabla]: [...(prev[tabla] || []), callback]
    }));
    console.log(`📡 [DASHBOARD] Listener registrado para: ${tabla}`);
  };

  // Remover listener
  const unregisterListener = (tabla, callback) => {
    setListeners(prev => ({
      ...prev,
      [tabla]: (prev[tabla] || []).filter(cb => cb !== callback)
    }));
  };

  // Iniciar sincronización
  const startSync = (intervalSeconds = 5) => {
    if (syncInterval) {
      console.log('⏸️ [DASHBOARD] Sincronización ya está activa');
      return;
    }

    console.log(`🔄 [DASHBOARD] Iniciando sincronización cada ${intervalSeconds} segundos`);
    
    // Primera sincronización inmediata
    sync();

    // Configurar intervalo
    const interval = setInterval(() => {
      sync();
    }, intervalSeconds * 1000);

    setSyncInterval(interval);
    setSyncStatus(prev => ({ ...prev, isActive: true }));
  };

  // Detener sincronización
  const stopSync = () => {
    if (syncInterval) {
      clearInterval(syncInterval);
      setSyncInterval(null);
      setSyncStatus(prev => ({ ...prev, isActive: false }));
      console.log('⏹️ [DASHBOARD] Sincronización detenida');
    }
  };

  // Forzar sincronización completa
  const forceFullSync = async () => {
    console.log('🔄 [DASHBOARD] Forzando sincronización completa...');
    setLastSyncTime('1970-01-01 00:00:00');
    return await sync();
  };

  // Obtener estadísticas
  const getStats = async () => {
    try {
      const response = await axios.get(`${API_URL}?action=sync_stats`);
      return response.data;
    } catch (error) {
      console.error('Error obteniendo stats:', error);
      return null;
    }
  };

  // Auto-iniciar sincronización al montar
  useEffect(() => {
    const timer = setTimeout(() => {
      startSync(5); // Sincronizar cada 5 segundos
    }, 1000); // Esperar 1 segundo antes de iniciar

    // Cleanup al desmontar
    return () => {
      clearTimeout(timer);
      stopSync();
    };
  }, []); // CRÍTICO: Sin dependencias para evitar re-ejecuciones

  const value = {
    syncStatus,
    registerListener,
    unregisterListener,
    sync,
    startSync,
    stopSync,
    forceFullSync,
    getStats
  };

  return (
    <SyncContext.Provider value={value}>
      {children}
    </SyncContext.Provider>
  );
};

export default SyncProvider;
