import React, { useState, useCallback } from 'react';
import './TableCRUD.css';

const TableCRUD = ({
tableData,
  editingRow,
  setEditingRow,
  newRow,
  setNewRow,
  handleAddRow,
  handleUpdateRow,
  handleDeleteRow,
  isAccordionOpen,
  setIsAccordionOpen
}) => {


  // 🔁 Evitamos que el acordeón se cierre por re-render
  const toggleAccordion = useCallback(() => {
    setIsAccordionOpen(prev => !prev);
  }, []);

  if (!tableData || tableData.length === 0) {
    return (
      <div className="no-data">
        <div className="no-data-icon">📊</div>
        <div>No hay datos en esta tabla</div>
      </div>
    );
  }

  const columns = Object.keys(tableData[0]);

  return (
    <div className="table-crud">
      {/* 🧱 Acordeón para agregar nuevo registro */}
      <div className="add-row-accordion">
        <div
          className={`accordion-header ${isAccordionOpen ? 'open' : ''}`}
          onClick={toggleAccordion}
        >
          <div className="accordion-title">
            <span className="accordion-icon">📥</span>
            Agregar Nuevo Registro
          </div>
          <div className="accordion-arrow">
            {isAccordionOpen ? '▲' : '▼'}
          </div>
        </div>

        <div className={`accordion-content ${isAccordionOpen ? 'open' : ''}`}>
          <div
            className="add-row-form"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            <div className="form-fields">
              {columns
                .filter(col => col !== 'id' && !col.includes('fecha'))
                .map(column => (
                  <input
                    key={column}
                    type="text"
                    placeholder={column.replace(/_/g, ' ')}
                    value={newRow[column] || ''}
                    onChange={(e) =>
                      setNewRow({ ...newRow, [column]: e.target.value })
                    }
                    className="form-input"
                  />
                ))}
            </div>
            <div className="form-actions">
              <button
                onClick={() => {
                  handleAddRow();
                  setIsAccordionOpen(false);
                }}
                className="add-button"
                disabled={
                  Object.keys(newRow).length === 0 ||
                  Object.values(newRow).every(v => v === '')
                }
              >
                Agregar Registro
              </button>
              <button
                onClick={() => {
                  setIsAccordionOpen(false);
                  setNewRow({});
                }}
                className="cancel-button"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* 📋 Tabla de datos */}
      <div className={`table-container ${isAccordionOpen ? 'behind' : ''}`}>

        <table className="data-table">
          <thead>
            <tr>
              {columns.map(key => (
                <th key={key} title={key}>
                  {key.replace(/_/g, ' ').toUpperCase()}
                </th>
              ))}
              <th>ACCIONES</th>
            </tr>
          </thead>
          <tbody>
            {tableData.map((row, index) => (
              <tr key={row.id || index}>
                {columns.map(column => (
                  <td key={column} title={row[column]}>
                    {editingRow === row.id ? (
                      <input
                        type="text"
                        value={row[column] || ''}
                        onChange={(e) => {
                          const updated = tableData.map(item =>
                            item.id === row.id
                              ? { ...item, [column]: e.target.value }
                              : item
                          );
                          // ⚠️ Asegurate de que `setTableData` se maneje fuera de este componente
                        }}
                        className="edit-input"
                        placeholder={column}
                      />
                    ) : (
                      <span className="cell-content">
                        {row[column] || '-'}
                      </span>
                    )}
                  </td>
                ))}
                <td className="actions">
                  {editingRow === row.id ? (
                    <>
                      <button
                        onClick={() => handleUpdateRow(row.id, row)}
                        className="save-btn"
                        title="Guardar"
                      >
                        💾
                      </button>
                      <button
                        onClick={() => setEditingRow(null)}
                        className="cancel-btn"
                        title="Cancelar"
                      >
                        ❌
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => setEditingRow(row.id)}
                        className="edit-btn"
                        title="Editar"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm('¿Estás seguro de que querés eliminar este registro?')) {
                            handleDeleteRow(row.id);
                          }
                        }}
                        className="delete-btn"
                        title="Eliminar"
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

        {/* ↔ Indicador de scroll
        {columns.length > 6 && (
          <div className="scroll-hint">← Desplázate →</div>
        )} */}
      </div>
    </div>
  );
};

export default TableCRUD;
