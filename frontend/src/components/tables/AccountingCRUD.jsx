import React, { useState, useCallback, useEffect } from 'react';
import Swal from 'sweetalert2';
import './TableCRUD.css';

const AccountingCRUD = ({ 
tableData,
  editingRow,
  setEditingRow,
  newRow,
  setNewRow,
  handleAddRow,
  handleUpdateRow,
  handleDeleteRow,
  isAccordionOpen,
  setIsAccordionOpen,
  selectedTable 
}) => {
  
  const [filters, setFilters] = useState({});
  const [loading, setLoading] = useState(false);

  const toggleAccordion = useCallback(() => {
    setIsAccordionOpen(prev => !prev);
  }, []);

  // Configuración específica por tabla - ACTUALIZADA
  const tableConfig = {
    Transacciones: {
      columns: ['id', 'tipo', 'monto', 'descripcion', 'categoria', 'fecha', 'referencia_id', 'referencia_tabla'],
      displayNames: {
        tipo: 'Tipo',
        monto: 'Monto',
        descripcion: 'Descripción',
        categoria: 'Categoría',
        fecha: 'Fecha',
        referencia_id: 'ID Referencia',
        referencia_tabla: 'Tabla Referencia'
      },
      formFields: ['tipo', 'monto', 'descripcion', 'categoria', 'fecha'],
      filterFields: ['tipo', 'fechaDesde', 'fechaHasta']
    },
    Balances: {
      columns: ['id', 'fecha', 'ingresos', 'egresos', 'balance'],
      displayNames: {
        fecha: 'Fecha',
        ingresos: 'Ingresos',
        egresos: 'Egresos',
        balance: 'Balance'
      },
      formFields: ['fecha', 'ingresos', 'egresos'],
      filterFields: ['fechaDesde', 'fechaHasta']
    },
    Comprobantes: {
      columns: ['id', 'numero', 'tipo', 'fecha', 'cliente_id', 'moto_id', 'total', 'estado', 'descripcion'],
      displayNames: {
        numero: 'Número',
        tipo: 'Tipo',
        fecha: 'Fecha',
        cliente_id: 'ID Cliente',
        moto_id: 'ID Moto',
        total: 'Total',
        estado: 'Estado',
        descripcion: 'Descripción'
      },
      formFields: ['numero', 'tipo', 'fecha', 'cliente_id', 'moto_id', 'total', 'estado', 'descripcion'],
      filterFields: ['tipo', 'estado', 'fechaDesde', 'fechaHasta']
    }
  };

  const config = tableConfig[selectedTable] || {
    columns: [],
    displayNames: {},
    formFields: [],
    filterFields: []
  };

  // Función para manejar la inserción de datos
  const handleAddAccountingRow = async () => {
    if (Object.keys(newRow).length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Campos vacíos',
        text: 'Por favor, completa al menos un campo',
        timer: 3000
      });
      return;
    }

    setLoading(true);
    try {
      let endpoint;
      let dataToSend = { ...newRow };

      // Determinar el endpoint y preparar datos según la tabla
      if (selectedTable === 'Transacciones') {
        endpoint = 'transacciones';
      } else if (selectedTable === 'Balances') {
        endpoint = 'balances';
      } else if (selectedTable === 'Comprobantes') {
        endpoint = 'comprobantes';
        // Para comprobantes, usar el endpoint estándar de tablas
        const response = await fetch(`http://localhost:3001/api/tables/Comprobantes`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newRow)
        });
        const data = await response.json();
        
        if (data.success) {
          Swal.fire({
            icon: 'success',
            title: '¡Éxito!',
            text: 'Comprobante creado correctamente',
            timer: 2000,
            showConfirmButton: false
          });
          setNewRow({});
          setIsAccordionOpen(false);
          window.location.reload();
          return;
        } else {
          throw new Error(data.error);
        }
      }

      // Para Transacciones y Balances, usar el endpoint de accounting
      if (selectedTable !== 'Comprobantes') {
        const response = await fetch(`http://localhost:3001/api/accounting/${endpoint}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(dataToSend)
        });

        const data = await response.json();

        if (data.success) {
          Swal.fire({
            icon: 'success',
            title: '¡Éxito!',
            text: data.message || 'Registro agregado correctamente',
            timer: 2000,
            showConfirmButton: false
          });
          setNewRow({});
          setIsAccordionOpen(false);
          window.location.reload();
        } else {
          throw new Error(data.error);
        }
      }
    } catch (error) {
      console.error('Error agregando registro:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: `Error al agregar registro: ${error.message}`,
        timer: 3000
      });
    } finally {
      setLoading(false);
    }
  };

  // Renderizar campo del formulario
  const renderFormField = (column, value, onChange) => {
    switch (column) {
      case 'tipo':
        if (selectedTable === 'Transacciones') {
          return (
            <select 
              value={value} 
              onChange={(e) => onChange(e.target.value)}
              className="form-input"
            >
              <option value="">Seleccionar tipo</option>
              <option value="ingreso">Ingreso</option>
              <option value="egreso">Egreso</option>
              <option value="venta">Venta</option>
              <option value="compra">Compra</option>
            </select>
          );
        } else if (selectedTable === 'Comprobantes') {
          return (
            <select 
              value={value} 
              onChange={(e) => onChange(e.target.value)}
              className="form-input"
            >
              <option value="">Seleccionar tipo</option>
              <option value="Factura A">Factura A</option>
              <option value="Factura B">Factura B</option>
              <option value="Ticket">Ticket</option>
              <option value="Recibo">Recibo</option>
              <option value="Nota de Crédito">Nota de Crédito</option>
              <option value="Nota de Débito">Nota de Débito</option>
            </select>
          );
        }
        break;
      
      case 'estado':
        return (
          <select 
            value={value} 
            onChange={(e) => onChange(e.target.value)}
            className="form-input"
          >
            <option value="">Seleccionar estado</option>
            <option value="Pendiente">Pendiente</option>
            <option value="Completado">Completado</option>
            <option value="Cancelado">Cancelado</option>
            <option value="Anulado">Anulado</option>
          </select>
        );
      
      case 'fecha':
        return (
          <input
            type="date"
            value={value || new Date().toISOString().split('T')[0]}
            onChange={(e) => onChange(e.target.value)}
            className="form-input"
          />
        );
      
      case 'monto':
      case 'ingresos':
      case 'egresos':
      case 'balance':
      case 'total':
        return (
          <input
            type="number"
            step="0.01"
            placeholder="0.00"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="form-input"
          />
        );
      
      case 'descripcion':
        return (
          <textarea
            placeholder="Descripción..."
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="form-input textarea"
            rows="3"
          />
        );
      
      case 'cliente_id':
      case 'moto_id':
      case 'referencia_id':
        return (
          <input
            type="number"
            placeholder={`ID ${column.replace('_id', '')}`}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="form-input"
          />
        );
      
      case 'numero':
        return (
          <input
            type="text"
            placeholder="Número de comprobante"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="form-input"
          />
        );
      
      default:
        return (
          <input
            type="text"
            placeholder={config.displayNames[column] || column}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="form-input"
          />
        );
    }
  };

  // Renderizar el formulario de creación
  const renderAddForm = () => (
    <div
  className="add-row-form"
  onClick={(e) => e.stopPropagation()}
  onKeyDown={(e) => e.stopPropagation()}
>

      <div className="form-fields">
        {config.formFields.map(column => (
          <div key={column} className="form-field-group">
            <label className="form-label">
              {config.displayNames[column] || column}:
              {['monto', 'total', 'ingresos', 'egresos', 'balance'].includes(column) && ' (ARS)'}
            </label>
            {renderFormField(column, newRow[column] || '', (value) => 
              setNewRow({ ...newRow, [column]: value })
            )}
          </div>
        ))}
      </div>
      <div className="form-actions">
        <button 
          onClick={handleAddAccountingRow}
          className="add-button"
          disabled={loading || Object.keys(newRow).length === 0}
        >
          {loading ? 'Guardando...' : '💾 Guardar Registro'}
        </button>
        <button 
          onClick={() => {
            setIsAccordionOpen(false);
            setNewRow({});
          }}
          className="cancel-button"
          disabled={loading}
        >
          ❌ Cancelar
        </button>
      </div>
    </div>
  );

  if (!tableData || tableData.length === 0) {
    return (
      <div className="accounting-crud">
        {/* <div className="no-data">
          <div className="no-data-icon">💼</div>
          <div>No hay datos en {selectedTable}</div>
          <button 
            className="add-first-btn"
            onClick={() => setIsAccordionOpen(true)}
            disabled={loading}
          >
            {loading ? 'Cargando...' : '+ Agregar Primer Registro'}
          </button>
        </div> */}

        {/* Acordeón para agregar nuevo registro */}
        <div className="add-row-accordion">
          <div 
            className={`accordion-header ${isAccordionOpen ? 'open' : ''}`}
            onClick={toggleAccordion}
          >
            <div className="accordion-title">
              <span className="accordion-icon">💾</span>
              Agregar Nuevo Registro en {selectedTable}
            </div>
            <div className="accordion-arrow">
              {isAccordionOpen ? '▲' : '▼'}
            </div>
          </div>

          <div className={`accordion-content ${isAccordionOpen ? 'open' : ''}`}>
            {renderAddForm()}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="accounting-crud">
      {/* Filtros */}
      <div className="filters-section">
        <h4>🔍 Filtros</h4>
        <div className="filter-fields">
          {config.filterFields.includes('tipo') && (
            <select 
              value={filters.tipo || ''}
              onChange={(e) => setFilters({...filters, tipo: e.target.value})}
              className="filter-input"
            >
              <option value="">Todos los tipos</option>
              {selectedTable === 'Transacciones' ? (
                <>
                  <option value="ingreso">Ingreso</option>
                  <option value="egreso">Egreso</option>
                  <option value="venta">Venta</option>
                  <option value="compra">Compra</option>
                </>
              ) : (
                <>
                  <option value="Factura A">Factura A</option>
                  <option value="Factura B">Factura B</option>
                  <option value="Ticket">Ticket</option>
                  <option value="Recibo">Recibo</option>
                </>
              )}
            </select>
          )}
          
          {config.filterFields.includes('estado') && (
            <select 
              value={filters.estado || ''}
              onChange={(e) => setFilters({...filters, estado: e.target.value})}
              className="filter-input"
            >
              <option value="">Todos los estados</option>
              <option value="Pendiente">Pendiente</option>
              <option value="Completado">Completado</option>
              <option value="Cancelado">Cancelado</option>
            </select>
          )}
          
          <input
            type="date"
            value={filters.fechaDesde || ''}
            onChange={(e) => setFilters({...filters, fechaDesde: e.target.value})}
            className="filter-input"
            placeholder="Fecha desde"
          />
          
          <input
            type="date"
            value={filters.fechaHasta || ''}
            onChange={(e) => setFilters({...filters, fechaHasta: e.target.value})}
            className="filter-input"
            placeholder="Fecha hasta"
          />
          
          <button 
            onClick={() => window.location.reload()}
            className="filter-button"
            disabled={loading}
          >
            {loading ? 'Aplicando...' : '🔍 Aplicar Filtros'}
          </button>
          
          <button 
            onClick={() => setFilters({})}
            className="clear-filters-button"
          >
            🗑️ Limpiar
          </button>
        </div>
      </div>

      {/* Estadísticas rápidas */}
      {selectedTable === 'Transacciones' && (
        <div className="accounting-stats">
          <div className="stat-card">
            <div className="stat-title">Total Ingresos</div>
            <div className="stat-value income">
              ${tableData.filter(t => t.tipo === 'ingreso').reduce((sum, t) => sum + parseFloat(t.monto), 0).toLocaleString('es-AR')}
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-title">Total Egresos</div>
            <div className="stat-value expense">
              ${tableData.filter(t => t.tipo === 'egreso').reduce((sum, t) => sum + parseFloat(t.monto), 0).toLocaleString('es-AR')}
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-title">Balance</div>
            <div className="stat-value balance">
              ${(tableData.filter(t => t.tipo === 'ingreso').reduce((sum, t) => sum + parseFloat(t.monto), 0) - 
                 tableData.filter(t => t.tipo === 'egreso').reduce((sum, t) => sum + parseFloat(t.monto), 0)).toLocaleString('es-AR')}
            </div>
          </div>
        </div>
      )}

      {selectedTable === 'Comprobantes' && (
        <div className="accounting-stats">
          <div className="stat-card">
            <div className="stat-title">Total Comprobantes</div>
            <div className="stat-value">
              {tableData.length}
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-title">Total Ventas</div>
            <div className="stat-value income">
              ${tableData.filter(c => c.estado === 'Completado').reduce((sum, c) => sum + parseFloat(c.total), 0).toLocaleString('es-AR')}
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-title">Pendientes</div>
            <div className="stat-value pending">
              {tableData.filter(c => c.estado === 'Pendiente').length}
            </div>
          </div>
        </div>
      )}

      {/* Acordeón para agregar nuevo registro */}
      <div className="add-row-accordion">
        <div 
          className={`accordion-header ${isAccordionOpen ? 'open' : ''}`}
          onClick={toggleAccordion}
        >
          <div className="accordion-title">
            <span className="accordion-icon">💾</span>
            Agregar Nuevo {selectedTable}
          </div>
          <div className="accordion-arrow">
            {isAccordionOpen ? '▲' : '▼'}
          </div>
        </div>

        <div className={`accordion-content ${isAccordionOpen ? 'open' : ''}`}>
          {renderAddForm()}
        </div>
      </div>

      {/* Tabla de datos */}
      <div className={`table-container ${isAccordionOpen ? 'behind' : ''}`}>

        <table className="data-table accounting-table">
          <thead>
            <tr>
              {config.columns.map(key => (
                <th key={key} title={key}>
                  {config.displayNames[key] || key.toUpperCase()}
                </th>
              ))}
              <th>ACCIONES</th>
            </tr>
          </thead>
          <tbody>
            {tableData.map((row, index) => (
              <tr key={row.id || index} className={getRowClass(row, selectedTable)}>
                {config.columns.map(column => (
                  <td key={column} title={row[column]}>
                    <span className="cell-content">
                      {formatCellValue(column, row[column])}
                    </span>
                  </td>
                ))}
                <td className="actions">
                  <button 
                    onClick={() => {
                      if (window.confirm('¿Estás seguro de eliminar este registro?')) {
                        handleDeleteAccountingRow(row.id);
                      }
                    }}
                    className="delete-btn"
                    title="Eliminar"
                    disabled={loading}
                  >
                    {loading ? '⏳' : '🗑️'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* {config.columns.length > 6 && (
          <div className="scroll-hint">← Desplázate →</div>
        )} */}
      </div>
    </div>
  );

  // Función para formatear valores de celda
  function formatCellValue(column, value) {
    if (value === null || value === undefined || value === '') return '-';
    
    if (column === 'fecha' && value) {
      return new Date(value).toLocaleDateString('es-AR');
    }
    
    if ((column === 'monto' || column === 'ingresos' || column === 'egresos' || 
         column === 'balance' || column === 'total') && !isNaN(value)) {
      return `$${parseFloat(value).toLocaleString('es-AR')}`;
    }
    
    return value;
  }

  // Función para clases de fila
  function getRowClass(row, tableName) {
    if (tableName === 'Transacciones') {
      return row.tipo === 'ingreso' ? 'row-income' : 'row-expense';
    }
    if (tableName === 'Comprobantes') {
      return row.estado === 'Pendiente' ? 'row-pending' : 
             row.estado === 'Completado' ? 'row-completed' : 'row-cancelled';
    }
    return '';
  }

  // Función para eliminar registros
  async function handleDeleteAccountingRow(id) {
    const result = await Swal.fire({
      title: '¿Estás seguro?',
      text: "¡No podrás revertir esta acción!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (!result.isConfirmed) return;

    setLoading(true);
    try {
      let endpoint;
      if (selectedTable === 'Transacciones') {
        endpoint = `http://localhost:3001/api/accounting/transacciones/${id}`;
      } else if (selectedTable === 'Balances') {
        endpoint = `http://localhost:3001/api/accounting/balances/${id}`;
      } else if (selectedTable === 'Comprobantes') {
        endpoint = `http://localhost:3001/api/tables/Comprobantes/${id}`;
      }

      const response = await fetch(endpoint, { method: 'DELETE' });
      const data = await response.json();

      if (data.success) {
        Swal.fire({
          icon: 'success',
          title: '¡Eliminado!',
          text: data.message || 'Registro eliminado correctamente',
          timer: 2000,
          showConfirmButton: false
        });
        window.location.reload();
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Error eliminando registro:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: `Error al eliminar registro: ${error.message}`,
        timer: 3000
      });
    } finally {
      setLoading(false);
    }
  }
};

export default AccountingCRUD;