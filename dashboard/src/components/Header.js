import React, { useState, useEffect } from 'react';
import '../assets/css/header.css';

const Header = ({ 
  section = "Dashboard", 
  userName = "Usuario", 
  showDateTime = true,
  alertasCount = 0,  
  onAlertasClick = () => {} 
}) => {
  const [currentDateTime, setCurrentDateTime] = useState('');
  // Agregar estado para el menú móvil
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    if (showDateTime) {
      const updateDateTime = () => {
        const now = new Date();
        setCurrentDateTime(now.toLocaleString('es-ES', { 
          timeZone: 'America/Lima',
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        }));
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

  const getAlertasColor = () => {
    if (alertasCount === 0) return 'alertas-none';
    if (alertasCount <= 3) return 'alertas-low';
    if (alertasCount <= 10) return 'alertas-medium';
    return 'alertas-high';
  };

  const getAlertasText = () => {
    if (alertasCount === 0) return 'Sin alertas';
    if (alertasCount === 1) return '1 alerta';
    return `${alertasCount} alertas`;
  };

  // Sincronizar estado del botón con cambios externos
  useEffect(() => {
    const handler = (e) => setIsSidebarOpen(!!e.detail);
    window.addEventListener('sidebar-open-change', handler);
    return () => window.removeEventListener('sidebar-open-change', handler);
  }, []);

  // Toggle de sidebar móvil añadiendo/removiendo clase al body
  const toggleSidebar = () => {
    const body = document.body;
    const open = !body.classList.contains('sidebar-open');
    body.classList.toggle('sidebar-open', open);
    setIsSidebarOpen(open);
    window.dispatchEvent(new CustomEvent('sidebar-open-change', { detail: open }));
  };

  return (
    <header className="base-main-header">
      <div className="base-header-left">
        {/* Botón Hamburguesa visible en móvil */}
        <button 
          className="hamburger-btn" 
          aria-label={isSidebarOpen ? 'Cerrar menú' : 'Abrir menú'}
          onClick={toggleSidebar}
        >
          {isSidebarOpen ? '✕' : '☰'}
        </button>
        <h1 className="base-section-title">{getSectionDisplayName(section)}</h1>
        {showDateTime && (
          <span id="current-date-time" className="base-datetime">
            {currentDateTime}
          </span>
        )}
      </div>
      <div className="base-header-right">
        {/* ✅ CONTADOR DE ALERTAS */}
        {alertasCount > 0 && (
          <div 
            className={`alertas-badge ${getAlertasColor()}`}
            onClick={onAlertasClick}
            title="Ver alertas pendientes"
          >
            <span className="alertas-icon">🚨</span>
            <span className="alertas-count">{alertasCount}</span>
            <span className="alertas-text">{getAlertasText()}</span>
          </div>
        )}
        
        <div className="base-user-info">
          <div className="base-user-avatar">
            {userName.charAt(0).toUpperCase()}
          </div>
          <span className="base-user-name">{userName}</span>
        </div>
      </div>
    </header>
  );
};

export default Header;
