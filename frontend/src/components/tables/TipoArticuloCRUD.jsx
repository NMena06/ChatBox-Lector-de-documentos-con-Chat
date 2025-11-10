import React, { useState, useCallback } from 'react';
import Swal from 'sweetalert2';
import './TableCRUD.css';

const TipoArticuloCRUD = ({
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
  const toggleAccordion = useCallback(() => {
    setIsAccordionOpen(prev => !prev);
  }, []);

  if (!tableData || tableData.length === 0) {
    return (
      <div className="no-data">
        <div className="no-data-icon">🏷️</div>
        <div>No hay tipos de artículo registrados</div>
        <button 
          className="add-first-btn"
          onClick={() => setIsAccordionOpen(true)}
        >
          + Crear Primer Tipo
        </button>
      </div>
    );
  }

  return (
    <div className="table-crud">
      {/* Acordeón para agregar nuevo tipo */}
      <div className="add-row-accordion">
        <div
          className={`accordion-header ${isAccordionOpen ? 'open' : ''}`}
          onClick={toggleAccordion}
        >
          <div className="accordion-title">
            <span className="accordion-icon">🏷️</span>
            Agregar Nuevo Tipo de Artículo
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
              <div className="form-field-group">
                <label className="form-label">Nombre del Tipo *</label>
                <input
                  type="text"
                  placeholder="Ej: Moto, Bicicleta, Casco..."
                  value={newRow.nombre || ''}
                  onChange={(e) => setNewRow({ ...newRow, nombre: e.target.value })}
                  className="form-input"
                />
              </div>
              
              <div className="form-field-group full-width">
                <label className="form-label">Descripción</label>
                <textarea
                  placeholder="Descripción del tipo de artículo..."
                  value={newRow.descripcion || ''}
                  onChange={(e) => setNewRow({ ...newRow, descripcion: e.target.value })}
                  className="form-input textarea"
                  rows="3"
                />
              </div>
            </div>
            
            <div className="form-actions">
              <button
                onClick={() => {
                  handleAddRow();
                  setIsAccordionOpen(false);
                }}
                className="add-button"
                disabled={!newRow.nombre}
              >
                Agregar Tipo
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

      {/* Tabla de tipos de artículo */}
      <div className={`table-container ${isAccordionOpen ? 'behind' : ''}`}>
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>NOMBRE</th>
              <th>DESCRIPCIÓN</th>
              <th>ESTADO</th>
              <th>FECHA CREACIÓN</th>
              <th>ACCIONES</th>
            </tr>
          </thead>
          <tbody>
            {tableData.map((tipo) => (
              <tr key={tipo.id}>
                <td>{tipo.id}</td>
                <td>
                  {editingRow === tipo.id ? (
                    <input
                      type="text"
                      value={tipo.nombre || ''}
                      onChange={(e) => {
                        const updated = tableData.map(item =>
                          item.id === tipo.id
                            ? { ...item, nombre: e.target.value }
                            : item
                        );
                      }}
                      className="edit-input"
                    />
                  ) : (
                    <strong>{tipo.nombre}</strong>
                  )}
                </td>
                <td>
                  {editingRow === tipo.id ? (
                    <textarea
                      value={tipo.descripcion || ''}
                      onChange={(e) => {
                        const updated = tableData.map(item =>
                          item.id === tipo.id
                            ? { ...item, descripcion: e.target.value }
                            : item
                        );
                      }}
                      className="edit-input textarea"
                      rows="2"
                    />
                  ) : (
                    <span className="cell-content">
                      {tipo.descripcion || '-'}
                    </span>
                  )}
                </td>
                <td>
                  <span className={`status-badge ${tipo.activo ? 'status-active' : 'status-inactive'}`}>
                    {tipo.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td>
                  {tipo.fecha_creacion ? new Date(tipo.fecha_creacion).toLocaleDateString('es-AR') : '-'}
                </td>
                <td className="actions">
                  {editingRow === tipo.id ? (
                    <>
                      <button
                        onClick={() => handleUpdateRow(tipo.id, tipo)}
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
                        onClick={() => setEditingRow(tipo.id)}
                        className="edit-btn"
                        title="Editar"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm('¿Estás seguro de eliminar este tipo de artículo?')) {
                            handleDeleteRow(tipo.id);
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
      </div>
    </div>
  );
};

export default TipoArticuloCRUD;