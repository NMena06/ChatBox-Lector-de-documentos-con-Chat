import React from 'react';
import './CategoryPanel.css';

const ProductosPanel = ({ tables, selectedTable, loadTableData }) => {
  const productosTables = [
    { name: 'Motos', icon: '🏍️', description: 'Gestión de motocicletas' },
    { name: 'Cascos', icon: '⛑️', description: 'Cascos y protección' },
    { name: 'Indumentarias', icon: '👕', description: 'Ropa y equipamiento' },
    { name: 'Bicicletas', icon: '🚲', description: 'Bicicletas y accesorios' },
    { name: 'Accesorios', icon: '🔧', description: 'Accesorios y repuestos' },
    { name: 'ListaPrecios', icon: '💰', description: 'Lista de precios' }
  ];

  return (
    <div className="category-panel">
      <div className="category-header">
        <h3>🛍️ Gestión de Productos</h3>
        <p>Administra tu inventario de productos</p>
      </div>
      
      <div className="tables-grid">
        {productosTables.map(table => (
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
    </div>
  );
};

export default ProductosPanel;