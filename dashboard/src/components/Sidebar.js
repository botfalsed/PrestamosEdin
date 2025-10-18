import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import logo from '../assets/prestamos.jpg';
import '../assets/css/sidebar.css';

const Sidebar = () => {
  const location = useLocation();

  const handleNavClick = (e) => {
    const anchor = e.target.closest('a');
    if (!anchor) return;
    if (window.innerWidth <= 768) {
      document.body.classList.remove('sidebar-open');
      window.dispatchEvent(new CustomEvent('sidebar-open-change', { detail: false }));
    }
  };

  return (
    <aside className="base-sidebar">
      <div className="base-sidebar-header">
        <img src={logo} alt="Logo de Préstamos" className="base-logo" />
        <h2>Sistema de Préstamos</h2>
      </div>
      <nav className="base-sidebar-nav" onClick={handleNavClick}>
        <ul>
          <li>
            <Link 
              to="/inicio" 
              className={location.pathname === '/inicio' ? 'active' : ''}
            >
              🏠 Inicio
            </Link>
          </li>
          <li>
            <Link 
              to="/registrar-prestamo" 
              className={location.pathname === '/registrar-prestamo' ? 'active' : ''}
            >
              📝 Registrar Préstamo
            </Link>
          </li>
          <li>
            <Link 
              to="/lista-prestamos" 
              className={location.pathname === '/lista-prestamos' ? 'active' : ''}
            >
              📋 Lista de Préstamos
            </Link>
          </li>
          <li>
            <Link 
              to="/gestion-prestamos" 
              className={location.pathname === '/gestion-prestamos' ? 'active' : ''}
            >
              ⚙️ Gestión de Préstamos
            </Link>
          </li>
          <li>
            <Link 
              to="/prestatarios" 
              className={location.pathname === '/prestatarios' ? 'active' : ''}
            >
              👥 Prestatarios
            </Link>
          </li>
          <li>
            <Link 
              to="/archivados" 
              className={location.pathname === '/archivados' ? 'active' : ''}
            >
              📁 Archivados
            </Link>
          </li>
          
          {/* NUEVAS SECCIONES DE IMPORTAR/EXPORTAR */}
          <li className="base-sidebar-divider">
            <span>Herramientas</span>
          </li>
          <li>
            <Link 
              to="/importar-prestatarios" 
              className={location.pathname === '/importar-prestatarios' ? 'active' : ''}
            >
              📥 Importar Prestatarios
            </Link>
          </li>
          <li>
            <Link 
              to="/exportar-prestatarios" 
              className={location.pathname === '/exportar-prestatarios' ? 'active' : ''}
            >
              📤 Exportar Prestatarios
            </Link>
          </li>

          {/* NUEVA SECCIÓN DE CONFIGURACIÓN */}
          <li className="base-sidebar-divider">
            <span>Sistema</span>
          </li>
          <li>
            <Link 
              to="/configuracion" 
              className={location.pathname === '/configuracion' ? 'active' : ''}
            >
              🎨 Configuración
            </Link>
          </li>

          <li className="base-sidebar-divider">
            <span>Sesión</span>
          </li>
          <li>
            <Link 
              to="/logout" 
              className={location.pathname === '/logout' ? 'active' : ''}
            >
              🚪 Cerrar Sesión
            </Link>
          </li>
        </ul>
      </nav>
      <div className="base-sidebar-footer">
        <p>&copy; 2025 Sistema de Préstamos</p>
      </div>
    </aside>
  );
};

export default Sidebar;
