import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate, useLocation } from 'react-router-dom';
import { NavigationProvider } from './context/NavigationContext';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Inicio from './components/inicio';
import RegistrarPrestamo from './components/RegistrarPrestamos';
import ListaPrestamos from './components/ListaPrestamos';
import Prestatarios from './components/prestatarios';
import GestionPrestamos from './components/GestionarPrestamos';
import Archivados from './components/archivados';
import ImportarPrestatarios from './components/ImportarPrestatarios';
import ExportarPrestatarios from './components/ExportarPrestatarios';
import Login from './components/Login';
import Configuracion from './components/Configuracion';
import { SyncProvider } from './context/SyncProvider';
import { NotificationProvider } from './context/NotificationProvider';
import RealtimeNotifications from './components/RealtimeNotifications';
import useRealtimeUpdates from './hooks/useRealtimeUpdates';
import axios from 'axios';
import { 
  calcularAlertasVencimientos, 
  obtenerTotalAlertas, 
  filtrarPrestamosActivos 
} from './utils/alertas';

const HeaderWithData = ({ alertasCount, onAlertasClick }) => {
  const location = useLocation();
  
  const getSectionName = () => {
    const path = location.pathname;
    const currentSection = path.replace('/', '') || 'inicio';
    return currentSection;
  };

  return (
    <Header 
      section={getSectionName()}
      userName="Administrador"
      alertasCount={alertasCount}
      onAlertasClick={onAlertasClick}
    />
  );
};

const Logout = () => {
  useEffect(() => {
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('user');
    window.location.href = '/login';
  }, []);

  return null;
};

