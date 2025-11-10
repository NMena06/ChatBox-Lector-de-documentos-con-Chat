import React, { useState, useEffect } from 'react';
import './CategoryPanel.css';

const ProductosPanel = ({ tables, selectedTable, loadTableData }) => {
  const [tiposArticulo, setTiposArticulo] = useState([]);
  const [loading, setLoading] = useState(false);

  // Cargar tipos de artículo al montar el componente
  useEffect(() => {
    loadTiposArticulo();
  }, []);

  const loadTiposArticulo = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:3001/api/articulos/tipos');
      const data = await response.json();
      
      if (data.success) {
        setTiposArticulo(data.data);
      }
    } catch (error) {
      console.error('Error cargando tipos de artículo:', error);
    } finally {
      setLoading(false);
    }
  };

  // Tablas principales de productos
  const productosTables = [
    { name: 'Articulos', icon: '📦', description: 'Gestión unificada de artículos' },
    { name: 'TipoArticulo', icon: '🏷️', description: 'Tipos y categorías de artículos' },
    { name: 'ListaPrecios', icon: '💰', description: 'Lista de precios y márgenes' }
  ];

  // Función para cargar datos con manejo de errores
  const handleLoadTable = async (tableName) => {
    try {
      await loadTableData(tableName);
    } catch (error) {
      console.error(`Error cargando tabla ${tableName}:`, error);
    }
  };

  return (
    <div className="category-panel">
      <div className="category-header">
        <h3>🛍️ Gestión de Productos</h3>
        <p>Administra tu inventario unificado de artículos</p>
      </div>
      
      {/* Tablas principales */}
      <div className="tables-section">
        {/* <h4>📊 Tablas Principales</h4> */}
        <div className="tables-grid">
          {productosTables.map(table => (
            <div 
              key={table.name}
              className={`table-card ${selectedTable === table.name ? 'active' : ''}`}
              onClick={() => handleLoadTable(table.name)}
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

      {/* Tipos de artículo disponibles */}
      {/* <div className="tipos-section">
        <h4>🏷️ Tipos de Artículo</h4>
        {loading ? (
          <div className="loading-tipos">Cargando tipos...</div>
        ) : (
          <div className="tipos-grid">
            {tiposArticulo.map(tipo => (
              <div 
                key={tipo.id}
                className="tipo-card"
                onClick={() => {
                  // Filtrar artículos por tipo
                  handleLoadTable('Articulos');
                  // Aquí podrías agregar un filtro específico por tipo
                }}
                title={`Ver artículos de ${tipo.nombre}`}
              >
                <div className="tipo-icon">📦</div>
                <div className="tipo-name">{tipo.nombre}</div>
                {tipo.descripcion && (
                  <div className="tipo-desc">{tipo.descripcion}</div>
                )}
              </div>
            ))}
          </div>
        )}
      </div> */}

      {/* Acciones rápidas */}
      <div className="quick-actions">
        <button 
          className="action-btn primary"
          onClick={() => handleLoadTable('Articulos')}
        >
          📦 Ver Todos los Artículos
        </button>
        <button 
          className="action-btn secondary"
          onClick={() => handleLoadTable('TipoArticulo')}
        >
          🏷️ Gestionar Tipos
        </button>
      </div>

      {/* Información de migración */}
      <div className="migration-info">
        <div className="info-card">
          <strong>🔄 Sistema Unificado</strong>
          <p>Ahora todos los productos están centralizados en la tabla Artículos</p>
        </div>
      </div>
    </div>
  );
};

export default ProductosPanel;