import { useEffect, useRef } from 'react';
import { useSyncContext } from '../context/SyncProvider';

/**
 * Hook personalizado para sincronización automática de componentes del dashboard
 * @param {Array} tablas - Array de nombres de tablas a escuchar (ej: ['prestamos', 'pagos'])
 * @param {Function} onUpdate - Función callback que se ejecuta cuando hay cambios
 */
export const useSyncDashboard = (tablas = [], onUpdate = null) => {
  const { registerListener, unregisterListener } = useSyncContext();
  const callbackRef = useRef(onUpdate);
  const tablasRef = useRef(tablas);

  // Actualizar refs cuando cambien los parámetros
  callbackRef.current = onUpdate;
  tablasRef.current = tablas;

  useEffect(() => {
    if (!tablasRef.current.length || !callbackRef.current) return;

    // Función que maneja los cambios - ESTABLE
    const handleChanges = (cambios) => {
      console.log(`🔄 [useSyncDashboard] Cambios detectados:`, cambios);
      if (callbackRef.current) {
        callbackRef.current(cambios);
      }
    };

    // Registrar listeners para cada tabla
    tablasRef.current.forEach(tabla => {
      registerListener(tabla, handleChanges);
      console.log(`📡 [useSyncDashboard] Listener registrado para: ${tabla}`);
    });

    // Cleanup: desregistrar listeners al desmontar
    return () => {
      tablasRef.current.forEach(tabla => {
        unregisterListener(tabla, handleChanges);
        console.log(`🔌 [useSyncDashboard] Listener desregistrado para: ${tabla}`);
      });
    };
  }, []); // CRÍTICO: Sin dependencias para evitar re-registros
};

export default useSyncDashboard;