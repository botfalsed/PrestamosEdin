/**
 * Componente para mostrar notificaciones en tiempo real en PrestamosMobile
 * Muestra notificaciones push y estado de conexión Socket.io
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

/**
 * Componente individual de notificación
 */
const NotificationCard = ({ notification, onRemove, animatedValue }) => {
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'pago_registrado':
        return 'cash-outline';
      case 'prestamo_creado':
        return 'document-text-outline';
      case 'prestamo_actualizado':
        return 'refresh-outline';
      default:
        return 'notifications-outline';
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'pago_registrado':
        return '#4CAF50'; // Verde
      case 'prestamo_creado':
        return '#2196F3'; // Azul
      case 'prestamo_actualizado':
        return '#FF9800'; // Naranja
      default:
        return '#9C27B0'; // Púrpura
    }
  };

  const getNotificationTitle = (type) => {
    switch (type) {
      case 'pago_registrado':
        return 'Pago Registrado';
      case 'prestamo_creado':
        return 'Nuevo Préstamo';
      case 'prestamo_actualizado':
        return 'Préstamo Actualizado';
      default:
        return 'Notificación';
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const color = getNotificationColor(notification.type);

  return (
    <Animated.View
      style={[
        styles.notificationCard,
        {
          borderLeftColor: color,
          transform: [
            {
              translateX: animatedValue.interpolate({
                inputRange: [0, 1],
                outputRange: [width, 0]
              })
            }
          ],
          opacity: animatedValue
        }
      ]}
    >
      <View style={styles.notificationContent}>
        <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
          <Ionicons
            name={getNotificationIcon(notification.type)}
            size={20}
            color={color}
          />
        </View>
        
        <View style={styles.textContainer}>
          <Text style={styles.notificationTitle}>
            {getNotificationTitle(notification.type)}
          </Text>
          <Text style={styles.notificationMessage} numberOfLines={2}>
            {notification.message || 'Actualización recibida'}
          </Text>
          <Text style={styles.notificationTime}>
            {formatTime(notification.timestamp)}
          </Text>
        </View>
        
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => onRemove(notification.id)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="close" size={18} color="#666" />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

/**
 * Componente principal de notificaciones en tiempo real
 */
const RealtimeNotifications = ({
  notifications = [],
  connectionStatus = { isConnected: false },
  onRemoveNotification,
  onClearAll,
  showConnectionStatus = true,
  style
}) => {
  const [animatedValues] = React.useState(
    notifications.reduce((acc, notification) => {
      acc[notification.id] = new Animated.Value(0);
      return acc;
    }, {})
  );

  // Animar entrada de nuevas notificaciones
  React.useEffect(() => {
    notifications.forEach(notification => {
      if (!animatedValues[notification.id]) {
        animatedValues[notification.id] = new Animated.Value(0);
      }
      
      Animated.timing(animatedValues[notification.id], {
        toValue: 1,
        duration: 300,
        useNativeDriver: true
      }).start();
    });
  }, [notifications]);

  const handleRemoveNotification = (notificationId) => {
    if (animatedValues[notificationId]) {
      Animated.timing(animatedValues[notificationId], {
        toValue: 0,
        duration: 200,
        useNativeDriver: true
      }).start(() => {
        delete animatedValues[notificationId];
        onRemoveNotification?.(notificationId);
      });
    } else {
      onRemoveNotification?.(notificationId);
    }
  };

  if (!showConnectionStatus && notifications.length === 0) {
    return null;
  }

  return (
    <View style={[styles.container, style]}>
      {/* Estado de conexión */}
      {showConnectionStatus && (
        <View style={styles.connectionStatus}>
          <View style={styles.connectionIndicator}>
            <View
              style={[
                styles.connectionDot,
                {
                  backgroundColor: connectionStatus.isConnected ? '#4CAF50' : '#F44336'
                }
              ]}
            />
            <Text style={styles.connectionText}>
              {connectionStatus.isConnected ? 'Conectado' : 'Desconectado'}
            </Text>
            {connectionStatus.reconnectAttempts > 0 && (
              <Text style={styles.reconnectText}>
                (Intentos: {connectionStatus.reconnectAttempts})
              </Text>
            )}
          </View>
          
          {notifications.length > 1 && (
            <TouchableOpacity
              style={styles.clearAllButton}
              onPress={onClearAll}
            >
              <Text style={styles.clearAllText}>Limpiar</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Lista de notificaciones */}
      <View style={styles.notificationsList}>
        {notifications.map(notification => (
          <NotificationCard
            key={notification.id}
            notification={notification}
            onRemove={handleRemoveNotification}
            animatedValue={animatedValues[notification.id] || new Animated.Value(1)}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 30,
    right: 10,
    left: 10,
    zIndex: 1000,
    maxHeight: '70%'
  },
  
  connectionStatus: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  
  connectionIndicator: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  
  connectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8
  },
  
  connectionText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#333'
  },
  
  reconnectText: {
    fontSize: 10,
    color: '#666',
    marginLeft: 4
  },
  
  clearAllButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#f0f0f0',
    borderRadius: 4
  },
  
  clearAllText: {
    fontSize: 11,
    color: '#666',
    fontWeight: '500'
  },
  
  notificationsList: {
    gap: 8
  },
  
  notificationCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
    marginBottom: 4
  },
  
  notificationContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12
  },
  
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12
  },
  
  textContainer: {
    flex: 1,
    marginRight: 8
  },
  
  notificationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2
  },
  
  notificationMessage: {
    fontSize: 12,
    color: '#666',
    lineHeight: 16,
    marginBottom: 4
  },
  
  notificationTime: {
    fontSize: 10,
    color: '#999'
  },
  
  closeButton: {
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center'
  }
});

export default RealtimeNotifications;