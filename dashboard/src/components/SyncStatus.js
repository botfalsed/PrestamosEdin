import React from 'react';
import {useSyncDashboard} from '../hook/useSyncDashboard';

/**
 * Componente que muestra el estado de sincronización
 * Integrado con tu syncService
 */
export const SyncStatus = ({ onCambios = null }) => {
  const {
    sincronizando,
    ultimaSincronizacion,
    cambiosRecibidos,
    error,
    estadisticas,
    sincronizar,
    obtenerEstadisticas
  } = useSyncDashboard(onCambios);

  const formatearFecha = (fecha) => {
    if (!fecha || fecha === '1970-01-01 00:00:00') {
      return 'Nunca';
    }
    return new Date(fecha).toLocaleString('es-ES');
  };

  const formatearHoraAtras = (fecha) => {
    if (!fecha || fecha === '1970-01-01 00:00:00') {
      return 'Nunca';
    }
    
    const ahora = new Date();
    const sync = new Date(fecha);
    const diferencia = Math.floor((ahora - sync) / 1000); // segundos

    if (diferencia < 5) return 'Ahora mismo';
    if (diferencia < 60) return `Hace ${diferencia}s`;
    if (diferencia < 3600) return `Hace ${Math.floor(diferencia / 60)}m`;
    return `Hace ${Math.floor(diferencia / 3600)}h`;
  };

  return (
    <div className="sync-status-container" style={{
      padding: '16px',
      backgroundColor: '#f8f9fa',
      borderRadius: '8px',
      border: '1px solid #dee2e6',
      marginBottom: '16px'
    }}>
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 'bold', color: '#333' }}>
          Estado de Sincronización
        </h3>
        <button
          onClick={sincronizar}
          disabled={sincronizando}
          style={{
            padding: '6px 12px',
            backgroundColor: sincronizando ? '#ccc' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: sincronizando ? 'not-allowed' : 'pointer',
            fontSize: '12px',
            fontWeight: 'bold'
          }}
        >
          {sincronizando ? '⟳ Sincronizando...' : '↻ Sincronizar'}
        </button>
      </div>

      {/* GRID DE INFO */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '12px'
      }}>
        {/* Estado */}
        <div style={{
          padding: '12px',
          backgroundColor: 'white',
          borderRadius: '6px',
          border: '1px solid #e0e0e0'
        }}>
          <p style={{ margin: '0 0 6px 0', fontSize: '12px', color: '#666', fontWeight: 'bold' }}>
            Estado
          </p>
          <p style={{ margin: 0, fontSize: '16px', fontWeight: 'bold' }}>
            {sincronizando ? (
              <span style={{ color: '#ffc107' }}>⟳ Sincronizando...</span>
            ) : (
              <span style={{ color: '#28a745' }}>✓ Activo</span>
            )}
          </p>
        </div>

        {/* Última sincronización */}
        <div style={{
          padding: '12px',
          backgroundColor: 'white',
          borderRadius: '6px',
          border: '1px solid #e0e0e0'
        }}>
          <p style={{ margin: '0 0 6px 0', fontSize: '12px', color: '#666', fontWeight: 'bold' }}>
            Última Sincronización
          </p>
          <p style={{ margin: 0, fontSize: '14px', fontFamily: 'monospace' }}>
            {formatearHoraAtras(ultimaSincronizacion)}
          </p>
          <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: '#999' }}>
            {formatearFecha(ultimaSincronizacion)}
          </p>
        </div>

        {/* Cambios pendientes */}
        <div style={{
          padding: '12px',
          backgroundColor: 'white',
          borderRadius: '6px',
          border: '1px solid #e0e0e0'
        }}>
          <p style={{ margin: '0 0 6px 0', fontSize: '12px', color: '#666', fontWeight: 'bold' }}>
            Cambios Pendientes
          </p>
          <p style={{ margin: 0, fontSize: '16px', fontWeight: 'bold', color: '#ff6b6b' }}>
            {estadisticas.cambios_pendientes || 0}
          </p>
        </div>

        {/* Cambios recibidos */}
        <div style={{
          padding: '12px',
          backgroundColor: 'white',
          borderRadius: '6px',
          border: '1px solid #e0e0e0'
        }}>
          <p style={{ margin: '0 0 6px 0', fontSize: '12px', color: '#666', fontWeight: 'bold' }}>
            Cambios Recibidos
          </p>
          <p style={{ margin: 0, fontSize: '16px', fontWeight: 'bold', color: '#4a90e2' }}>
            {cambiosRecibidos.length}
          </p>
        </div>
      </div>

      {/* ERRORES */}
      {error && (
        <div style={{
          marginTop: '12px',
          padding: '12px',
          backgroundColor: '#f8d7da',
          color: '#721c24',
          borderRadius: '4px',
          border: '1px solid #f5c6cb',
          fontSize: '12px'
        }}>
          ⚠️ Error: {error}
        </div>
      )}

      {/* ÚLTIMOS CAMBIOS */}
      {cambiosRecibidos.length > 0 && (
        <div style={{ marginTop: '12px' }}>
          <p style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#666', fontWeight: 'bold' }}>
            Últimos Cambios
          </p>
          <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
            {cambiosRecibidos.slice(-5).reverse().map((cambio, idx) => (
              <div
                key={idx}
                style={{
                  padding: '8px',
                  backgroundColor: 'white',
                  borderRadius: '4px',
                  border: '1px solid #e0e0e0',
                  marginBottom: '6px',
                  fontSize: '11px'
                }}
              >
                <span style={{
                  display: 'inline-block',
                  backgroundColor: '#007bff',
                  color: 'white',
                  padding: '2px 6px',
                  borderRadius: '3px',
                  fontWeight: 'bold',
                  marginRight: '8px'
                }}>
                  {cambio.tabla.toUpperCase()}
                </span>
                <span style={{ fontWeight: 'bold', marginRight: '8px' }}>
                  {cambio.tipo_accion}
                </span>
                <span style={{ color: '#666' }}>
                  ID: {cambio.id_registro}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
