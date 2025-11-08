import React from 'react';
import './CategoryPanel.css';

const VentasPanel = ({ tables, selectedTable, loadTableData }) => {
  const ventasTables = [
    { name: 'Comprobantes', icon: '🧾', description: 'Comprobantes de venta' },
    { name: 'Clientes', icon: '👥', description: 'Gestión de clientes' }
  ];

  return (
    <div className="category-panel">
      <div className="category-header">
        <h3>📊 Ventas y Clientes</h3>
        <p>Gestión comercial y atención al cliente</p>
      </div>
      
      <div className="tables-grid">
        {ventasTables.map(table => (
          <div 
            key={table.name}
            className={`table-card ${selectedTable === table.name ? 'active' : ''}`}
            onClick={() => loadTableData(table.name)}
          >
            <div className="table-card-header">
              <span className="table-icon">{table.icon}</span>
              <span className="table-name">{table.name}</span>
            </div>
            <div className="table-description">{table.description}</div>
            <div className="table-arrow">→</div>
          </div>
        ))}
      </div>

      <div className="quick-actions">
        <button className="action-btn primary">
          🎯 Nueva Venta
        </button>
        <button className="action-btn secondary">
          📋 Ver Comprobantes
        </button>
      </div>
    </div>
  );
};

export default VentasPanel;