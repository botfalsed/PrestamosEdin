import React from 'react';
import useRealtimeUpdates from '../hooks/useRealtimeUpdates';

/**
 * Componente que muestra el estado de conexión WebSocket
 * con información detallada y opciones de reconexión
 */
export const ConnectionStatus = ({ compact = false }) => {
  const { connectionStatus, connect, disconnect, isConnected } = useRealtimeUpdates();

  const getStatusColor = () => {
    if (connectionStatus.isConnected) return '#28a745'; // Verde
    if (connectionStatus.reconnectAttempts > 0) return '#ffc107'; // Amarillo
    return '#dc3545'; // Rojo
  };

  const getStatusText = () => {
    if (connectionStatus.isConnected) return 'Conectado';
    if (connectionStatus.reconnectAttempts > 0) return 'Reconectando...';
    return 'Desconectado';
  };

  const getStatusIcon = () => {
    if (connectionStatus.isConnected) return '✅';
    if (connectionStatus.reconnectAttempts > 0) return '🔄';
    return '❌';
  };

  if (compact) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '4px 8px',
        backgroundColor: connectionStatus.isConnected ? '#d4edda' : '#f8d7da',
        borderRadius: '4px',
        fontSize: '12px',
        fontWeight: 'bold'
      }}>
        <span>{getStatusIcon()}</span>
        <span style={{ color: getStatusColor() }}>
          {getStatusText()}
        </span>
        {connectionStatus.reconnectAttempts > 0 && (
          <span style={{ color: '#666', fontSize: '11px' }}>
            ({connectionStatus.reconnectAttempts}/10)
          </span>
        )}
      </div>
    );
  }

  return (
    <div style={{
      padding: '16px',
      backgroundColor: '#f8f9fa',
      borderRadius: '8px',
      border: '1px solid #dee2e6',
      marginBottom: '16px'
    }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '12px' 
      }}>
        <h3 style={{ 
          margin: 0, 
          fontSize: '14px', 
          fontWeight: 'bold', 
          color: '#333' 
        }}>
          Estado de Conexión WebSocket
        </h3>
        
        {!connectionStatus.isConnected && (
          <button
            onClick={connect}
            style={{
              padding: '6px 12px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 'bold'
            }}
          >
            🔄 Reconectar
          </button>
        )}
      </div>

      {/* Status Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: '12px'
      }}>
        {/* Estado Principal */}
        <div style={{
          padding: '12px',
          backgroundColor: 'white',
          borderRadius: '6px',
          border: '1px solid #e0e0e0'
        }}>
          <p style={{ 
            margin: '0 0 6px 0', 
            fontSize: '12px', 
            color: '#666', 
            fontWeight: 'bold' 
          }}>
            Estado
          </p>
          <p style={{ 
            margin: 0, 
            fontSize: '16px', 
            fontWeight: 'bold',
            color: getStatusColor()
          }}>
            {getStatusIcon()} {getStatusText()}
          </p>
        </div>

        {/* Socket ID */}
        {connectionStatus.socketId && (
          <div style={{
            padding: '12px',
            backgroundColor: 'white',
            borderRadius: '6px',
            border: '1px solid #e0e0e0'
          }}>
            <p style={{ 
              margin: '0 0 6px 0', 
              fontSize: '12px', 
              color: '#666', 
              fontWeight: 'bold' 
            }}>
              Socket ID
            </p>
            <p style={{ 
              margin: 0, 
              fontSize: '11px', 
              fontFamily: 'monospace',
              color: '#333',
              wordBreak: 'break-all'
            }}>
              {connectionStatus.socketId}
            </p>
          </div>
        )}

        {/* Intentos de Reconexión */}
        {connectionStatus.reconnectAttempts > 0 && (
          <div style={{
            padding: '12px',
            backgroundColor: 'white',
            borderRadius: '6px',
            border: '1px solid #e0e0e0'
          }}>
            <p style={{ 
              margin: '0 0 6px 0', 
              fontSize: '12px', 
              color: '#666', 
              fontWeight: 'bold' 
            }}>
              Reconexión
            </p>
            <p style={{ 
              margin: 0, 
              fontSize: '14px', 
              fontWeight: 'bold',
              color: '#ffc107'
            }}>
              {connectionStatus.reconnectAttempts}/10
            </p>
          </div>
        )}
      </div>

      {/* Mensaje de Error */}
      {!connectionStatus.isConnected && connectionStatus.reconnectAttempts >= 10 && (
        <div style={{
          marginTop: '12px',
          padding: '12px',
          backgroundColor: '#f8d7da',
          borderRadius: '6px',
          border: '1px solid #f5c6cb'
        }}>
          <p style={{ 
            margin: 0, 
            fontSize: '14px', 
            color: '#721c24',
            fontWeight: 'bold'
          }}>
            ❌ Máximo de intentos de reconexión alcanzado
          </p>
          <p style={{ 
            margin: '4px 0 0 0', 
            fontSize: '12px', 
            color: '#721c24'
          }}>
            Verifica que el servidor WebSocket esté funcionando en http://localhost:3001
          </p>
        </div>
      )}

      {/* Información de Ayuda */}
      {connectionStatus.isConnected && (
        <div style={{
          marginTop: '12px',
          padding: '12px',
          backgroundColor: '#d4edda',
          borderRadius: '6px',
          border: '1px solid #c3e6cb'
        }}>
          <p style={{ 
            margin: 0, 
            fontSize: '12px', 
            color: '#155724'
          }}>
            ✅ Conexión estable. Recibirás notificaciones en tiempo real.
          </p>
        </div>
      )}
    </div>
  );
};

export default ConnectionStatus;