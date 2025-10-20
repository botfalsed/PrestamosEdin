// dashboard/src/components/SyncIndicator.js
import React from 'react';
import { useSyncContext } from '../context/SyncProvider';

const SyncIndicator = () => {
  const { syncStatus, forceFullSync } = useSyncContext();

  const formatTime = (timestamp) => {
    if (!timestamp) return 'Nunca';
    const date = new Date(timestamp);
    return date.toLocaleTimeString('es-PE', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const handleForceSync = async () => {
    console.log('⚡ Forzando sincronización...');
    await forceFullSync();
  };

  return (
    <div className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-300 shadow-soft ${
      syncStatus.isActive 
        ? 'bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-500' 
        : 'bg-gradient-to-br from-orange-50 to-orange-100 border-2 border-orange-500'
    } md:flex-row flex-col md:items-center items-start md:gap-3 gap-2 md:p-4 p-3`}>
      <div className="flex items-center gap-2">
        <div className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
          syncStatus.isActive 
            ? 'bg-green-500 animate-pulse' 
            : 'bg-orange-500'
        }`} />
        <span className="text-sm font-semibold text-gray-800 whitespace-nowrap md:text-sm text-xs">
          {syncStatus.isActive ? '🔄 Sincronización Activa' : '⏸️ Sincronización Pausada'}
        </span>
      </div>

      {syncStatus.lastSync && (
        <div className="text-xs text-gray-600 opacity-80">
          <small>Última sync: {formatTime(syncStatus.lastSync)}</small>
        </div>
      )}

      {syncStatus.error && (
        <div className="text-xs text-red-600 font-medium">
          <small>❌ Error: {syncStatus.error}</small>
        </div>
      )}

      <button 
        className="bg-blue-500 hover:bg-blue-600 text-white border-none rounded-lg px-3 py-1.5 text-xs font-semibold cursor-pointer transition-all duration-200 whitespace-nowrap hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-500/30 active:translate-y-0 md:w-auto w-full md:text-center"
        onClick={handleForceSync}
        title="Forzar sincronización"
      >
        ⚡ Sincronizar
      </button>
    </div>
  );
};

export default SyncIndicator;
