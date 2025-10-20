import React from 'react';

const RealtimeNotifications = ({ 
  notifications = [], 
  onRemove = () => {},
  onClearAll = () => {},
  connectionStatus = { isConnected: false }
}) => {
  
  if (notifications.length === 0) return null;

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'success': return '✅';
      case 'warning': return '⚠️';
      case 'error': return '❌';
      case 'info':
      default: return 'ℹ️';
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'success': return 'bg-green-50 border-green-200 text-green-800';
      case 'warning': return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'error': return 'bg-red-50 border-red-200 text-red-800';
      case 'info':
      default: return 'bg-blue-50 border-blue-200 text-blue-800';
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      {/* Indicador de conexión */}
      <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium ${
        connectionStatus.isConnected 
          ? 'bg-green-100 text-green-700 border border-green-200' 
          : 'bg-red-100 text-red-700 border border-red-200'
      }`}>
        <div className={`w-2 h-2 rounded-full ${
          connectionStatus.isConnected ? 'bg-green-500' : 'bg-red-500'
        }`} />
        {connectionStatus.isConnected ? 'Tiempo Real Conectado' : 'Desconectado'}
      </div>

      {/* Botón para limpiar todas las notificaciones */}
      {notifications.length > 1 && (
        <button
          onClick={onClearAll}
          className="w-full text-xs text-gray-600 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded-lg transition-colors"
        >
          Limpiar todas ({notifications.length})
        </button>
      )}

      {/* Lista de notificaciones */}
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`relative p-4 rounded-lg border shadow-lg animate-slide-in-right ${getNotificationColor(notification.type)}`}
        >
          <button
            onClick={() => onRemove(notification.id)}
            className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 text-lg leading-none"
            title="Cerrar notificación"
          >
            ×
          </button>
          
          <div className="flex items-start gap-3 pr-6">
            <span className="text-lg flex-shrink-0">
              {getNotificationIcon(notification.type)}
            </span>
            
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-sm mb-1 truncate">
                {notification.title}
              </h4>
              <p className="text-xs opacity-90 mb-2 line-clamp-2">
                {notification.message}
              </p>
              <div className="text-xs opacity-75">
                {formatTime(notification.timestamp)}
              </div>
            </div>
          </div>
          
          {/* Barra de progreso para auto-desaparición */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/10 rounded-b-lg overflow-hidden">
            <div 
              className="h-full bg-current opacity-30 animate-shrink-width"
              style={{ animationDuration: '5s' }}
            />
          </div>
        </div>
      ))}

      <style jsx>{`
        @keyframes slide-in-right {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        @keyframes shrink-width {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }
        
        .animate-slide-in-right {
          animation: slide-in-right 0.3s ease-out;
        }
        
        .animate-shrink-width {
          animation: shrink-width linear;
        }
        
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
};

export default RealtimeNotifications;