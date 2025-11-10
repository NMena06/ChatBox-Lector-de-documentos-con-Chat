import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import '../layout/Layout.css';

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  // Ocultar sidebar en ciertas rutas si es necesario
  const showSidebar = !['/chat'].includes(location.pathname);

  return (
    <div className="layout">
      {showSidebar && (
        <Sidebar 
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          currentPath={location.pathname}
        />
      )}
      
      <div className={`layout-main ${!showSidebar ? 'layout-full' : ''}`}>
        <Header 
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          showSidebarToggle={showSidebar}
          currentPath={location.pathname}
        />
        
        <main className="layout-content">
          {children}
        </main>
      </div>

      {/* Overlay para móvil */}
      {sidebarOpen && showSidebar && (
        <div 
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default Layout;