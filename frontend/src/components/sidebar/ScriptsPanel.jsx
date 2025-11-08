import React, { useState, useEffect } from 'react';
import './ScriptsPanel.css';

const ScriptsPanel = ({ usePrompt, selectedTable }) => {
  const [activeCategory, setActiveCategory] = useState('consultas');
  const [availableScripts, setAvailableScripts] = useState({});

  // Cargar scripts disponibles
  useEffect(() => {
    loadAvailableScripts();
  }, []);

  const loadAvailableScripts = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/scripts');
      const data = await response.json();
      if (data.success) {
        setAvailableScripts(data.scripts || {});
      }
    } catch (error) {
      console.error('Error cargando scripts:', error);
    }
  };

  // Scripts predefinidos organizados por categoría
  const scriptCategories = {
    consultas: {
      title: 'Consultas',
      icon: '🔍',
      scripts: [
        {
          name: 'Ver todos los registros',
          description: 'Mostrar todos los datos de una tabla',
          template: 'mostrar {tabla}',
          example: 'mostrar clientes'
        },
        {
          name: 'Buscar por nombre',
          description: 'Buscar registros por texto',
          template: 'buscar {tabla} {texto}',
          example: 'buscar clientes Juan'
        },
        {
          name: 'Últimos registros',
          description: 'Ver los registros más recientes',
          template: 'últimos {numero} {tabla}',
          example: 'últimos 5 clientes'
        },
        {
          name: 'Contar registros',
          description: 'Obtener total de registros',
          template: 'contar {tabla}',
          example: 'contar motos'
        },
        {
          name: 'Buscar con filtro',
          description: 'Buscar con condición específica',
          template: 'buscar {tabla} donde {condición}',
          example: 'buscar motos donde marca = "Honda"'
        }
      ]
    },
    inserciones: {
      title: 'Insertar',
      icon: '➕',
      scripts: [
        {
          name: 'Agregar cliente',
          description: 'Insertar nuevo cliente',
          template: 'agregar cliente {nombre} {apellido} {telefono} {email}',
          example: 'agregar cliente María Gonzalez 1155667788 maria@email.com'
        },
        {
          name: 'Agregar moto',
          description: 'Insertar nueva moto',
          template: 'agregar moto {marca} {modelo} {año} {precio} {color}',
          example: 'agregar moto Yamaha MT-07 2024 850000 Negro'
        },
        {
          name: 'Agregar producto',
          description: 'Insertar nuevo producto',
          template: 'agregar producto {nombre} {categoria} {precio} {stock}',
          example: 'agregar producto Casco Integral Seguridad 120000 10'
        },
        {
          name: 'Agregar venta',
          description: 'Registrar nueva venta',
          template: 'agregar venta {cliente_id} {producto_id} {cantidad} {total}',
          example: 'agregar venta 15 23 1 150000'
        }
      ]
    },
    actualizaciones: {
      title: 'Actualizar',
      icon: '✏️',
      scripts: [
        {
          name: 'Actualizar precio',
          description: 'Modificar precio de producto',
          template: 'actualizar precio {tabla} {id} {nuevo_precio}',
          example: 'actualizar precio motos 5 1200000'
        },
        {
          name: 'Actualizar stock',
          description: 'Modificar cantidad en stock',
          template: 'actualizar stock {producto} {nuevo_stock}',
          example: 'actualizar stock casco xt-500 25'
        },
        {
          name: 'Actualizar teléfono',
          description: 'Cambiar teléfono de cliente',
          template: 'actualizar telefono cliente {id} {nuevo_telefono}',
          example: 'actualizar telefono cliente 8 1199887766'
        },
        {
          name: 'Actualizar estado',
          description: 'Cambiar estado de registro',
          template: 'actualizar estado {tabla} {id} {nuevo_estado}',
          example: 'actualizar estado motos 12 Vendida'
        }
      ]
    },
    eliminaciones: {
      title: 'Eliminar',
      icon: '🗑️',
      scripts: [
        {
          name: 'Eliminar por ID',
          description: 'Borrar registro específico',
          template: 'eliminar {tabla} id {id}',
          example: 'eliminar clientes id 15'
        },
        {
          name: 'Eliminar por condición',
          description: 'Borrar con filtro',
          template: 'eliminar {tabla} donde {condición}',
          example: 'eliminar productos donde stock = 0'
        },
        {
          name: 'Limpiar tabla',
          description: 'Eliminar todos los registros',
          template: 'eliminar todos {tabla}',
          example: 'eliminar todos logs'
        }
      ]
    },
    busquedas: {
      title: 'Búsqueda Web',
      icon: '🌐',
      scripts: [
        {
          name: 'Buscar en MercadoLibre',
          description: 'Buscar precios reales',
          template: 'buscar precio {producto} en mercadolibre',
          example: 'buscar precio honda wave 110 en mercadolibre'
        },
        {
          name: 'Cotizar moto',
          description: 'Buscar precios de motos',
          template: 'cotizar {marca} {modelo} {año}',
          example: 'cotizar yamaha yzf r6 2023'
        },
        {
          name: 'Buscar accesorios',
          description: 'Buscar precios de accesorios',
          template: 'buscar {accesorio} precio mercado',
          example: 'buscar casco integral precio mercado'
        },
        {
          name: 'Comparar precios',
          description: 'Comparar en el mercado',
          template: 'comparar precio {producto}',
          example: 'comparar precio yamaha mt-03'
        }
      ]
    },
    avanzados: {
      title: 'Avanzados',
      icon: '⚡',
      scripts: [
        {
          name: 'Script personalizado',
          description: 'Ejecutar SQL directo',
          template: 'ejecutar: {sql_query}',
          example: 'ejecutar: SELECT * FROM clientes WHERE activo = 1'
        },
        {
          name: 'Resumen de ventas',
          description: 'Estadísticas de ventas',
          template: 'resumen ventas {mes}',
          example: 'resumen ventas enero'
        },
        {
          name: 'Top productos',
          description: 'Productos más vendidos',
          template: 'top productos vendidos',
          example: 'top productos vendidos'
        },
        {
          name: 'Clientes frecuentes',
          description: 'Clientes con más compras',
          template: 'clientes frecuentes',
          example: 'clientes frecuentes'
        }
      ]
    },
    contabilidad: {
      title: 'Contabilidad',
      icon: '💰',
      scripts: [
        {
          name: 'Registrar ingreso',
          description: 'Agregar transacción de ingreso',
          template: 'agregar ingreso {monto} {descripcion} {categoria}',
          example: 'agregar ingreso 150000 Venta moto Honda ventas'
        },
        {
          name: 'Registrar egreso',
          description: 'Agregar transacción de gasto',
          template: 'agregar egreso {monto} {descripcion} {categoria}',
          example: 'agregar egreso 50000 Compra repuestos compras'
        },
        {
          name: 'Ver balance',
          description: 'Mostrar estado financiero',
          template: 'mostrar balance financiero',
          example: 'mostrar balance financiero'
        },
        {
          name: 'Ver transacciones',
          description: 'Mostrar todas las transacciones',
          template: 'mostrar transacciones',
          example: 'mostrar transacciones'
        },
        {
          name: 'Generar comprobante',
          description: 'Crear nuevo comprobante',
          template: 'agregar comprobante {numero} {tipo} {cliente_id} {total}',
          example: 'agregar comprobante 001-00012345 Factura A 15 250000'
        }
      ]
    }

  };

  const handleScriptClick = (script) => {
    let finalScript = script.template;

    // Reemplazar {tabla} si hay una tabla seleccionada
    if (selectedTable && finalScript.includes('{tabla}')) {
      finalScript = finalScript.replace('{tabla}', selectedTable);
    }

    // Reemplazar otros placeholders básicos
    finalScript = finalScript
      .replace('{nombre}', 'Nombre')
      .replace('{apellido}', 'Apellido')
      .replace('{telefono}', 'Teléfono')
      .replace('{email}', 'email@ejemplo.com')
      .replace('{marca}', 'Marca')
      .replace('{modelo}', 'Modelo')
      .replace('{año}', '2024')
      .replace('{precio}', 'Precio')
      .replace('{color}', 'Color')
      .replace('{categoria}', 'Categoría')
      .replace('{stock}', 'Stock')
      .replace('{id}', 'ID')
      .replace('{numero}', '5')
      .replace('{texto}', 'texto')
      .replace('{condición}', 'condición')
      .replace('{nuevo_precio}', 'nuevo_precio')
      .replace('{nuevo_stock}', 'nuevo_stock')
      .replace('{nuevo_telefono}', 'nuevo_teléfono')
      .replace('{nuevo_estado}', 'nuevo_estado')
      .replace('{producto}', 'producto')
      .replace('{moto}', 'moto')
      .replace('{accesorio}', 'accesorio')
      .replace('{cliente_id}', 'cliente_id')
      .replace('{producto_id}', 'producto_id')
      .replace('{cantidad}', 'cantidad')
      .replace('{total}', 'total')
      .replace('{mes}', 'mes')
      .replace('{sql_query}', 'SELECT * FROM tabla');

    usePrompt(finalScript);
  };

  return (
    <div className="scripts-panel">
      <div className="scripts-header">
        <h3>⚡ Scripts Rápidos</h3>
        <div className="selected-table-info">
          {selectedTable && (
            <span className="table-badge">Tabla: {selectedTable}</span>
          )}
        </div>
      </div>

      {/* Navegación de categorías */}
      <div className="scripts-categories">
        {Object.entries(scriptCategories).map(([key, category]) => (
          <button
            key={key}
            className={`category-tab ${activeCategory === key ? 'active' : ''}`}
            onClick={() => setActiveCategory(key)}
          >
            <span className="category-icon">{category.icon}</span>
            <span className="category-name">{category.title}</span>
          </button>
        ))}
      </div>

      {/* Lista de scripts de la categoría activa */}
      <div className="scripts-list">
        {scriptCategories[activeCategory]?.scripts.map((script, index) => (
          <div
            key={index}
            className="script-item"
            onClick={() => handleScriptClick(script)}
            title={`Ejemplo: ${script.example}`}
          >
            <div className="script-header">
              <div className="script-name">{script.name}</div>
              <div className="script-badge">{scriptCategories[activeCategory].icon}</div>
            </div>
            <div className="script-description">{script.description}</div>
            <div className="script-template">{script.template}</div>
            <div className="script-example">
              <small>Ej: {script.example}</small>
            </div>
          </div>
        ))}
      </div>

      {/* Información adicional */}
      <div className="scripts-info">
        <div className="info-item">
          <strong>💡 Tip:</strong> Los placeholders { } se reemplazan automáticamente
        </div>
        {selectedTable && (
          <div className="info-item">
            <strong>📋 Tabla seleccionada:</strong> {selectedTable}
          </div>
        )}
      </div>
    </div>
  );
};

export default ScriptsPanel;