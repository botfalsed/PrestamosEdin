import React, { memo } from 'react';
import { useNavigation } from '../context/NavigationContext';
import { ConnectionStatus } from './ConnectionStatus';
import logo from '../assets/prestamos.jpg';

const Sidebar = memo(() => {
  const { routes, navigateTo, isActiveRoute, isNavigating, sidebarOpen, closeSidebar } = useNavigation();

  const handleNavClick = (path, e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Prevenir clics múltiples rápidos
    if (isNavigating || e.target.classList.contains('navigating')) {
      return;
    }
    
    // Marcar como navegando temporalmente
    e.target.classList.add('navigating');
    setTimeout(() => {
      e.target.classList.remove('navigating');
    }, 200);
    
    navigateTo(path);
  };

  // Agrupar rutas por secciones
  const mainRoutes = routes.slice(0, 6); // Inicio hasta Archivados
  const toolRoutes = routes.slice(6, 8); // Importar/Exportar
  const systemRoutes = routes.slice(8, 9); // Configuración
  const sessionRoutes = routes.slice(9); // Logout

  return (
    <>
      {/* Overlay para móvil */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={closeSidebar}
        />
      )}
      
      {/* Sidebar */}
      <aside className={`
        fixed lg:static top-0 left-0 z-50 lg:z-auto
        w-64 bg-white shadow-medium border-r border-gray-200 
        flex flex-col h-screen
        transform transition-transform duration-300 ease-in-out lg:transform-none
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Header con botón de cerrar en móvil */}
        <div className="p-4 sm:p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
              <img src={logo} alt="Logo de Préstamos" className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg object-cover flex-shrink-0" />
              <h2 className="text-sm sm:text-lg font-semibold text-gray-900 truncate">Sistema de Préstamos</h2>
            </div>
            {/* Botón cerrar solo en móvil */}
            <button
              onClick={closeSidebar}
              className="lg:hidden p-1 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100"
            >
              <span className="text-xl">✕</span>
            </button>
          </div>
        </div>
        
        <nav className="flex-1 overflow-y-auto py-2 sm:py-4">
          <ul className="space-y-1 px-2 sm:px-3">
            {/* Rutas principales */}
            {mainRoutes.map((route) => (
              <li key={route.path}>
                <a
                  href={route.path}
                  onClick={(e) => handleNavClick(route.path, e)}
                  className={`flex items-center space-x-2 sm:space-x-3 px-2 sm:px-3 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 ${
                    isActiveRoute(route.path) 
                      ? 'bg-primary-100 text-primary-700 border-r-2 border-primary-600' 
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <span className="text-base sm:text-lg flex-shrink-0">{route.icon}</span>
                  <span className="truncate">{route.name}</span>
                </a>
              </li>
            ))}
            
            {/* Sección de herramientas */}
            <li className="pt-4 sm:pt-6 pb-1 sm:pb-2">
              <div className="px-2 sm:px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Herramientas
              </div>
            </li>
            {toolRoutes.map((route) => (
              <li key={route.path}>
                <a
                  href={route.path}
                  onClick={(e) => handleNavClick(route.path, e)}
                  className={`flex items-center space-x-2 sm:space-x-3 px-2 sm:px-3 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 ${
                    isActiveRoute(route.path) 
                      ? 'bg-primary-100 text-primary-700 border-r-2 border-primary-600' 
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <span className="text-base sm:text-lg flex-shrink-0">{route.icon}</span>
                  <span className="truncate">{route.name}</span>
                </a>
              </li>
            ))}

            {/* Sección de sistema */}
            <li className="pt-4 sm:pt-6 pb-1 sm:pb-2">
              <div className="px-2 sm:px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Sistema
              </div>
            </li>
            {systemRoutes.map((route) => (
              <li key={route.path}>
                <a
                  href={route.path}
                  onClick={(e) => handleNavClick(route.path, e)}
                  className={`flex items-center space-x-2 sm:space-x-3 px-2 sm:px-3 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 ${
                    isActiveRoute(route.path) 
                      ? 'bg-primary-100 text-primary-700 border-r-2 border-primary-600' 
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <span className="text-base sm:text-lg flex-shrink-0">{route.icon}</span>
                  <span className="truncate">{route.name}</span>
                </a>
              </li>
            ))}

            {/* Sección de sesión */}
            <li className="pt-4 sm:pt-6 pb-1 sm:pb-2">
              <div className="px-2 sm:px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Sesión
              </div>
            </li>
            {sessionRoutes.map((route) => (
              <li key={route.path}>
                <a
                  href={route.path}
                  onClick={(e) => handleNavClick(route.path, e)}
                  className={`flex items-center space-x-2 sm:space-x-3 px-2 sm:px-3 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 ${
                    isActiveRoute(route.path) 
                      ? 'bg-danger-100 text-danger-700 border-r-2 border-danger-600' 
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <span className="text-base sm:text-lg flex-shrink-0">{route.icon}</span>
                  <span className="truncate">{route.name}</span>
                </a>
              </li>
            ))}
          </ul>
        </nav>
        
        {/* Estado de conexión WebSocket */}
        <div className="p-2 sm:p-3 border-t border-gray-200">
          <ConnectionStatus compact={true} />
        </div>
        
        <div className="p-3 sm:p-4 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">&copy; 2025 Sistema de Préstamos</p>
        </div>
      </aside>
    </>
  );
});

export default Sidebar;
