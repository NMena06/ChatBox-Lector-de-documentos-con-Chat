import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import './ComprobanteCRUD.css';

const ComprobanteCRUD = ({
  tableData,
  newRow,
  setNewRow,
  handleAddRow,
  handleDeleteRow
}) => {
  const [loading, setLoading] = useState(false);
  const [tiposComprobante, setTiposComprobante] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [articulos, setArticulos] = useState([]);
  const [items, setItems] = useState([]);
  const [newItem, setNewItem] = useState({ id_articulo: '', cantidad: '', precio: '' });
const [isAccordionOpen, setIsAccordionOpen] = useState(true); 
  const safeNewRow = newRow || {
  id_tipo_comprobante: '',
  id_cliente: '',
  numero: '',
  fecha: new Date().toISOString().split('T')[0],
  total: 0,
  estado: 'pendiente',
  observaciones: ''
};


  useEffect(() => {
    loadDatosIniciales();
    if (!tableData || tableData.length === 0) {
      setIsAccordionOpen(true);
    }
  }, [tableData]);

  const loadDatosIniciales = async () => {
    try {
      setLoading(true);
      const [tiposRes, clientesRes, articulosRes] = await Promise.all([
        fetch('http://localhost:3001/api/tables/TipoComprobante'),
        fetch('http://localhost:3001/api/tables/Clientes?limit=1000'),
        fetch('http://localhost:3001/api/tables/Articulos?limit=1000')
      ]);

      const tiposData = await tiposRes.json();
      const clientesData = await clientesRes.json();
      const articulosData = await articulosRes.json();

      if (tiposData.success) setTiposComprobante(tiposData.data);
      if (clientesData.success) setClientes(clientesData.data);
      if (articulosData.success) setArticulos(articulosData.data);
    } catch (error) {
      console.error('Error cargando datos:', error);
      Swal.fire('Error', 'No se pudieron cargar los datos iniciales', 'error');
    } finally {
      setLoading(false);
    }
  };

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

  // 🔥 Calcular total automáticamente
  useEffect(() => {
    const total = items.reduce((sum, i) => sum + parseFloat(i.subtotal || 0), 0);
    setNewRow(prev => ({ ...prev, total }));
  }, [items]);

  const handleAddComprobante = async () => {
    if (!newRow.id_tipo_comprobante || !newRow.id_cliente || !newRow.numero || !newRow.fecha) {
      Swal.fire('Campos requeridos', 'Complete tipo, cliente, número y fecha', 'warning');
      return;
    }

    if (items.length === 0) {
      Swal.fire('Sin ítems', 'Debe agregar al menos un artículo al comprobante', 'warning');
      return;
    }

    setLoading(true);
    try {
      const comprobanteData = {
        id_tipo_comprobante: parseInt(newRow.id_tipo_comprobante),
        id_cliente: parseInt(newRow.id_cliente),
        numero: newRow.numero.toString(),
        fecha: newRow.fecha,
        total: parseFloat(newRow.total) || 0,
        estado: newRow.estado || 'pendiente',
        observaciones: newRow.observaciones || '',
        items
      };

      const response = await fetch('http://localhost:3001/api/comprobantes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(comprobanteData)
      });

      const data = await response.json();

      if (data.success) {
        Swal.fire('✅ Éxito', data.message || 'Comprobante creado correctamente', 'success');
        setNewRow({});
        setItems([]);
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

  const handleFieldChange = (field, value) => {
    setNewRow(prev => ({ ...prev, [field]: value }));
  };

  const renderFormField = (field, value, onChange, config = {}) => {
    const fieldConfigs = {
      id_tipo_comprobante: {
        type: 'select',
        options: tiposComprobante,
        placeholder: 'Seleccionar tipo',
        getLabel: (i) => `${i.nombre} (${i.codigo})`,
        getValue: (i) => i.id
      },
      id_cliente: {
        type: 'select',
        options: clientes,
        placeholder: 'Seleccionar cliente',
        getLabel: (i) => `${i.nombre} ${i.apellido || ''}`,
        getValue: (i) => i.id
      },
      numero: { type: 'text', placeholder: 'Número de comprobante' },
      fecha: { type: 'date', defaultValue: new Date().toISOString().split('T')[0] },
      total: { type: 'number', step: '0.01', placeholder: 'Total', disabled: true },
      estado: {
        type: 'select',
        options: [
          { id: 'pendiente', nombre: 'Pendiente' },
          { id: 'completado', nombre: 'Completado' },
          { id: 'cancelado', nombre: 'Cancelado' }
        ],
        placeholder: 'Seleccionar estado',
        getLabel: (i) => i.nombre,
        getValue: (i) => i.id
      },
      observaciones: { type: 'textarea', placeholder: 'Observaciones...', rows: 3 }
    };

    const fieldConfig = { ...fieldConfigs[field], ...config };

    switch (fieldConfig.type) {
      case 'select':
        return (
          <select
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className="form-input"
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
            rows={fieldConfig.rows}
            className="form-input textarea"
          />
        );

      case 'date':
        return (
          <input
            type="date"
            value={value || fieldConfig.defaultValue}
            onChange={(e) => onChange(e.target.value)}
            className="form-input"
          />
        );

      case 'number':
        return (
          <input
            type="number"
            step={fieldConfig.step}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className="form-input"
            placeholder={fieldConfig.placeholder}
            disabled={fieldConfig.disabled}
          />
        );

      default:
        return (
          <input
            type="text"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={fieldConfig.placeholder}
            className="form-input"
            disabled={fieldConfig.disabled}
          />
        );
    }
  };

  return (
    <div className="comprobante-crud">
      <div className={`accordion-content ${isAccordionOpen ? 'open' : ''}`}>
        <div className="add-row-form scrollable">
          <h3>📄 Nuevo Comprobante</h3>

          <div className="form-fields grid-2">
            <div>
              <label>Tipo *</label>
              {renderFormField('id_tipo_comprobante', safeNewRow.id_tipo_comprobante, handleTipoChange)}
            </div>
            <div>
              <label>Cliente *</label>
              {renderFormField('id_cliente', safeNewRow.id_cliente, (v) => handleFieldChange('id_cliente', v))}
            </div>
            <div>
              <label>Número *</label>
              {renderFormField('numero', safeNewRow.numero, (v) => handleFieldChange('numero', v), { disabled: true })}
            </div>
            <div>
              <label>Fecha *</label>
              {renderFormField('fecha', safeNewRow.fecha, (v) => handleFieldChange('fecha', v))}
            </div>
            <div>
              <label>Total</label>
              {renderFormField('total', safeNewRow.total, () => {}, { disabled: true })}
            </div>
            <div>
              <label>Estado</label>
              {renderFormField('estado', safeNewRow.estado, (v) => handleFieldChange('estado', v))}
            </div>
          </div>

          <div className="form-field-group full-width">
            <label>Observaciones</label>
            {renderFormField('observaciones', safeNewRow.observaciones, (v) => handleFieldChange('observaciones', v))}
          </div>

          {/* 🧾 Ítems */}
          <div className="items-section">
            <h4>🧾 Detalle de artículos</h4>
            <div className="item-form">
              <select
                value={newItem.id_articulo}
                onChange={(e) => setNewItem({ ...newItem, id_articulo: e.target.value })}
                className="form-input small"
              >
                <option value="">Seleccionar artículo</option>
                {articulos.map((a) => (
                  <option key={a.id} value={a.id}>{a.nombre}</option>
                ))}
              </select>
              <input
                type="number"
                placeholder="Cantidad"
                value={newItem.cantidad}
                onChange={(e) => setNewItem({ ...newItem, cantidad: e.target.value })}
                className="form-input small"
              />
              <input
                type="number"
                step="0.01"
                placeholder="Precio"
                value={newItem.precio}
                onChange={(e) => setNewItem({ ...newItem, precio: e.target.value })}
                className="form-input small"
              />
              <button
                onClick={() => {
                  if (!newItem.id_articulo || !newItem.cantidad || !newItem.precio) return;
                  const subtotal = parseFloat(newItem.cantidad) * parseFloat(newItem.precio);
                  setItems([...items, { ...newItem, subtotal }]);
                  setNewItem({ id_articulo: '', cantidad: '', precio: '' });
                }}
                className="add-item-btn"
              >
                ➕ Agregar
              </button>
            </div>

            {items.length > 0 && (
              <table className="items-table">
                <thead>
                  <tr>
                    <th>Artículo</th>
                    <th>Cantidad</th>
                    <th>Precio</th>
                    <th>Subtotal</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((i, idx) => (
                    <tr key={idx}>
                      <td>{articulos.find(a => a.id == i.id_articulo)?.nombre || '-'}</td>
                      <td>{i.cantidad}</td>
                      <td>${parseFloat(i.precio).toLocaleString('es-AR')}</td>
                      <td>${i.subtotal.toLocaleString('es-AR')}</td>
                      <td>
                        <button
                          className="delete-btn"
                          onClick={() => setItems(items.filter((_, j) => j !== idx))}
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="form-actions">
            <button onClick={handleAddComprobante} className="add-button" disabled={loading}>
              {loading ? '⏳ Creando...' : '💾 Crear Comprobante'}
            </button>
            <button
              onClick={() => {
                setIsAccordionOpen(false);
                setNewRow({});
                setItems([]);
              }}
              className="cancel-button"
            >
              ❌ Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComprobanteCRUD;
