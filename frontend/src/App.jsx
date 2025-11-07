import React, { useState, useRef, useEffect } from 'react';
import Swal from 'sweetalert2';
import mvRodados from '../src/mvRodados.png'; 

export default function App() {
  const [query, setQuery] = useState('');
  const [chat, setChat] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [tables, setTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState('');
  const [tableData, setTableData] = useState([]);
  const [showTables, setShowTables] = useState(false);
  const [editingRow, setEditingRow] = useState(null);
  const [newRow, setNewRow] = useState({});
  const [openHelpCategory, setOpenHelpCategory] = useState(null);
  const [activeSidebarTab, setActiveSidebarTab] = useState('tables'); // 'tables', 'conversations', 'help', 'commands'
  const messagesEndRef = useRef(null);

  // Cargar datos al iniciar
  useEffect(() => {
    loadHistory();
    loadConversations();
    loadTables();
  }, []);

  const loadHistory = () => {
    fetch('http://localhost:3001/history')
      .then(res => res.json())
      .then(data => {
        setChat(data.history?.map(m => ({
          role: m.role,
          text: m.message,
          sources: JSON.parse(m.sources || '[]'),
          timestamp: m.createdAt
        })) || []);
      })
      .catch(err => {
        console.error(err);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo cargar el historial',
          timer: 3000
        });
      });
  };

  const loadConversations = () => {
    fetch('http://localhost:3001/conversations')
      .then(res => res.json())
      .then(data => {
        setConversations(data.conversations || []);
      })
      .catch(err => {
        console.error(err);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudieron cargar las conversaciones',
          timer: 3000
        });
      });
  };

  const loadTables = () => {
    fetch('http://localhost:3001/tables')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setTables(data.tables || []);
        }
      })
      .catch(err => {
        console.error(err);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudieron cargar las tablas',
          timer: 3000
        });
      });
  };

  const loadTableData = (tableName) => {
    setSelectedTable(tableName);
    setLoading(true);
    
    fetch(`http://localhost:3001/tables/${tableName}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setTableData(data.data);
          setShowTables(true);
          Swal.fire({
            icon: 'success',
            title: 'Tabla cargada',
            text: `Datos de ${tableName} cargados correctamente`,
            timer: 2000,
            showConfirmButton: false
          });
        }
      })
      .catch(err => {
        console.error('Error cargando tabla:', err);
        setTableData([]);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: `No se pudo cargar la tabla ${tableName}`,
          timer: 3000
        });
      })
      .finally(() => setLoading(false));
  };

  const handleAddRow = () => {
    if (Object.keys(newRow).length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Campos vacíos',
        text: 'Por favor, completa al menos un campo',
        timer: 3000
      });
      return;
    }
    
    fetch(`http://localhost:3001/tables/${selectedTable}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newRow)
    })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        loadTableData(selectedTable);
        setNewRow({});
        Swal.fire({
          icon: 'success',
          title: '¡Éxito!',
          text: 'Registro agregado correctamente',
          timer: 2000,
          showConfirmButton: false
        });
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Error: ' + data.error,
          timer: 3000
        });
      }
    })
    .catch(err => {
      console.error('Error agregando registro:', err);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Error al agregar registro',
        timer: 3000
      });
    });
  };

  const handleUpdateRow = (id, data) => {
    fetch(`http://localhost:3001/tables/${selectedTable}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        loadTableData(selectedTable);
        setEditingRow(null);
        Swal.fire({
          icon: 'success',
          title: '¡Éxito!',
          text: 'Registro actualizado correctamente',
          timer: 2000,
          showConfirmButton: false
        });
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Error: ' + data.error,
          timer: 3000
        });
      }
    })
    .catch(err => {
      console.error('Error actualizando registro:', err);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Error al actualizar registro',
        timer: 3000
      });
    });
  };

  const handleDeleteRow = async (id) => {
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
    
    fetch(`http://localhost:3001/tables/${selectedTable}/${id}`, {
      method: 'DELETE'
    })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        loadTableData(selectedTable);
        Swal.fire({
          icon: 'success',
          title: '¡Eliminado!',
          text: 'Registro eliminado correctamente',
          timer: 2000,
          showConfirmButton: false
        });
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Error: ' + data.error,
          timer: 3000
        });
      }
    })
    .catch(err => {
      console.error('Error eliminando registro:', err);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Error al eliminar registro',
        timer: 3000
      });
    });
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat]);

  async function sendQuery() {
    if (!query.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Mensaje vacío',
        text: 'Por favor, escribe un mensaje',
        timer: 2000
      });
      return;
    }

    setLoading(true);
    setChat(c => [...c, { role: 'user', text: query, timestamp: new Date() }]);

    try {
      const resp = await fetch('http://localhost:3001/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      });
      
      if (!resp.ok) {
        throw new Error(`Error ${resp.status}: ${resp.statusText}`);
      }
      
      const data = await resp.json();
      const responseText = data.response?.text || data.response || 'Sin respuesta';
      
      setChat(c => [...c, { 
        role: 'assistant', 
        text: responseText, 
        sources: data.response?.sources || [], 
        timestamp: new Date() 
      }]);
      
    } catch (error) {
      console.error('Error:', error);
      setChat(c => [...c, { 
        role: 'assistant', 
        text: `Error al conectar con el servidor: ${error.message}`, 
        sources: [], 
        timestamp: new Date() 
      }]);
      
      Swal.fire({
        icon: 'error',
        title: 'Error de conexión',
        text: 'No se pudo conectar con el servidor',
        timer: 3000
      });
    }

    setQuery('');
    setLoading(false);
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendQuery();
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Ayer';
    if (diffDays === 2) return 'Anteayer';
    if (diffDays <= 7) return `Hace ${diffDays} días`;
    
    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  // Función para usar prompts de ayuda
  const usePrompt = (promptText) => {
    setQuery(promptText);
    setSidebarOpen(false);
    // Enfocar el input
    setTimeout(() => {
      const input = document.querySelector('.chat-input');
      if (input) input.focus();
    }, 100);
  };

  // Función para acción rápida
  const quickAction = (action) => {
    switch(action) {
      case 'clear':
        setChat([]);
        setShowTables(false);
        Swal.fire({
          icon: 'success',
          title: 'Conversación limpia',
          text: 'Listo para comenzar de nuevo',
          timer: 1500,
          showConfirmButton: false
        });
        break;
      case 'history':
        loadHistory();
        Swal.fire({
          icon: 'info',
          title: 'Historial cargado',
          text: 'Historial actualizado',
          timer: 1500,
          showConfirmButton: false
        });
        break;
      case 'refresh':
        loadTables();
        Swal.fire({
          icon: 'info',
          title: 'Tablas actualizadas',
          text: 'Lista de tablas refrescada',
          timer: 1500,
          showConfirmButton: false
        });
        break;
      default:
        break;
    }
  };

  // Datos de ayuda y prompts
  const helpData = [
    {
      id: 'search',
      title: '🔍 Búsquedas',
      icon: '🔍',
      prompts: [
        {
          text: 'buscar precio honda wave 110 en mercadolibre',
          description: 'Búsqueda en internet'
        },
        {
          text: 'mostrar todos los clientes',
          description: 'Ver tabla completa'
        },
        {
          text: 'buscar motos marca yamaha',
          description: 'Búsqueda con filtro'
        },
        {
          text: 'ver accesorios categoria estetica',
          description: 'Búsqueda por categoría'
        }
      ]
    },
    {
      id: 'insert',
      title: '➕ Insertar Datos',
      icon: '➕',
      prompts: [
        {
          text: 'agregar nuevo cliente Juan Perez telefono 123456789',
          description: 'Cliente básico'
        },
        {
          text: 'nueva moto yamaha yzf r6 color azul año 2020',
          description: 'Moto completa'
        },
        {
          text: 'insertar accesorio espejo retrovisor marca x precio 15000',
          description: 'Accesorio con precio'
        },
        {
          text: 'agregar casco modelo xt-500 talla m color negro',
          description: 'Casco completo'
        }
      ]
    },
    {
      id: 'update',
      title: '✏️ Actualizar',
      icon: '✏️',
      prompts: [
        {
          text: 'actualizar precio de moto id 5 a 2500000',
          description: 'Actualizar campo específico'
        },
        {
          text: 'modificar telefono del cliente Maria Lopez a 987654321',
          description: 'Actualizar contacto'
        },
        {
          text: 'cambiar estado de moto id 3 a Vendida',
          description: 'Cambiar estado'
        }
      ]
    },
    {
      id: 'delete',
      title: '🗑️ Eliminar',
      icon: '🗑️',
      prompts: [
        {
          text: 'eliminar cliente id 10',
          description: 'Eliminar por ID'
        },
        {
          text: 'borrar moto modelo antiguo',
          description: 'Eliminar con filtro'
        },
        {
          text: 'quitar accesorio id 25',
          description: 'Eliminar accesorio'
        }
      ]
    },
    {
      id: 'tables',
      title: '📊 Gestión Tablas',
      icon: '📊',
      prompts: [
        {
          text: 'ver estructura tabla clientes',
          description: 'Ver columnas de tabla'
        },
        {
          text: 'mostrar últimas 10 ventas',
          description: 'Límite de resultados'
        },
        {
          text: 'buscar clientes con telefono no vacio',
          description: 'Filtro con condición'
        }
      ]
    }
  ];

  // Datos de comandos y palabras clave
  const commandsData = [
    {
      id: 'keywords',
      title: '🔑 Palabras Clave',
      icon: '🔑',
      items: [
        {
          title: 'BUSCAR / CONSULTAR',
          description: 'Palabras para consultas:',
          keywords: ['buscar', 'mostrar', 'ver', 'listar', 'consultar', 'traer']
        },
        {
          title: 'AGREGAR / INSERTAR',
          description: 'Palabras para crear registros:',
          keywords: ['agregar', 'añadir', 'nuevo', 'insertar', 'crear']
        },
        {
          title: 'MODIFICAR / ACTUALIZAR',
          description: 'Palabras para editar:',
          keywords: ['actualizar', 'modificar', 'editar', 'cambiar', 'update']
        },
        {
          title: 'ELIMINAR / BORRAR',
          description: 'Palabras para eliminar:',
          keywords: ['eliminar', 'borrar', 'quitar', 'delete']
        }
      ]
    },
    {
      id: 'tables-keywords',
      title: '📋 Tablas Disponibles',
      icon: '📋',
      items: [
        {
          title: 'MOTOS',
          description: 'Palabras clave:',
          keywords: ['moto', 'motos', 'motocicleta', 'vehículo']
        },
        {
          title: 'CLIENTES',
          description: 'Palabras clave:',
          keywords: ['cliente', 'clientes', 'persona', 'usuario']
        },
        {
          title: 'ACCESORIOS',
          description: 'Palabras clave:',
          keywords: ['accesorio', 'accesorios', 'repuesto', 'pieza']
        },
        {
          title: 'CASCOS',
          description: 'Palabras clave:',
          keywords: ['casco', 'cascos', 'protección']
        },
        {
          title: 'BICICLETAS',
          description: 'Palabras clave:',
          keywords: ['bicicleta', 'bicicletas', 'bici']
        },
        {
          title: 'INDUMENTARIAS',
          description: 'Palabras clave:',
          keywords: ['indumentaria', 'ropa', 'campera', 'guante', 'bota']
        },
        {
          title: 'COMPROBANTES',
          description: 'Palabras clave:',
          keywords: ['comprobante', 'factura', 'venta', 'ticket']
        },
        {
          title: 'LISTA DE PRECIOS',
          description: 'Palabras clave:',
          keywords: ['precio', 'lista', 'costos', 'tarifa']
        }
      ]
    },
    {
      id: 'search-internet',
      title: '🌐 Búsqueda Internet',
      icon: '🌐',
      items: [
        {
          title: 'BUSQUEDA WEB',
          description: 'Para buscar en internet usa:',
          keywords: ['buscar precio', 'mercado libre', 'mercadolibre', 'internet', 'web']
        },
        {
          title: 'IMPORTANTE',
          description: 'Para búsqueda web NO incluir:',
          keywords: ['accesorio', 'casco', 'moto', 'cliente', 'tabla']
        }
      ]
    },
    {
      id: 'filters',
      title: '🎯 Filtros Avanzados',
      icon: '🎯',
      items: [
        {
          title: 'POR CATEGORÍA',
          description: 'Filtrar accesorios por:',
          keywords: ['categoria estetica', 'categoria electronico', 'categoria seguridad']
        },
        {
          title: 'POR MARCA',
          description: 'Ejemplos de marcas:',
          keywords: ['yamaha', 'honda', 'suzuki', 'kawasaki']
        },
        {
          title: 'POR ESTADO',
          description: 'Filtrar por estado:',
          keywords: ['disponible', 'vendido', 'activo', 'inactivo']
        }
      ]
    },
    {
      id: 'examples',
      title: '💡 Ejemplos Prácticos',
      icon: '💡',
      items: [
        {
          title: 'CONSULTA BÁSICA',
          description: 'Formato general:',
          keywords: ['"mostrar [tabla]"', '"buscar [tabla] [filtro]"']
        },
        {
          title: 'INSERCIÓN',
          description: 'Formato general:',
          keywords: ['"agregar [tabla] [campo1] [valor1] [campo2] [valor2]"']
        },
        {
          title: 'ACTUALIZACIÓN',
          description: 'Formato general:',
          keywords: ['"actualizar [tabla] [condición] [campo] [nuevo valor]"']
        },
        {
          title: 'ELIMINACIÓN',
          description: 'Formato general:',
          keywords: ['"eliminar [tabla] [condición]"']
        }
      ]
    }
  ];

  const toggleHelpCategory = (categoryId) => {
    setOpenHelpCategory(openHelpCategory === categoryId ? null : categoryId);
  };

  // Componente de Panel de Ayuda
  const HelpPanel = () => (
    <div className="help-panel">
      <h3>💡 Ayuda Rápida</h3>
      
      <div className="help-categories">
        {helpData.map(category => (
          <div key={category.id} className="help-category">
            <div 
              className="category-header"
              onClick={() => toggleHelpCategory(category.id)}
            >
              <div className="category-title">
                <span className="category-icon">{category.icon}</span>
                {category.title}
              </div>
              <div className={`category-arrow ${openHelpCategory === category.id ? 'open' : ''}`}>
                ▼
              </div>
            </div>
            <div className={`category-content ${openHelpCategory === category.id ? 'open' : ''}`}>
              <div className="prompt-list">
                {category.prompts.map((prompt, index) => (
                  <div
                    key={index}
                    className="prompt-item"
                    onClick={() => usePrompt(prompt.text)}
                  >
                    {prompt.text}
                    <small>{prompt.description}</small>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="quick-actions">
        <button 
          className="quick-action-btn"
          onClick={() => quickAction('clear')}
        >
          🗑️ Limpiar Chat
        </button>
        <button 
          className="quick-action-btn"
          onClick={() => quickAction('history')}
        >
          📜 Recargar Historial
        </button>
        <button 
          className="quick-action-btn"
          onClick={() => quickAction('refresh')}
        >
          🔄 Actualizar Tablas
        </button>
        <button 
          className="quick-action-btn"
          onClick={() => setShowTables(false)}
        >
          💬 Volver al Chat
        </button>
      </div>
    </div>
  );

  // Componente de Comandos y Palabras Clave
  const CommandsPanel = () => (
    <div className="commands-panel">
      <h3>⌨️ Comandos del Sistema</h3>
      
      <div className="commands-categories">
        {commandsData.map(category => (
          <div key={category.id} className="command-category">
            <div 
              className="category-header"
              onClick={() => toggleHelpCategory(category.id)}
            >
              <div className="category-title">
                <span className="category-icon">{category.icon}</span>
                {category.title}
              </div>
              <div className={`category-arrow ${openHelpCategory === category.id ? 'open' : ''}`}>
                ▼
              </div>
            </div>
            <div className={`category-content ${openHelpCategory === category.id ? 'open' : ''}`}>
              <div className="command-list">
                {category.items.map((item, index) => (
                  <div key={index} className="command-item">
                    <div className="command-title">{item.title}</div>
                    <div className="command-description">{item.description}</div>
                    <div className="keywords-list">
                      {item.keywords.map((keyword, kwIndex) => (
                        <span key={kwIndex} className="keyword-tag">
                          {keyword}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="usage-tips">
        <h4>💡 Consejos de Uso:</h4>
        <ul>
          <li>• Combina palabras clave para mejores resultados</li>
          <li>• Usa nombres específicos de tablas cuando sea posible</li>
          <li>• Para búsqueda web, no menciones tablas de la base de datos</li>
          <li>• El sistema completa automáticamente campos faltantes</li>
        </ul>
      </div>
    </div>
  );

  // Navegación del Sidebar
  const SidebarNavigation = () => (
    <div className="sidebar-navigation">
      <button 
        className={`nav-btn ${activeSidebarTab === 'tables' ? 'active' : ''}`}
        onClick={() => setActiveSidebarTab('tables')}
      >
        📊 Tablas
      </button>
      <button 
        className={`nav-btn ${activeSidebarTab === 'conversations' ? 'active' : ''}`}
        onClick={() => setActiveSidebarTab('conversations')}
      >
        💬 Conversaciones
      </button>
      <button 
        className={`nav-btn ${activeSidebarTab === 'help' ? 'active' : ''}`}
        onClick={() => setActiveSidebarTab('help')}
      >
        💡 Ayuda Rápida
      </button>
      <button 
        className={`nav-btn ${activeSidebarTab === 'commands' ? 'active' : ''}`}
        onClick={() => setActiveSidebarTab('commands')}
      >
        ⌨️ Comandos
      </button>
    </div>
  );

  // Renderizado condicional del contenido del sidebar
  const renderSidebarContent = () => {
    switch(activeSidebarTab) {
      case 'tables':
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
      case 'conversations':
        return (
          <div className="conversations-section">
            <h3>💬 Conversaciones</h3>
            <button 
              className="new-conversation-btn"
              onClick={() => {
                setChat([]);
                setShowTables(false);
                Swal.fire({
                  icon: 'success',
                  title: 'Nueva conversación',
                  text: 'Conversación limpia lista para comenzar',
                  timer: 2000,
                  showConfirmButton: false
                });
              }}
            >
              + Nueva Conversación
            </button>
            
            <div className="conversations-list">
              {conversations.map(conv => (
                <div 
                  key={conv.id}
                  className="conversation-item"
                  onClick={() => {
                    setShowTables(false);
                    Swal.fire({
                      icon: 'info',
                      title: 'Cargando conversación',
                      text: 'Cargando historial de conversación...',
                      timer: 1500,
                      showConfirmButton: false
                    });
                  }}
                >
                  <div className="conversation-preview">
                    <div className="conversation-text">
                      {conv.lastMessage || 'Nueva conversación'}
                    </div>
                    <div className="conversation-date">
                      {formatDate(conv.lastActivity)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      case 'help':
        return <HelpPanel />;
      case 'commands':
        return <CommandsPanel />;
      default:
        return null;
    }
  };

  const TableCRUD = () => {
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
                            setTableData(updatedData);
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

  return (
    <div className="app-container">
      {/* Sidebar del Historial */}
      <div className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-header">
          <img 
            src={mvRodados} 
            alt="MV Rodados" 
            style={{ height: '100px', objectFit: 'contain' }} 
          />
          <button 
            className="sidebar-close"
            onClick={() => setSidebarOpen(false)}
          >
            ✕
          </button>
        </div>
        
        {/* Navegación del Sidebar */}
        <SidebarNavigation />
        
        <div className="sidebar-content">
          {renderSidebarContent()}
        </div>
      </div>

      {/* Overlay para móvil */}
      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)}></div>}

      {/* Chat Principal */}
      <div className="chat-container">
        <div className="chat-header">
          <div className="header-left">
            <button 
              className="sidebar-toggle"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              ☰
            </button>
            <h1>MvRodados - Sistema inteligente</h1>
          </div>
          <div className="status-indicator">
            <div className={`status-dot ${loading ? 'loading' : 'online'}`}></div>
            <span>{loading ? 'Pensando...' : 'En línea'}</span>
          </div>
        </div>

        <div className="chat-messages">
          {showTables ? (
            <div className="table-view">
              <div className="table-header">
                <h3>📋 {selectedTable}</h3>
                <div>
                  <button 
                    className="refresh-button"
                    onClick={() => loadTableData(selectedTable)}
                  >
                    🔄 Actualizar
                  </button>
                  <button 
                    className="back-button"
                    onClick={() => setShowTables(false)}
                  >
                    ← Volver al chat
                  </button>
                </div>
              </div>
              
              {loading ? (
                <div className="loading-table">Cargando datos...</div>
              ) : (
                <TableCRUD />
              )}
            </div>
          ) : (
            <>
              {chat.length === 0 && (
                <div className="empty-state">
                  <div className="welcome-icon">💬</div>
                  <h3>¡Bienvenido MvRodados - Sistema de Gestión inteligente!</h3>
                  <p>Puedes:</p>
                  <ul className="welcome-tips">
                    <li>• <strong>Búsquedas en internet:</strong> "buscar precio honda wave en mercadolibre"</li>
                    <li>• <strong>Agregar datos:</strong> "agregar cliente Juan Perez telefono 848484"</li>
                    <li>• <strong>Ver datos:</strong> "mostrar clientes" o "ver motos"</li>
                    <li>• <strong>Gestionar tablas:</strong> Usa el menú lateral para editar datos directamente</li>
                  </ul>
                </div>
              )}

              {chat.map((m, i) => (
                <div key={i} className={`message ${m.role}`}>
                  <div className="message-avatar">{m.role === 'user' ? '👤' : '🤖'}</div>
                  <div className="message-content">
                    <div className="message-sender">{m.role === 'user' ? 'Tú' : 'Asistente'}</div>
                    <div className="message-text" style={{ whiteSpace: 'pre-wrap' }}>{m.text}</div>
                    <div className="message-time">
                      {new Date(m.timestamp).toLocaleTimeString('es-ES', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                </div>
              ))}

              {loading && (
                <div className="message assistant">
                  <div className="message-avatar">🤖</div>
                  <div className="message-content">
                    <div className="message-sender">Asistente</div>
                    <div className="typing-indicator">
                      <span></span><span></span><span></span>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          <div ref={messagesEndRef} />
        </div>

        <div className="chat-input-container">
          <div className="input-wrapper">
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ej: buscar precio honda wave en mercadolibre, o agregar cliente Juan Perez..."
              disabled={loading}
              className="chat-input"
            />
            <button onClick={sendQuery} disabled={loading || !query.trim()} className="send-button">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M2 21L23 12L2 3V10L17 12L2 14V21Z" fill="currentColor"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}