const AppRoutes = ({ isAuthenticated, globalAlertas, actualizarAlertasGlobales, manejarClickAlertas, onAuthSuccess }) => {
  return (
    <Routes>
      <Route 
        path="/login" 
        element={
          isAuthenticated ? <Navigate to="/inicio" replace /> : <Login onLoginSuccess={onAuthSuccess} />
        }
      />
      <Route 
        path="/inicio" 
        element={
          isAuthenticated ? 
          <Inicio 
            onAlertasChange={actualizarAlertasGlobales}
          /> : 
          <Navigate to="/login" replace />
        } 
      />
      <Route 
        path="/registrar-prestamo" 
        element={isAuthenticated ? <RegistrarPrestamo /> : <Navigate to="/login" replace />} 
      />
      <Route 
        path="/lista-prestamos" 
        element={
          isAuthenticated ? 
          <ListaPrestamos 
            onAlertasChange={actualizarAlertasGlobales}
          /> : 
          <Navigate to="/login" replace />
        } 
      />
      <Route 
        path="/gestion-prestamos" 
        element={isAuthenticated ? <GestionPrestamos /> : <Navigate to="/login" replace />} 
      />
      <Route 
        path="/importar-prestatarios" 
        element={isAuthenticated ? <ImportarPrestatarios /> : <Navigate to="/login" replace />} 
      />
      <Route 
        path="/exportar-prestatarios" 
        element={isAuthenticated ? <ExportarPrestatarios /> : <Navigate to="/login" replace />} 
      />
      <Route 
        path="/prestatarios" 
        element={isAuthenticated ? <Prestatarios /> : <Navigate to="/login" replace />} 
      />
      <Route 
        path="/archivados" 
        element={isAuthenticated ? <Archivados /> : <Navigate to="/login" replace />} 
      />
      <Route 
        path="/configuracion" 
        element={isAuthenticated ? <Configuracion /> : <Navigate to="/login" replace />} 
      />
      <Route 
        path="/logout" 
        element={<Logout />} 
      />
      <Route 
        path="/" 
        element={<Navigate to={isAuthenticated ? "/inicio" : "/login"} replace />} 
      />
      <Route 
        path="*" 
        element={<Navigate to={isAuthenticated ? "/inicio" : "/login"} replace />} 
      />
    </Routes>
  );
};

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [globalAlertas, setGlobalAlertas] = useState(0);
  const [loadingAlertas, setLoadingAlertas] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  // WebSocket states (legacy - mantener para compatibilidad)
  const wsRef = useRef(null);
  const [wsConnected, setWsConnected] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotification, setShowNotification] = useState(false);
  const [currentNotification, setCurrentNotification] = useState(null);

  // Nuevo sistema de tiempo real con Socket.io
  const {
    connectionStatus,
    notifications: realtimeNotifications,
    removeNotification,
    clearAllNotifications,
    isConnected: socketConnected
  } = useRealtimeUpdates({
    onPagoRegistrado: (data) => {
      console.log('💰 Pago registrado en tiempo real:', data);
      // Actualizar alertas globales
      setTimeout(() => {
        cargarAlertasGlobales();
      }, 1000);
    },
    onPrestamoCreado: (data) => {
      console.log('📋 Préstamo creado en tiempo real:', data);
      // Actualizar alertas globales
      setTimeout(() => {
        cargarAlertasGlobales();
      }, 1000);
    },
    onPrestamoActualizado: (data) => {
      console.log('📝 Préstamo actualizado en tiempo real:', data);
      // Actualizar alertas globales
      setTimeout(() => {
        cargarAlertasGlobales();
      }, 1000);
    },
    autoConnect: isAuthenticated
  });

  // Verificar autenticación al cargar
  useEffect(() => {
    const checkAuth = () => {
      const auth = localStorage.getItem('isAuthenticated');
      const userStr = localStorage.getItem('user');
      let user = null;
      try {
        user = userStr ? JSON.parse(userStr) : null;
      } catch (e) {
        user = null;
      }
      const esAutenticado = auth === 'true' && !!user && !!user.usuario;

      console.log('Auth check:', { auth, user, esAutenticado });
      setIsAuthenticated(esAutenticado);
      
      if (esAutenticado) {
        cargarAlertasGlobales();
        initWebSocket();
      }
    };

    checkAuth();
    setMounted(true);

    // Listener para detectar cambios en localStorage (cuando hace login desde otra pestaña)
    const handleStorageChange = () => {
      console.log('Storage cambió, verificando auth...');
      checkAuth();
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  const initWebSocket = () => {
    if (!isAuthenticated) return;
    
    try {
      wsRef.current = new WebSocket('ws://localhost:8081');
      
      wsRef.current.onopen = () => {
        console.log('Dashboard WebSocket conectado');
        setWsConnected(true);
        
        // Registrar como dashboard
        const registerMessage = {
          type: 'register_dashboard',
          clientType: 'dashboard',
          timestamp: new Date().toISOString()
        };
        wsRef.current.send(JSON.stringify(registerMessage));
      };
      
      wsRef.current.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          console.log('Mensaje WebSocket recibido:', message);
          
          if (message.type === 'payment_notification') {
            handlePaymentNotification(message.data);
          }
        } catch (error) {
          console.error('Error procesando mensaje WebSocket:', error);
        }
      };
      
      wsRef.current.onclose = () => {
        console.log('Dashboard WebSocket desconectado');
        setWsConnected(false);
        
        // Intentar reconectar después de 3 segundos si está autenticado
        if (isAuthenticated) {
          setTimeout(() => {
            if (!wsRef.current || wsRef.current.readyState === WebSocket.CLOSED) {
              initWebSocket();
            }
          }, 3000);
        }
      };
      
      wsRef.current.onerror = (error) => {
        console.error('Error WebSocket Dashboard:', error);
        setWsConnected(false);
      };
      
    } catch (error) {
      console.error('Error inicializando WebSocket Dashboard:', error);
      setWsConnected(false);
    }
  };

  const handlePaymentNotification = (paymentData) => {
    const notification = {
      id: Date.now(),
      type: 'payment',
      title: '💰 Nuevo Pago Recibido',
      message: `${paymentData.prestatario.nombre} (DNI: ${paymentData.prestatario.dni}) pagó S/. ${paymentData.monto.toFixed(2)}`,
      timestamp: new Date(),
      data: paymentData
    };
    
    // Agregar a la lista de notificaciones
    setNotifications(prev => [notification, ...prev.slice(0, 9)]); // Mantener solo las últimas 10
    
    // Mostrar notificación emergente
    setCurrentNotification(notification);
    setShowNotification(true);
    
    // Reproducir sonido de notificación
    playNotificationSound();
    
    // Auto-ocultar después de 5 segundos
    setTimeout(() => {
      setShowNotification(false);
    }, 5000);
    
    // Recargar alertas para actualizar el dashboard
    setTimeout(() => {
      cargarAlertasGlobales();
    }, 1000);
  };

  const playNotificationSound = () => {
    try {
      // Crear un sonido simple usando Web Audio API
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.2);
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    } catch (error) {
      console.log('No se pudo reproducir el sonido de notificación:', error);
    }
  };

  const dismissNotification = () => {
    setShowNotification(false);
  };

  const cargarAlertasGlobales = async () => {
    setLoadingAlertas(true);
    try {
      const response = await axios.get('http://localhost:8080/api_postgres.php?action=prestamos');
      const prestamos = response.data;
      
      const prestamosActivos = filtrarPrestamosActivos(prestamos);
      const alertasCalculadas = calcularAlertasVencimientos(prestamosActivos);
      const totalAlertas = obtenerTotalAlertas(alertasCalculadas);
      
      setGlobalAlertas(totalAlertas);
      localStorage.setItem('ultimasAlertas', totalAlertas.toString());
      
    } catch (error) {
      console.error('Error cargando alertas globales:', error);
      setGlobalAlertas(0);
    } finally {
      setLoadingAlertas(false);
    }
  };

  // Sincronización de alertas cada 10 segundos
  useEffect(() => {
    if (!isAuthenticated || !mounted) return;

    cargarAlertasGlobales();
    
    const interval = setInterval(() => {
      cargarAlertasGlobales();
    }, 10000);
    
    return () => clearInterval(interval);
  }, [isAuthenticated, mounted]);

  const manejarClickAlertas = () => {
    window.location.href = '/lista-prestamos';
  };

  const actualizarAlertasGlobales = (nuevoTotal) => {
    setGlobalAlertas(nuevoTotal);
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <NotificationProvider>
      <SyncProvider>
        <Router>
          <NavigationProvider>
            <div className="min-h-screen bg-gray-50 flex">
              {isAuthenticated && <Sidebar />}
            
            {/* Nuevo sistema de notificaciones en tiempo real */}
            <RealtimeNotifications
              notifications={realtimeNotifications}
              onRemove={removeNotification}
              onClearAll={clearAllNotifications}
              connectionStatus={connectionStatus}
            />
            
            {/* Notificación emergente de pagos (legacy - mantener para compatibilidad) */}
            {showNotification && currentNotification && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 animate-fade-in">
                <div className="bg-white rounded-xl shadow-2xl max-w-md w-11/12 mx-4 transform transition-all duration-300 animate-bounce-in">
                  <div className="flex justify-between items-center p-5 border-b border-gray-200">
                    <span className="text-lg font-semibold text-gray-900">{currentNotification.title}</span>
                    <button 
                      className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-all duration-200 text-2xl"
                      onClick={dismissNotification}
                    >
                      ×
                    </button>
                  </div>
                  <div className="p-5">
                    <p className="text-gray-700 mb-3 leading-relaxed">{currentNotification.message}</p>
                    <p className="text-sm text-gray-500 mb-4">
                      {currentNotification.timestamp.toLocaleTimeString('es-PE')}
                    </p>
                    {wsConnected && (
                      <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                        <span className="text-sm text-blue-700 font-medium">Sincronizado en tiempo real</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            {/* Indicador de conexión WebSocket (legacy - mantener para compatibilidad) */}
            {isAuthenticated && wsConnected && (
              <div className="fixed bottom-4 left-4 flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium shadow-lg z-40 transition-all duration-300 bg-blue-100 text-blue-800 border border-blue-200">
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                <span>Legacy WS</span>
              </div>
            )}
            
            <main className="flex-1 flex flex-col min-h-screen">
              {isAuthenticated && (
                <HeaderWithData 
                  alertasCount={globalAlertas}
                  onAlertasClick={manejarClickAlertas}
                />
              )}
              <AppRoutes 
                isAuthenticated={isAuthenticated}
                globalAlertas={globalAlertas}
                actualizarAlertasGlobales={actualizarAlertasGlobales}
                manejarClickAlertas={manejarClickAlertas}
                onAuthSuccess={() => setIsAuthenticated(true)}
              />
            </main>
          </div>
          </NavigationProvider>
        </Router>
      </SyncProvider>
    </NotificationProvider>
  );
};

export default App;
