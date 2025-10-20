import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const NavigationContext = createContext();

export const useNavigation = () => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation debe ser usado dentro de NavigationProvider');
  }
  return context;
};

export const NavigationProvider = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [navigationHistory, setNavigationHistory] = useState([]);
  const [isNavigating, setIsNavigating] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Rutas disponibles en el sistema
  const routes = [
    { path: '/inicio', name: 'Inicio', icon: '🏠' },
    { path: '/registrar-prestamo', name: 'Registrar Préstamo', icon: '📝' },
    { path: '/lista-prestamos', name: 'Lista de Préstamos', icon: '📋' },
    { path: '/gestion-prestamos', name: 'Gestión de Préstamos', icon: '⚙️' },
    { path: '/prestatarios', name: 'Prestatarios', icon: '👥' },
    { path: '/archivados', name: 'Archivados', icon: '📁' },
    { path: '/importar-prestatarios', name: 'Importar Prestatarios', icon: '📥' },
    { path: '/exportar-prestatarios', name: 'Exportar Prestatarios', icon: '📤' },
    { path: '/configuracion', name: 'Configuración', icon: '🎨' },
    { path: '/logout', name: 'Cerrar Sesión', icon: '🚪' }
  ];

  // Función de navegación mejorada con rastreo
  const navigateTo = (path, options = {}) => {
    try {
      setIsNavigating(true);
      
      // Agregar a historial si no es la misma ruta
      if (location.pathname !== path) {
        setNavigationHistory(prev => {
          const newHistory = [...prev, path];
          return newHistory.slice(-10);
        });
      }

      // Cerrar sidebar siempre después de navegación
      setSidebarOpen(false);
      document.body.classList.remove('sidebar-open');

      // Navegar con un pequeño delay para evitar conflictos
      setTimeout(() => {
        navigate(path, options);
        setIsNavigating(false);
      }, 100);

    } catch (error) {
      console.error('❌ ERROR EN NAVEGACIÓN:', error);
      setIsNavigating(false);
    }
  };

  // Función para ir atrás en el historial
  const goBack = () => {
    if (navigationHistory.length > 0) {
      const previousPath = navigationHistory[navigationHistory.length - 1];
      setNavigationHistory(prev => prev.slice(0, -1));
      navigateTo(previousPath);
    } else {
      navigateTo('/inicio');
    }
  };

  // Función para obtener información de la ruta actual
  const getCurrentRoute = () => {
    return routes.find(route => route.path === location.pathname) || 
           { path: location.pathname, name: 'Página', icon: '📄' };
  };

  // Función para verificar si una ruta está activa
  const isActiveRoute = (path) => {
    return location.pathname === path;
  };

  // Manejo del sidebar
  const toggleSidebar = () => {
    // Prevenir toggle múltiple rápido
    if (isNavigating) {
      return;
    }

    const newState = !sidebarOpen;
    setSidebarOpen(newState);
    
    if (newState) {
      document.body.classList.add('sidebar-open');
    } else {
      document.body.classList.remove('sidebar-open');
    }
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
    document.body.classList.remove('sidebar-open');
  };

  // Sincronizar estado del sidebar con el DOM
  useEffect(() => {
    const checkSidebarState = () => {
      const isOpen = document.body.classList.contains('sidebar-open');
      setSidebarOpen(isOpen);
    };

    // Verificar estado inicial
    checkSidebarState();

    // Observer para cambios en el DOM
    const observer = new MutationObserver(checkSidebarState);
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['class']
    });

    return () => observer.disconnect();
  }, []);

  // Cerrar sidebar al cambiar de ruta
  useEffect(() => {
    if (window.innerWidth <= 768) {
      closeSidebar();
    }
  }, [location.pathname]);

  const value = {
    // Navegación
    navigateTo,
    goBack,
    isNavigating,
    navigationHistory,
    
    // Rutas
    routes,
    getCurrentRoute,
    isActiveRoute,
    currentPath: location.pathname,
    
    // Sidebar
    sidebarOpen,
    toggleSidebar,
    closeSidebar
  };

  return (
    <NavigationContext.Provider value={value}>
      {children}
    </NavigationContext.Provider>
  );
};