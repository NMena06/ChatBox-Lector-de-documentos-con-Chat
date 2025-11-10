import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './Header.css';

const Header = ({ sidebarOpen, setSidebarOpen, showSidebarToggle, currentPath }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const getPageTitle = () => {
    const titles = {
      '/dashboard': 'Dashboard Principal',
      '/chat': 'Chat con IA',
      '/tablas': 'Gestión de Tablas',
      '/productos': 'Gestión de Productos',
      '/contabilidad': 'Contabilidad',
      '/ventas': 'Ventas y Clientes',
      '/configuracion': 'Configuración'
    };
    return titles[location.pathname] || 'MV Rodados';
  };

  const getBreadcrumbs = () => {
    const paths = location.pathname.split('/').filter(Boolean);
    return paths.map((path, index) => ({
      name: path.charAt(0).toUpperCase() + path.slice(1),
      path: '/' + paths.slice(0, index + 1).join('/')
    }));
  };

  return (
    <header className="header">
      <div className="header-left">
        {showSidebarToggle && (
          <button 
            className="sidebar-toggle"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            ☰
          </button>
        )}
        
        <div className="header-title">
          <h1>{getPageTitle()}</h1>
          <div className="breadcrumbs">
            <span 
              className="breadcrumb-item home"
              onClick={() => navigate('/dashboard')}
            >
              Inicio
            </span>
            {getBreadcrumbs().map((crumb, index) => (
              <span key={crumb.path} className="breadcrumb-separator">
                /
                <span 
                  className={`breadcrumb-item ${index === getBreadcrumbs().length - 1 ? 'active' : ''}`}
                  onClick={() => navigate(crumb.path)}
                >
                  {crumb.name}
                </span>
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="header-right">
        <div className="header-actions">
          <button 
            className="header-btn"
            onClick={() => navigate('/chat')}
            title="Chat con IA"
          >
            💬 Chat
          </button>
          <button 
            className="header-btn"
            onClick={() => window.location.reload()}
            title="Recargar"
          >
            🔄
          </button>
          <div className="user-info">
            <span className="user-avatar">👤</span>
            <span className="user-name">Administrador</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;