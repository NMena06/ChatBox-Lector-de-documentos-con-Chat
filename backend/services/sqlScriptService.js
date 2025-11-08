const dbService = require('./dbService');

class SQLScriptService {
  constructor() {
    this.scripts = this.initializeScripts();
  }

  initializeScripts() {
    return {
      // 📊 CONSULTAS GENERALES
      'select_all': (table, conditions = '') => 
        `SELECT * FROM ${table} ${conditions ? 'WHERE ' + conditions : ''} ORDER BY 1 DESC`,

      'select_count': (table, conditions = '') => 
        `SELECT COUNT(*) as total FROM ${table} ${conditions ? 'WHERE ' + conditions : ''}`,

      'select_recent': (table, limit = 10) => 
        `SELECT TOP ${limit} * FROM ${table} ORDER BY id DESC`,

      'search_like': (table, column, value) => 
        `SELECT * FROM ${table} WHERE ${column} LIKE '%${value}%'`,

      // ➕ INSERCIONES INTELIGENTES
      'insert_generic': (table, data) => {
        const columns = Object.keys(data).map(col => `[${col}]`).join(', ');
        const values = Object.values(data).map(val => this.formatValue(val)).join(', ');
        return `INSERT INTO ${table} (${columns}) VALUES (${values})`;
      },

      // ✏️ ACTUALIZACIONES
      'update_generic': (table, data, condition) => {
        const sets = Object.entries(data)
          .map(([key, value]) => `[${key}] = ${this.formatValue(value)}`)
          .join(', ');
        return `UPDATE ${table} SET ${sets} WHERE ${condition}`;
      },

      // 🗑️ ELIMINACIONES
      'delete_generic': (table, condition) => 
        `DELETE FROM ${table} WHERE ${condition}`,

      // 📈 CONSULTAS ESPECÍFICAS POR TABLA
      'Clientes': {
        'buscar_por_nombre': (nombre) => 
          `SELECT * FROM Clientes WHERE nombre LIKE '%${nombre}%' OR apellido LIKE '%${nombre}%'`,
        
        'clientes_recientes': () => 
          `SELECT TOP 10 * FROM Clientes ORDER BY fecha_registro DESC`,
        
        'total_clientes': () => 
          `SELECT COUNT(*) as total_clientes FROM Clientes`
      },

      'Motos': {
        'buscar_por_marca': (marca) => 
          `SELECT * FROM Motos WHERE marca LIKE '%${marca}%'`,
        
        'motos_disponibles': () => 
          `SELECT * FROM Motos WHERE estado = 'Disponible'`,
        
        'precio_promedio': () => 
          `SELECT AVG(precio) as precio_promedio FROM Motos WHERE precio > 0`
      },

      'Productos': {
        'buscar_por_categoria': (categoria) => 
          `SELECT * FROM Productos WHERE categoria LIKE '%${categoria}%'`,
        
        'stock_bajo': () => 
          `SELECT * FROM Productos WHERE stock < 10`,
        
        'productos_populares': () => 
          `SELECT TOP 5 * FROM Productos ORDER BY vendidos DESC`
      },

      'Ventas': {
        'ventas_mes_actual': () => 
          `SELECT * FROM Ventas WHERE MONTH(fecha) = MONTH(GETDATE()) AND YEAR(fecha) = YEAR(GETDATE())`,
        
        'total_ventas': () => 
          `SELECT SUM(total) as total_ventas FROM Ventas`,
        
        'mejores_clientes': () => 
          `SELECT cliente_id, COUNT(*) as compras, SUM(total) as total_gastado 
           FROM Ventas GROUP BY cliente_id ORDER BY total_gastado DESC`
      }
    };
  }

  formatValue(value) {
    if (value === null || value === undefined) return 'NULL';
    if (typeof value === 'number') return value;
    if (typeof value === 'boolean') return value ? 1 : 0;
    if (value instanceof Date) return `'${value.toISOString().split('T')[0]}'`;
    return `'${value.toString().replace(/'/g, "''")}'`;
  }

  getScript(scriptName, ...params) {
    const script = this.getNestedValue(this.scripts, scriptName);
    
    if (typeof script === 'function') {
      return script(...params);
    }
    
    throw new Error(`Script no encontrado: ${scriptName}`);
  }

  getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  // 🎯 GENERAR SCRIPT BASADO EN INTENCIÓN
  generateScriptFromIntent(intent, schema) {
    const { action, table, data, condition, fields, limit } = intent;

    switch (action) {
      case 'select':
        const selectedFields = fields && fields.length > 0 ? 
          fields.map(f => `[${f}]`).join(', ') : '*';
        const whereClause = condition ? `WHERE ${condition}` : '';
        const limitClause = limit ? `TOP ${limit}` : '';
        return `SELECT ${limitClause} ${selectedFields} FROM ${table} ${whereClause} ORDER BY 1 DESC`;

      case 'insert':
        if (!data || Object.keys(data).length === 0) {
          throw new Error('Datos insuficientes para INSERT');
        }
        return this.getScript('insert_generic', table, data);

      case 'update':
        if (!data || !condition) {
          throw new Error('Datos y condición requeridos para UPDATE');
        }
        return this.getScript('update_generic', table, data, condition);

      case 'delete':
        if (!condition) {
          throw new Error('Condición requerida para DELETE');
        }
        return this.getScript('delete_generic', table, condition);

      default:
        throw new Error(`Acción no soportada: ${action}`);
    }
  }

  // 📋 LISTAR SCRIPTS DISPONIBLES
  getAvailableScripts() {
    const available = {};
    
    // Scripts generales
    available.generales = [
      'select_all',
      'select_count', 
      'select_recent',
      'search_like',
      'insert_generic',
      'update_generic',
      'delete_generic'
    ];

    // Scripts por tabla
    available.tablas = {};
    Object.keys(this.scripts).forEach(key => {
      if (typeof this.scripts[key] === 'object' && key !== 'generales') {
        available.tablas[key] = Object.keys(this.scripts[key]);
      }
    });

    return available;
  }
}

module.exports = new SQLScriptService();