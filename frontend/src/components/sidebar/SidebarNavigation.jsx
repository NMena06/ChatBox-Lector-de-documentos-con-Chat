import React from 'react';

const SidebarNavigation = ({ activeSidebarTab, setActiveSidebarTab }) => {
  return (
    <div className="sidebar-navigation">
      <button 
        className={`nav-btn ${activeSidebarTab === 'tables' ? 'active' : ''}`}
        onClick={() => setActiveSidebarTab('tables')}
      >
        📊 Tablas
      </button>
      <button 
        className={`nav-btn ${activeSidebarTab === 'conversations' ? 'active' : ''}`}
        onClick={() => setActiveSidebarTab('conversations')}
      >
        💬 Conversaciones
      </button>
      <button 
        className={`nav-btn ${activeSidebarTab === 'help' ? 'active' : ''}`}
        onClick={() => setActiveSidebarTab('help')}
      >
        💡 Ayuda Rápida
      </button>
      <button 
        className={`nav-btn ${activeSidebarTab === 'commands' ? 'active' : ''}`}
        onClick={() => setActiveSidebarTab('commands')}
      >
        ⌨️ Comandos
      </button>
    </div>
  );
};

export default SidebarNavigation;