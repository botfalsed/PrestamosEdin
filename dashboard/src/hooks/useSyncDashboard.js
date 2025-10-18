import { useEffect } from 'react';
import { useSyncContext } from '../context/SyncProvider';

/**
 * Hook personalizado para sincronización automática de componentes del dashboard
 * @param {Array} tablas - Array de nombres de tablas a escuchar (ej: ['prestamos', 'pagos'])
 * @param {Function} onUpdate - Función callback que se ejecuta cuando hay cambios
 */
export const useSyncDashboard = (tablas = [], onUpdate = null) => {
  const { registerListener, unregisterListener } = useSyncContext();

  useEffect(() => {
    if (!tablas.length || !onUpdate) return;

    // Función que maneja los cambios
    const handleChanges = (cambios) => {
      console.log(`🔄 [useSyncDashboard] Cambios detectados:`, cambios);
      onUpdate(cambios);
    };

    // Registrar listeners para cada tabla
    tablas.forEach(tabla => {
      registerListener(tabla, handleChanges);
      console.log(`📡 [useSyncDashboard] Listener registrado para: ${tabla}`);
    });

    // Cleanup: desregistrar listeners al desmontar
    return () => {
      tablas.forEach(tabla => {
        unregisterListener(tabla, handleChanges);
        console.log(`🔌 [useSyncDashboard] Listener desregistrado para: ${tabla}`);
      });
    };
  }, [tablas, onUpdate, registerListener, unregisterListener]);
};

export default useSyncDashboard;