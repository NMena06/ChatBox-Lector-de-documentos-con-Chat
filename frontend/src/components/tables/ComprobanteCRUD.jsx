import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import './ComprobanteCRUD.css';

const ComprobanteCRUD = ({ 
  tableData,
  newRow,
  setNewRow,
  handleAddRow,
  handleDeleteRow,
  isAccordionOpen,
  setIsAccordionOpen
}) => {
  const [loading, setLoading] = useState(false);
  const [tiposComprobante, setTiposComprobante] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [filters, setFilters] = useState({
    search: '',
    tipo: '',
    estado: ''
  });

  // Cargar datos iniciales
  useEffect(() => {
    loadDatosIniciales();
  }, []);

  const loadDatosIniciales = async () => {
    try {
      setLoading(true);
      
      const [tiposRes, clientesRes] = await Promise.all([
        fetch('http://localhost:3001/api/comprobantes/tipos'),
        fetch('http://localhost:3001/api/tables/Clientes?limit=1000')
      ]);

      const tiposData = await tiposRes.json();
      const clientesData = await clientesRes.json();

      if (tiposData.success) setTiposComprobante(tiposData.data);
      if (clientesData.success) setClientes(clientesData.data);
      
    } catch (error) {
      console.error('Error cargando datos:', error);
      Swal.fire('Error', 'No se pudieron cargar los datos iniciales', 'error');
    } finally {
      setLoading(false);
    }
  };

  const toggleAccordion = () => setIsAccordionOpen(prev => !prev);

  // 🔥 CORREGIDO: Manejar cambio de tipo
  const handleTipoChange = async (tipoId) => {
    const tipoIdNum = tipoId ? parseInt(tipoId) : null;
    setNewRow(prev => ({ ...prev, id_tipo_comprobante: tipoIdNum }));
    
    if (tipoIdNum) {
      try {
        const response = await fetch(`http://localhost:3001/api/comprobantes/proximo-numero/${tipoIdNum}`);
        const data = await response.json();
        
        if (data.success) {
          setNewRow(prev => ({ ...prev, numero: data.data.numero }));
        }
      } catch (error) {
        console.error('Error generando número:', error);
      }
    }
  };

  // 🔥 CORREGIDO: Manejar creación de comprobante
  const handleAddComprobante = async () => {
    // 🔥 VALIDACIÓN CORREGIDA - id_cliente es obligatorio
    if (!newRow.id_tipo_comprobante || !newRow.id_cliente || !newRow.numero || !newRow.fecha || !newRow.total) {
      Swal.fire('Campos requeridos', 'Complete tipo, cliente, número, fecha y total', 'warning');
      return;
    }

    setLoading(true);
    try {
      // 🔥 PREPARAR DATOS CORRECTAMENTE según la estructura de tu tabla
      const comprobanteData = {
        id_tipo_comprobante: parseInt(newRow.id_tipo_comprobante),
        id_cliente: parseInt(newRow.id_cliente), // 🔥 OBLIGATORIO según tu tabla
        numero: newRow.numero.toString(),
        fecha: newRow.fecha,
        total: parseFloat(newRow.total),
        estado: newRow.estado || 'pendiente', // 🔥 Usar 'pendiente' en minúsculas como el DEFAULT
        observaciones: newRow.observaciones || ''
      };

      console.log('📤 Enviando datos a comprobantes:', comprobanteData);

      // 🔥 Usar el endpoint correcto para comprobantes
      const response = await fetch('http://localhost:3001/api/comprobantes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(comprobanteData)
      });

      const data = await response.json();

      if (data.success) {
        Swal.fire('¡Éxito!', data.message || 'Comprobante creado correctamente', 'success');
        setNewRow({});
        setIsAccordionOpen(false);
        window.location.reload();
      } else {
        throw new Error(data.error || 'Error desconocido');
      }
    } catch (error) {
      console.error('Error creando comprobante:', error);
      Swal.fire('Error', error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // 🔥 CORREGIDO: Función para manejar cambios en campos
  const handleFieldChange = (field, value) => {
    setNewRow(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Renderizar campo del formulario
  const renderFormField = (field, value, onChange, config = {}) => {
    const fieldConfigs = {
      id_tipo_comprobante: {
        type: 'select',
        options: tiposComprobante,
        placeholder: 'Seleccionar tipo de comprobante',
        getLabel: (item) => `${item.nombre} (${item.codigo})`,
        getValue: (item) => item.id
      },
      id_cliente: {
        type: 'select',
        options: clientes,
        placeholder: 'Seleccionar cliente *',
        getLabel: (item) => `${item.nombre} ${item.apellido || ''}`.trim(),
        getValue: (item) => item.id,
        required: true // 🔥 Cliente es obligatorio
      },
      numero: {
        type: 'text',
        placeholder: 'Número de comprobante *'
      },
      fecha: {
        type: 'date',
        defaultValue: new Date().toISOString().split('T')[0]
      },
      total: {
        type: 'number',
        placeholder: '0.00 *',
        step: '0.01'
      },
      estado: {
        type: 'select',
        options: [
          { id: 'pendiente', nombre: 'Pendiente' },
          { id: 'completado', nombre: 'Completado' },
          { id: 'cancelado', nombre: 'Cancelado' }
        ],
        placeholder: 'Seleccionar estado',
        getLabel: (item) => item.nombre,
        getValue: (item) => item.id
      },
      observaciones: {
        type: 'textarea',
        placeholder: 'Observaciones adicionales...',
        rows: 3
      }
    };

    const fieldConfig = { ...fieldConfigs[field], ...config };

    switch (fieldConfig.type) {
      case 'select':
        return (
          <select
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className="form-input"
            disabled={fieldConfig.disabled}
            required={fieldConfig.required}
          >
            <option value="">{fieldConfig.placeholder}</option>
            {fieldConfig.options?.map((item) => (
              <option key={fieldConfig.getValue(item)} value={fieldConfig.getValue(item)}>
                {fieldConfig.getLabel(item)}
              </option>
            ))}
          </select>
        );

      case 'textarea':
        return (
          <textarea
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={fieldConfig.placeholder}
            className="form-input textarea"
            rows={fieldConfig.rows}
            disabled={fieldConfig.disabled}
          />
        );

      case 'date':
        return (
          <input
            type="date"
            value={value || fieldConfig.defaultValue}
            onChange={(e) => onChange(e.target.value)}
            className="form-input"
            disabled={fieldConfig.disabled}
            required={fieldConfig.required}
          />
        );

      case 'number':
        return (
          <input
            type="number"
            step={fieldConfig.step}
            placeholder={fieldConfig.placeholder}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className="form-input"
            disabled={fieldConfig.disabled}
            required={fieldConfig.required}
          />
        );

      default:
        return (
          <input
            type="text"
            placeholder={fieldConfig.placeholder}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className="form-input"
            disabled={fieldConfig.disabled}
            required={fieldConfig.required}
          />
        );
    }
  };

  // Formulario de creación
  const renderAddForm = () => (
    <div className="add-row-form" onClick={(e) => e.stopPropagation()}>
      <div className="form-header">
        <h3>📄 Nuevo Comprobante</h3>
        <p>Complete los datos del comprobante (* campos obligatorios)</p>
      </div>

      <div className="form-fields grid-2">
        <div className="form-field-group">
          <label className="form-label">Tipo de Comprobante *</label>
          {renderFormField('id_tipo_comprobante', newRow.id_tipo_comprobante, 
            (value) => handleTipoChange(value),
            { required: true }
          )}
        </div>

        <div className="form-field-group">
          <label className="form-label">Cliente *</label>
          {renderFormField('id_cliente', newRow.id_cliente, 
            (value) => handleFieldChange('id_cliente', value),
            { required: true }
          )}
        </div>

        <div className="form-field-group">
          <label className="form-label">Número *</label>
          {renderFormField('numero', newRow.numero, 
            (value) => handleFieldChange('numero', value),
            { required: true, disabled: true } // Número generado automáticamente
          )}
        </div>

        <div className="form-field-group">
          <label className="form-label">Fecha *</label>
          {renderFormField('fecha', newRow.fecha, 
            (value) => handleFieldChange('fecha', value),
            { required: true }
          )}
        </div>

        <div className="form-field-group">
          <label className="form-label">Total *</label>
          {renderFormField('total', newRow.total, 
            (value) => handleFieldChange('total', value),
            { required: true }
          )}
        </div>

        <div className="form-field-group">
          <label className="form-label">Estado</label>
          {renderFormField('estado', newRow.estado, 
            (value) => handleFieldChange('estado', value)
          )}
        </div>

        <div className="form-field-group full-width">
          <label className="form-label">Observaciones</label>
          {renderFormField('observaciones', newRow.observaciones, 
            (value) => handleFieldChange('observaciones', value)
          )}
        </div>
      </div>

      <div className="form-actions">
        <button 
          onClick={handleAddComprobante}
          className="add-button"
          disabled={loading || !newRow.id_tipo_comprobante || !newRow.id_cliente || !newRow.numero || !newRow.fecha || !newRow.total}
        >
          {loading ? '⏳ Creando...' : '💾 Crear Comprobante'}
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
      <div className="comprobante-crud">
        <div className="no-data">
          <div className="no-data-icon">📄</div>
          <div>No hay comprobantes registrados</div>
          <button 
            className="add-first-btn"
            onClick={() => setIsAccordionOpen(true)}
            disabled={loading}
          >
            {loading ? 'Cargando...' : '+ Crear Primer Comprobante'}
          </button>
        </div>

        <div className="add-row-accordion">
          <div className={`accordion-header ${isAccordionOpen ? 'open' : ''}`} onClick={toggleAccordion}>
            <div className="accordion-title">
              <span className="accordion-icon">📄</span>
              Nuevo Comprobante
            </div>
            <div className="accordion-arrow">{isAccordionOpen ? '▲' : '▼'}</div>
          </div>

          <div className={`accordion-content ${isAccordionOpen ? 'open' : ''}`}>
            {renderAddForm()}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="comprobante-crud">
      {/* Filtros */}
      <div className="filters-section">
        <h4>🔍 Filtros de Comprobantes</h4>
        <div className="filter-fields">
          <input
            type="text"
            placeholder="Buscar por número, cliente..."
            value={filters.search}
            onChange={(e) => setFilters({...filters, search: e.target.value})}
            className="filter-input"
          />
          
          <select 
            value={filters.tipo}
            onChange={(e) => setFilters({...filters, tipo: e.target.value})}
            className="filter-input"
          >
            <option value="">Todos los tipos</option>
            {tiposComprobante.map(tipo => (
              <option key={tipo.id} value={tipo.id}>{tipo.nombre}</option>
            ))}
          </select>
          
          <select 
            value={filters.estado}
            onChange={(e) => setFilters({...filters, estado: e.target.value})}
            className="filter-input"
          >
            <option value="">Todos los estados</option>
            <option value="pendiente">Pendiente</option>
            <option value="completado">Completado</option>
            <option value="cancelado">Cancelado</option>
          </select>
          
          <button 
            onClick={() => window.location.reload()}
            className="filter-button"
          >
            🔄 Actualizar
          </button>
        </div>
      </div>

      {/* Estadísticas rápidas */}
      <div className="comprobante-stats">
        <div className="stat-card">
          <div className="stat-title">Total Comprobantes</div>
          <div className="stat-value">{tableData.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-title">Monto Total</div>
          <div className="stat-value income">
            ${tableData.reduce((sum, comp) => sum + parseFloat(comp.total || 0), 0).toLocaleString('es-AR')}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-title">Pendientes</div>
          <div className="stat-value pending">
            {tableData.filter(comp => comp.estado === 'pendiente').length}
          </div>
        </div>
      </div>

      {/* Acordeón para nuevo comprobante */}
      <div className="add-row-accordion">
        <div className={`accordion-header ${isAccordionOpen ? 'open' : ''}`} onClick={toggleAccordion}>
          <div className="accordion-title">
            <span className="accordion-icon">📄</span>
            Nuevo Comprobante
          </div>
          <div className="accordion-arrow">{isAccordionOpen ? '▲' : '▼'}</div>
        </div>

        <div className={`accordion-content ${isAccordionOpen ? 'open' : ''}`}>
          {renderAddForm()}
        </div>
      </div>

      {/* Tabla de comprobantes */}
      <div className="table-container">
        <table className="data-table comprobante-table">
          <thead>
            <tr>
              <th>Número</th>
              <th>Tipo</th>
              <th>Fecha</th>
              <th>Cliente</th>
              <th>Total</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {tableData.map((comprobante) => (
              <tr key={comprobante.id} className={`row-${comprobante.estado?.toLowerCase()}`}>
                <td>
                  <strong>{comprobante.numero}</strong>
                </td>
                <td>
                  <span className="tipo-badge" title={comprobante.tipo_nombre}>
                    {comprobante.tipo_codigo}
                  </span>
                </td>
                <td>
                  {comprobante.fecha ? new Date(comprobante.fecha).toLocaleDateString('es-AR') : '-'}
                </td>
                <td>
                  {comprobante.cliente_nombre}
                </td>
                <td className="amount-cell">
                  ${comprobante.total ? parseFloat(comprobante.total).toLocaleString('es-AR') : '0'}
                </td>
                <td>
                  <span className={`status-badge status-${comprobante.estado?.toLowerCase()}`}>
                    {comprobante.estado}
                  </span>
                </td>
                <td className="actions">
                  <button 
                    onClick={() => {
                      if (window.confirm('¿Estás seguro de eliminar este comprobante?')) {
                        handleDeleteRow(comprobante.id);
                      }
                    }}
                    className="delete-btn"
                    title="Eliminar"
                    disabled={loading}
                  >
                    🗑️
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ComprobanteCRUD;