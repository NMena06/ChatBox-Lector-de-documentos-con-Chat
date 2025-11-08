import React from 'react';
import './CategoryPanel.css';

const ContabilidadPanel = ({ tables, selectedTable, loadTableData }) => {
  const contabilidadTables = [
    { name: 'Transacciones', icon: '💳', description: 'Registro de transacciones' },
    { name: 'Balances', icon: '⚖️', description: 'Balances y estados financieros' }
  ];

  return (
    <div className="category-panel">
      <div className="category-header">
        <h3>💰 Contabilidad</h3>
        <p>Gestión financiera y contable</p>
      </div>
      
      <div className="tables-grid">
        {contabilidadTables.map(table => (
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
          📊 Ver Balance General
        </button>
        <button className="action-btn secondary">
          📈 Reporte Mensual
        </button>
      </div>
    </div>
  );
};

export default ContabilidadPanel;