import React from 'react';
import './SidebarNavigation.css';

const SidebarNavigation = ({ activeSidebarTab, setActiveSidebarTab }) => {
  const menuCategories = [
    {
      id: 'productos',
      name: 'Productos',
      icon: '🛍️'
    },
    {
      id: 'contabilidad', 
      name: 'Contabilidad',
      icon: '💰'
    },
    {
      id: 'ventas',
      name: 'Ventas',
      icon: '📊'
    },
    {
      id: 'clientes',
      name: 'Clientes', 
      icon: '👥'
    },
    {
      id: 'scripts',
      name: 'Scripts',
      icon: '⚡'
    }
  ];

  return (
    <div className="sidebar-navigation">
      {menuCategories.map(category => (
        <button 
          key={category.id}
          className={`nav-btn ${activeSidebarTab === category.id ? 'active' : ''}`}
          onClick={() => setActiveSidebarTab(category.id)}
        >
          <span className="nav-icon">{category.icon}</span>
          <span className="nav-text">{category.name}</span>
        </button>
      ))}
    </div>
  );
};

export default SidebarNavigation;