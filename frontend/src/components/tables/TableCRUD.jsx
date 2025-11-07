import React from 'react';

const TableCRUD = ({ 
  tableData, 
  editingRow, 
  setEditingRow, 
  newRow, 
  setNewRow, 
  handleAddRow, 
  handleUpdateRow, 
  handleDeleteRow 
}) => {
  if (!tableData.length) return <div className="no-data">No hay datos en esta tabla</div>;
  
  const columns = Object.keys(tableData[0]);
  
  return (
    <div className="table-crud">
      {/* Formulario para agregar nuevo registro */}
      <div className="add-row-form">
        <h4>➕ Agregar Nuevo Registro</h4>
        <div className="form-fields">
          {columns.filter(col => col !== 'id' && !col.includes('fecha')).map(column => (
            <input
              key={column}
              type="text"
              placeholder={column}
              value={newRow[column] || ''}
              onChange={(e) => setNewRow({...newRow, [column]: e.target.value})}
              className="form-input"
            />
          ))}
        </div>
        <button onClick={handleAddRow} className="add-button">
          Agregar
        </button>
      </div>

      {/* Tabla de datos */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              {columns.map(key => (
                <th key={key}>{key}</th>
              ))}
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {tableData.map((row, index) => (
              <tr key={index}>
                {columns.map(column => (
                  <td key={column}>
                    {editingRow === row.id ? (
                      <input
                        type="text"
                        value={row[column] || ''}
                        onChange={(e) => {
                          const updatedData = tableData.map(item => 
                            item.id === row.id ? {...item, [column]: e.target.value} : item
                          );
                          // Aquí necesitarías una función para actualizar el estado
                        }}
                        className="edit-input"
                      />
                    ) : (
                      row[column] || ''
                    )}
                  </td>
                ))}
                <td className="actions">
                  {editingRow === row.id ? (
                    <>
                      <button 
                        onClick={() => handleUpdateRow(row.id, row)}
                        className="save-btn"
                      >
                        💾
                      </button>
                      <button 
                        onClick={() => setEditingRow(null)}
                        className="cancel-btn"
                      >
                        ❌
                      </button>
                    </>
                  ) : (
                    <>
                      <button 
                        onClick={() => setEditingRow(row.id)}
                        className="edit-btn"
                      >
                        ✏️
                      </button>
                      <button 
                        onClick={() => handleDeleteRow(row.id)}
                        className="delete-btn"
                      >
                        🗑️
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TableCRUD;