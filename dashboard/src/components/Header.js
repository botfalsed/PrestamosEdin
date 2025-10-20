import React, { useState, useEffect } from 'react';
import { useNavigation } from '../context/NavigationContext';

const Header = ({ 
  section = "Dashboard", 
  userName = "Usuario", 
  showDateTime = true,
  alertasCount = 0,  
  onAlertasClick = () => {},
  onToggleSidebar = () => {}
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const { sidebarOpen, toggleSidebar } = useNavigation();

  useEffect(() => {
    if (showDateTime) {
      const updateDateTime = () => {
        setCurrentTime(new Date());
      };

      updateDateTime();
      const interval = setInterval(updateDateTime, 1000);
      return () => clearInterval(interval);
    }
  }, [showDateTime]);

  // MEJORADO: Nombres específicos para cada sección
  const getSectionDisplayName = (section) => {
    const sectionNames = {
      'inicio': 'Dashboard Principal',
      'dashboard': 'Dashboard Principal',
      'registrar-prestamo': 'Nuevo Préstamo',
      'lista-prestamos': 'Lista de Préstamos',
      'gestion-prestamos': 'Gestión de Préstamos',
      'prestatarios': 'Gestión de Prestatarios',
      'archivados': 'Préstamos Archivados',
      'importar-prestatarios': 'Importar Prestatarios',
      'exportar-prestatarios': 'Exportar Prestatarios',
      'login': 'Iniciar Sesión'
    };
    
    return sectionNames[section.toLowerCase()] || section;
  };

  const getAlertasStyles = () => {
    if (alertasCount === 0) return 'bg-gray-100 text-gray-600';
    if (alertasCount <= 3) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    if (alertasCount <= 10) return 'bg-orange-100 text-orange-800 border-orange-200';
    return 'bg-red-100 text-red-800 border-red-200';
  };

  const getAlertasText = () => {
    if (alertasCount === 0) return 'Sin alertas';
    if (alertasCount === 1) return '1 alerta';
    return `${alertasCount} alertas`;
  };

  // Variables para mostrar en el componente
  const sectionName = getSectionDisplayName(section);
  const currentDateTime = currentTime.toLocaleString('es-PE');

  return (
    <header className="bg-white shadow-lg border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Botón hamburguesa y título */}
          <div className="flex items-center gap-2">
            <button
              onClick={onToggleSidebar}
              className="inline-flex items-center justify-center w-10 h-10 border-none rounded-lg bg-slate-800 text-white shadow-md hover:bg-slate-700 hover:-translate-y-0.5 hover:shadow-lg active:scale-95 transition-all duration-200 cursor-pointer"
            >
              <span className="text-lg">☰</span>
            </button>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-800 bg-gradient-to-r from-slate-800 to-blue-600 bg-clip-text text-transparent">
              {sectionName}
            </h1>
          </div>

          {/* Fecha y hora */}
          <div className="hidden md:flex items-center gap-2 text-sm text-gray-600 font-medium">
            <span className="text-blue-500">🕐</span>
            <span>{currentDateTime}</span>
          </div>

          {/* Alertas y usuario */}
          <div className="flex items-center gap-4">
            {/* Botón de alertas */}
            {alertasCount > 0 && (
              <button 
                onClick={onAlertasClick}
                className="flex items-center gap-2 px-3 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg border border-red-200 transition-colors duration-200"
              >
                <span className="text-lg">🚨</span>
                <span className="font-semibold">{alertasCount}</span>
                <span className="text-sm font-medium hidden sm:inline">{getAlertasText()}</span>
              </button>
            )}
            
            {/* Avatar y nombre de usuario */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-full flex items-center justify-center font-semibold text-sm shadow-md">
                {userName.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm font-medium text-gray-700 hidden sm:inline">{userName}</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
