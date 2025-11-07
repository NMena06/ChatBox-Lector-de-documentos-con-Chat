import React from 'react';

const TablesPanel = ({ tables, selectedTable, loadTableData }) => {
  return (
    <div className="tables-section">
      <h3>📊 Tablas Disponibles</h3>
      <div className="tables-list">
        {tables.map(table => (
          <div 
            key={table}
            className={`table-item ${selectedTable === table ? 'active' : ''}`}
            onClick={() => loadTableData(table)}
          >
            <span className="table-icon">📋</span>
            <span className="table-name">{table}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TablesPanel;