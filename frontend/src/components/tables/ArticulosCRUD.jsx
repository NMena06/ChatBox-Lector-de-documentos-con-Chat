import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';

const ArticulosCRUD = ({
  tableData,
  setTableData,
  newRow,
  setNewRow,
  handleAddRow,
  handleDeleteRow,
  isAccordionOpen,
  setIsAccordionOpen,
  handleUpdateRow,
  editingRow,
  setEditingRow
}) => {
  const [tiposArticulo, setTiposArticulo] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filteredData, setFilteredData] = useState([]);
  const [filters, setFilters] = useState({
    search: '',
    tipo: '',
    categoria: '',
    stock: 'all', // all, inStock, lowStock, outOfStock
    activo: 'all' // all, active, inactive
  });

  useEffect(() => {
    loadTiposArticulo();
  }, []);

  // 🔥 Aplicar filtros cuando cambien los filtros o los datos
  useEffect(() => {
    applyFilters();
  }, [filters, tableData]);

  const loadTiposArticulo = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/articulos/tipos');
      const data = await response.json();
      
      if (data.success) {
        setTiposArticulo(data.data);
      }
    } catch (error) {
      console.error('Error cargando tipos:', error);
    }
  };

  // 🔥 FUNCIÓN PARA APLICAR FILTROS
  const applyFilters = () => {
    if (!tableData) return;

    let filtered = [...tableData];

    // Filtro de búsqueda general
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(articulo =>
        articulo.nombre?.toLowerCase().includes(searchLower) ||
        articulo.marca?.toLowerCase().includes(searchLower) ||
        articulo.modelo?.toLowerCase().includes(searchLower) ||
        articulo.descripcion?.toLowerCase().includes(searchLower) ||
        articulo.categoria?.toLowerCase().includes(searchLower)
      );
    }

    // Filtro por tipo de artículo
    if (filters.tipo) {
      filtered = filtered.filter(articulo => 
        articulo.id_tipo_articulo?.toString() === filters.tipo
      );
    }

    // Filtro por categoría
    if (filters.categoria) {
      filtered = filtered.filter(articulo =>
        articulo.categoria?.toLowerCase().includes(filters.categoria.toLowerCase())
      );
    }

    // Filtro por stock
    if (filters.stock !== 'all') {
      switch (filters.stock) {
        case 'inStock':
          filtered = filtered.filter(articulo => articulo.stock > 0);
          break;
        case 'lowStock':
          filtered = filtered.filter(articulo => 
            articulo.stock > 0 && articulo.stock <= (articulo.stock_minimo || 5)
          );
          break;
        case 'outOfStock':
          filtered = filtered.filter(articulo => articulo.stock <= 0);
          break;
      }
    }

    // Filtro por estado activo/inactivo
    if (filters.activo !== 'all') {
      const isActive = filters.activo === 'active';
      filtered = filtered.filter(articulo => articulo.activo === isActive);
    }

    setFilteredData(filtered);
  };

  // 🔥 MANEJAR CAMBIOS EN LOS FILTROS
  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // 🔥 LIMPIAR TODOS LOS FILTROS
  const clearFilters = () => {
    setFilters({
      search: '',
      tipo: '',
      categoria: '',
      stock: 'all',
      activo: 'all'
    });
  };

  const toggleAccordion = () => setIsAccordionOpen(prev => !prev);

  // 🔥 OBTENER CATEGORÍAS ÚNICAS PARA EL FILTRO
  const getUniqueCategories = () => {
    if (!tableData) return [];
    const categories = tableData
      .map(articulo => articulo.categoria)
      .filter(Boolean)
      .filter((categoria, index, self) => self.indexOf(categoria) === index);
    return categories.sort();
  };

  const handleAddArticulo = async () => {
    if (!newRow.id_tipo_articulo || !newRow.nombre || !newRow.precio_venta) {
      Swal.fire('Campos requeridos', 'Complete tipo, nombre y precio de venta', 'warning');
      return;
    }

    setLoading(true);
    try {
      const articuloData = {
        ...newRow,
        id_tipo_articulo: parseInt(newRow.id_tipo_articulo),
        precio_compra: parseFloat(newRow.precio_compra || 0),
        precio_venta: parseFloat(newRow.precio_venta),
        stock: parseInt(newRow.stock || 0),
        stock_minimo: parseInt(newRow.stock_minimo || 0),
        activo: true
      };

      const response = await fetch('http://localhost:3001/api/tables/Articulos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(articuloData)
      });

      const data = await response.json();

      if (data.success) {
        Swal.fire('¡Éxito!', 'Artículo creado correctamente', 'success');
        setNewRow({});
        setIsAccordionOpen(false);
        window.location.reload();
      } else {
        throw new Error(data.error || 'Error desconocido');
      }
    } catch (error) {
      console.error('Error creando artículo:', error);
      Swal.fire('Error', error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleFieldChange = (field, value) => {
    setNewRow(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const renderFormField = (field, value, config = {}) => {
    const fieldConfigs = {
      id_tipo_articulo: {
        type: 'select',
        options: tiposArticulo,
        placeholder: 'Seleccionar tipo de artículo',
        getLabel: (item) => `${item.nombre}${item.descripcion ? ` - ${item.descripcion}` : ''}`,
        getValue: (item) => item.id.toString()
      },
      nombre: {
        type: 'text',
        placeholder: 'Nombre del artículo*'
      },
      marca: {
        type: 'text',
        placeholder: 'Marca'
      },
      modelo: {
        type: 'text',
        placeholder: 'Modelo'
      },
      precio_compra: {
        type: 'number',
        placeholder: '0.00',
        step: '0.01'
      },
      precio_venta: {
        type: 'number',
        placeholder: '0.00*',
        step: '0.01'
      },
      stock: {
        type: 'number',
        placeholder: '0',
        min: '0'
      },
      stock_minimo: {
        type: 'number',
        placeholder: '0',
        min: '0'
      },
      categoria: {
        type: 'text',
        placeholder: 'Categoría'
      },
      descripcion: {
        type: 'textarea',
        placeholder: 'Descripción del artículo...',
        rows: 3
      }
    };

    const fieldConfig = { ...fieldConfigs[field], ...config };

    switch (fieldConfig.type) {
      case 'select':
        return (
          <select
            value={value || ''}
            onChange={(e) => handleFieldChange(field, e.target.value)}
            className="form-input"
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
            onChange={(e) => handleFieldChange(field, e.target.value)}
            placeholder={fieldConfig.placeholder}
            className="form-input textarea"
            rows={fieldConfig.rows}
          />
        );

      case 'number':
        return (
          <input
            type="number"
            step={fieldConfig.step}
            min={fieldConfig.min}
            placeholder={fieldConfig.placeholder}
            value={value || ''}
            onChange={(e) => handleFieldChange(field, e.target.value)}
            className="form-input"
          />
        );

      default:
        return (
          <input
            type="text"
            placeholder={fieldConfig.placeholder}
            value={value || ''}
            onChange={(e) => handleFieldChange(field, e.target.value)}
            className="form-input"
            required={fieldConfig.required}
          />
        );
    }
  };

  const renderAddForm = () => (
    <div className="add-row-form" onClick={(e) => e.stopPropagation()}>
      <div className="form-header">
        <h3>📦 Nuevo Artículo</h3>
        <p>Complete los datos del artículo (* campos obligatorios)</p>
      </div>

      <div className="form-fields grid-2">
        <div className="form-field-group">
          <label className="form-label">Tipo de Artículo *</label>
          {renderFormField('id_tipo_articulo', newRow.id_tipo_articulo, { required: true })}
        </div>

        <div className="form-field-group">
          <label className="form-label">Nombre *</label>
          {renderFormField('nombre', newRow.nombre, { required: true })}
        </div>

        <div className="form-field-group">
          <label className="form-label">Marca</label>
          {renderFormField('marca', newRow.marca)}
        </div>

        <div className="form-field-group">
          <label className="form-label">Modelo</label>
          {renderFormField('modelo', newRow.modelo)}
        </div>

        <div className="form-field-group">
          <label className="form-label">Precio Compra</label>
          {renderFormField('precio_compra', newRow.precio_compra)}
        </div>

        <div className="form-field-group">
          <label className="form-label">Precio Venta *</label>
          {renderFormField('precio_venta', newRow.precio_venta, { required: true })}
        </div>

        <div className="form-field-group">
          <label className="form-label">Stock</label>
          {renderFormField('stock', newRow.stock)}
        </div>

        <div className="form-field-group">
          <label className="form-label">Stock Mínimo</label>
          {renderFormField('stock_minimo', newRow.stock_minimo)}
        </div>

        <div className="form-field-group">
          <label className="form-label">Categoría</label>
          {renderFormField('categoria', newRow.categoria)}
        </div>

        <div className="form-field-group full-width">
          <label className="form-label">Descripción</label>
          {renderFormField('descripcion', newRow.descripcion)}
        </div>
      </div>

      <div className="form-actions">
        <button 
          onClick={handleAddArticulo}
          className="add-button"
          disabled={loading || !newRow.id_tipo_articulo || !newRow.nombre || !newRow.precio_venta}
        >
          {loading ? '⏳ Creando...' : '📦 Crear Artículo'}
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

  const handleEditRow = (id) => {
    setEditingRow(id);
  };

  const handleSaveEdit = async (id, rowData) => {
    try {
      const updateData = {
        ...rowData,
        id_tipo_articulo: parseInt(rowData.id_tipo_articulo),
        precio_compra: parseFloat(rowData.precio_compra || 0),
        precio_venta: parseFloat(rowData.precio_venta || 0),
        stock: parseInt(rowData.stock || 0),
        stock_minimo: parseInt(rowData.stock_minimo || 0)
      };

      const response = await fetch(`http://localhost:3001/api/tables/Articulos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      });

      const data = await response.json();

      if (data.success) {
        Swal.fire('¡Éxito!', 'Artículo actualizado correctamente', 'success');
        setEditingRow(null);
        window.location.reload();
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Error actualizando artículo:', error);
      Swal.fire('Error', error.message, 'error');
    }
  };

  const handleEditFieldChange = (id, field, value) => {
    setTableData(prevData => 
      prevData.map(item =>
        item.id === id 
          ? { ...item, [field]: value }
          : item
      )
    );
  };

  const renderEditableField = (articulo, column, value) => {
    if (editingRow === articulo.id) {
      switch (column) {
        case 'id_tipo_articulo':
          return (
            <select
              value={value || ''}
              onChange={(e) => handleEditFieldChange(articulo.id, column, e.target.value)}
              className="edit-input"
            >
              <option value="">Seleccionar tipo</option>
              {tiposArticulo.map(tipo => (
                <option key={tipo.id} value={tipo.id.toString()}>
                  {tipo.nombre}
                </option>
              ))}
            </select>
          );

        case 'precio_compra':
        case 'precio_venta':
          return (
            <input
              type="number"
              step="0.01"
              value={value || ''}
              onChange={(e) => handleEditFieldChange(articulo.id, column, e.target.value)}
              className="edit-input"
            />
          );

        case 'stock':
        case 'stock_minimo':
          return (
            <input
              type="number"
              value={value || ''}
              onChange={(e) => handleEditFieldChange(articulo.id, column, e.target.value)}
              className="edit-input"
            />
          );

        case 'descripcion':
          return (
            <textarea
              value={value || ''}
              onChange={(e) => handleEditFieldChange(articulo.id, column, e.target.value)}
              className="edit-input textarea"
              rows="2"
            />
          );

        default:
          return (
            <input
              type="text"
              value={value || ''}
              onChange={(e) => handleEditFieldChange(articulo.id, column, e.target.value)}
              className="edit-input"
            />
          );
      }
    } else {
      if (column === 'id_tipo_articulo') {
        const tipoNombre = tiposArticulo.find(t => t.id === articulo.id_tipo_articulo)?.nombre || 'N/A';
        return <span className="cell-content">{tipoNombre}</span>;
      }
      
      if (column === 'precio_venta' && articulo.precio_venta) {
        return (
          <span className="cell-content">
            ${parseFloat(articulo.precio_venta).toLocaleString('es-AR')}
          </span>
        );
      }

      return <span className="cell-content">{value || '-'}</span>;
    }
  };

  // 🔥 RENDERIZAR SECCIÓN DE FILTROS
  const renderFilters = () => (
    <div className="filters-section">
      <div className="filters-header">
        <h4>🔍 Filtros de Artículos</h4>
        <button 
          onClick={clearFilters}
          className="clear-filters-btn"
          disabled={Object.values(filters).every(val => val === '' || val === 'all')}
        >
          🗑️ Limpiar Filtros
        </button>
      </div>

      <div className="filters-grid">
        {/* Búsqueda general */}
        <div className="filter-group">
          <label>🔍 Búsqueda</label>
          <input
            type="text"
            placeholder="Buscar por nombre, marca, modelo..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="filter-input"
          />
        </div>

        {/* Filtro por tipo */}
        <div className="filter-group">
          <label>🏷️ Tipo</label>
          <select
            value={filters.tipo}
            onChange={(e) => handleFilterChange('tipo', e.target.value)}
            className="filter-input"
          >
            <option value="">Todos los tipos</option>
            {tiposArticulo.map(tipo => (
              <option key={tipo.id} value={tipo.id.toString()}>
                {tipo.nombre}
              </option>
            ))}
          </select>
        </div>

        {/* Filtro por categoría */}
        <div className="filter-group">
          <label>📂 Categoría</label>
          <select
            value={filters.categoria}
            onChange={(e) => handleFilterChange('categoria', e.target.value)}
            className="filter-input"
          >
            <option value="">Todas las categorías</option>
            {getUniqueCategories().map(categoria => (
              <option key={categoria} value={categoria}>
                {categoria}
              </option>
            ))}
          </select>
        </div>

        {/* Filtro por stock */}
        <div className="filter-group">
          <label>📦 Stock</label>
          <select
            value={filters.stock}
            onChange={(e) => handleFilterChange('stock', e.target.value)}
            className="filter-input"
          >
            <option value="all">Todos</option>
            <option value="inStock">En stock</option>
            <option value="lowStock">Stock bajo</option>
            <option value="outOfStock">Sin stock</option>
          </select>
        </div>

        {/* Filtro por estado */}
        <div className="filter-group">
          <label>⚡ Estado</label>
          <select
            value={filters.activo}
            onChange={(e) => handleFilterChange('activo', e.target.value)}
            className="filter-input"
          >
            <option value="all">Todos</option>
            <option value="active">Activos</option>
            <option value="inactive">Inactivos</option>
          </select>
        </div>
      </div>

      {/* Contador de resultados */}
      <div className="results-counter">
        <span className="results-text">
          Mostrando {filteredData.length} de {tableData?.length || 0} artículos
        </span>
        {Object.values(filters).some(val => val !== '' && val !== 'all') && (
          <span className="filters-active">🔍 Filtros activos</span>
        )}
      </div>
    </div>
  );

  if (!tableData || tableData.length === 0) {
    return (
      <div className="articulos-crud">
        <div className="no-data">
          <div className="no-data-icon">📦</div>
          <div>No hay artículos registrados</div>
          <button 
            className="add-first-btn"
            onClick={() => setIsAccordionOpen(true)}
            disabled={loading}
          >
            {loading ? 'Cargando...' : '+ Crear Primer Artículo'}
          </button>
        </div>

        <div className="add-row-accordion">
          <div className={`accordion-header ${isAccordionOpen ? 'open' : ''}`} onClick={toggleAccordion}>
            <div className="accordion-title">
              <span className="accordion-icon">📦</span>
              Nuevo Artículo
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
    <div className="articulos-crud">
      {/* 🔥 SECCIÓN DE FILTROS */}
      {renderFilters()}

      {/* Acordeón para nuevo artículo */}
      <div className="add-row-accordion">
        <div className={`accordion-header ${isAccordionOpen ? 'open' : ''}`} onClick={toggleAccordion}>
          <div className="accordion-title">
            <span className="accordion-icon">📦</span>
            Nuevo Artículo
          </div>
          <div className="accordion-arrow">{isAccordionOpen ? '▲' : '▼'}</div>
        </div>

        <div className={`accordion-content ${isAccordionOpen ? 'open' : ''}`}>
          {renderAddForm()}
        </div>
      </div>

      {/* Tabla de artículos */}
      <div className="table-container">
        <table className="data-table articulos-table">
          <thead>
            <tr>
              <th>Tipo</th>
              <th>Nombre</th>
              <th>Marca</th>
              <th>Modelo</th>
              <th>Precio Venta</th>
              <th>Stock</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map((articulo) => (
              <tr key={articulo.id} className={articulo.stock <= 0 ? 'row-out-of-stock' : ''}>
                <td>
                  {renderEditableField(articulo, 'id_tipo_articulo', articulo.id_tipo_articulo)}
                </td>
                <td>
                  {renderEditableField(articulo, 'nombre', articulo.nombre)}
                </td>
                <td>
                  {renderEditableField(articulo, 'marca', articulo.marca)}
                </td>
                <td>
                  {renderEditableField(articulo, 'modelo', articulo.modelo)}
                </td>
                <td className="amount-cell">
                  {renderEditableField(articulo, 'precio_venta', articulo.precio_venta)}
                </td>
                <td>
                  {renderEditableField(articulo, 'stock', articulo.stock)}
                  {editingRow !== articulo.id && articulo.stock_minimo > 0 && (
                    <div className="stock-min">min: {articulo.stock_minimo}</div>
                  )}
                </td>
                <td>
                  <span className={`status-badge ${articulo.activo ? 'status-active' : 'status-inactive'}`}>
                    {articulo.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="actions">
                  {editingRow === articulo.id ? (
                    <>
                      <button
                        onClick={() => handleSaveEdit(articulo.id, articulo)}
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
                        onClick={() => handleEditRow(articulo.id)}
                        className="edit-btn"
                        title="Editar"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm('¿Estás seguro de eliminar este artículo?')) {
                            handleDeleteRow(articulo.id);
                          }
                        }}
                        className="delete-btn"
                        title="Eliminar"
                        disabled={loading}
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

        {/* Mensaje si no hay resultados */}
        {filteredData.length === 0 && (
          <div className="no-results">
            <div className="no-results-icon">🔍</div>
            <div>No se encontraron artículos con los filtros aplicados</div>
            <button onClick={clearFilters} className="clear-filters-btn">
              Limpiar filtros
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ArticulosCRUD;