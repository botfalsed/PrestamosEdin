// dashboard/src/components/SyncIndicator.js
import React from 'react';
import { useSyncContext } from '../context/SyncProvider';
import '../assets/css/SyncIndicator.css';

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
    <div className={`sync-indicator ${syncStatus.isActive ? 'active' : 'inactive'}`}>
      <div className="sync-status">
        <div className={`sync-dot ${syncStatus.isActive ? 'pulse' : ''}`} />
        <span className="sync-text">
          {syncStatus.isActive ? '🔄 Sincronización Activa' : '⏸️ Sincronización Pausada'}
        </span>
      </div>

      {syncStatus.lastSync && (
        <div className="sync-time">
          <small>Última sync: {formatTime(syncStatus.lastSync)}</small>
        </div>
      )}

      {syncStatus.error && (
        <div className="sync-error">
          <small>❌ Error: {syncStatus.error}</small>
        </div>
      )}

      <button 
        className="sync-force-btn"
        onClick={handleForceSync}
        title="Forzar sincronización"
      >
        ⚡ Sincronizar
      </button>
    </div>
  );
};

export default SyncIndicator;
