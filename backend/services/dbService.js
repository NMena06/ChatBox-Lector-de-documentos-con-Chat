const { Database, sql } = require('../config/database');

class DBService {
  constructor() {
    this.db = Database;
  }

  async getSchema() {
    try {
      const pool = await this.db.getConnection();
      
      const tablesResult = await pool.request().query(`
        SELECT TABLE_NAME 
        FROM INFORMATION_SCHEMA.TABLES 
        WHERE TABLE_TYPE = 'BASE TABLE'
        AND TABLE_NAME NOT IN ('ChatHistory', 'sysdiagrams')
      `);
      
      const schema = {};
      
      for (const table of tablesResult.recordset) {
        const tableName = table.TABLE_NAME;
        
        const columnsResult = await pool.request().query(`
          SELECT 
            c.COLUMN_NAME,
            c.DATA_TYPE,
            c.IS_NULLABLE,
            c.CHARACTER_MAXIMUM_LENGTH,
            COLUMNPROPERTY(OBJECT_ID(c.TABLE_NAME), c.COLUMN_NAME, 'IsIdentity') AS IS_IDENTITY,
            CASE WHEN pk.COLUMN_NAME IS NOT NULL THEN 1 ELSE 0 END AS IS_PRIMARY_KEY
          FROM INFORMATION_SCHEMA.COLUMNS c
          LEFT JOIN (
            SELECT ku.TABLE_NAME, ku.COLUMN_NAME
            FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS AS tc
            JOIN INFORMATION_SCHEMA.KEY_COLUMN_USAGE AS ku
              ON tc.CONSTRAINT_TYPE = 'PRIMARY KEY' 
              AND tc.CONSTRAINT_NAME = ku.CONSTRAINT_NAME
          ) pk ON c.TABLE_NAME = pk.TABLE_NAME AND c.COLUMN_NAME = pk.COLUMN_NAME
          WHERE c.TABLE_NAME = '${tableName}'
          ORDER BY c.ORDINAL_POSITION
        `);
        
        schema[tableName] = columnsResult.recordset.map(col => ({
          name: col.COLUMN_NAME,
          type: col.DATA_TYPE,
          nullable: col.IS_NULLABLE === 'YES',
          maxLength: col.CHARACTER_MAXIMUM_LENGTH,
          isIdentity: col.IS_IDENTITY === 1,
          isPrimaryKey: col.IS_PRIMARY_KEY === 1
        }));
      }
      
      return schema;
    } catch (err) {
      console.error('❌ Error obteniendo schema:', err);
      return {};
    }
  }

  async executeQuery(query, params = {}) {
    try {
      const pool = await this.db.getConnection();
      const request = pool.request();

      // Agregar parámetros si existen
      Object.entries(params).forEach(([key, value]) => {
        request.input(key, value);
      });

      const result = await request.query(query);
      return {
        success: true,
        data: result.recordset,
        rowsAffected: result.rowsAffected[0]
      };
    } catch (error) {
      console.error('❌ Error ejecutando query:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async insertRecord(tableName, data, schema) {
    const tableSchema = schema[tableName];
    if (!tableSchema) {
      throw new Error(`Tabla ${tableName} no encontrada`);
    }

    // Filtrar y validar datos
    const insertData = this.prepareInsertData(data, tableSchema);
    
    const columns = Object.keys(insertData).map(col => `[${col}]`).join(', ');
    const values = Object.keys(insertData).map(col => `@${col}`).join(', ');

    const query = `INSERT INTO ${tableName} (${columns}) OUTPUT INSERTED.* VALUES (${values})`;
    
    const result = await this.executeQuery(query, insertData);
    
    if (result.success) {
      return {
        success: true,
        message: `✅ Registro insertado en ${tableName}`,
        data: result.data[0],
        insertedData: insertData
      };
    } else {
      throw new Error(result.error);
    }
  }

async selectRecords(tableName, condition = '', fields = [], limit = 100) {
  try {
    // Verificar que la tabla existe antes de consultar
    const schema = await this.getSchema();
    if (!schema[tableName]) {
      throw new Error(`La tabla "${tableName}" no existe en la base de datos`);
    }

    const selectedFields = fields.length > 0 ? 
      fields.map(f => `[${f}]`).join(', ') : '*';
    
    let whereClause = '';
    if (condition && condition.trim()) {
      whereClause = `WHERE ${condition}`;
    }
    
    const limitClause = limit ? `TOP ${limit}` : '';

    const query = `SELECT ${limitClause} ${selectedFields} FROM ${tableName} ${whereClause} ORDER BY 1 DESC`;
    console.log("🔍 Ejecutando SELECT:", query);
    
    const result = await this.executeQuery(query);
    
    if (result.success) {
      return {
        success: true,
        data: result.data,
        count: result.data.length
      };
    } else {
      throw new Error(result.error);
    }
  } catch (error) {
    console.error(`❌ Error en selectRecords para tabla ${tableName}:`, error);
    throw error;
  }
}

  async updateRecord(tableName, data, condition) {
    const setClause = Object.keys(data)
      .map(key => `[${key}] = @${key}`)
      .join(', ');

    const query = `UPDATE ${tableName} SET ${setClause} WHERE ${condition}`;
    
    const result = await this.executeQuery(query, data);
    
    if (result.success) {
      return {
        success: true,
        message: `✅ Registro actualizado en ${tableName}`,
        affectedRows: result.rowsAffected
      };
    } else {
      throw new Error(result.error);
    }
  }

  async deleteRecord(tableName, condition) {
    const query = `DELETE FROM ${tableName} WHERE ${condition}`;
    
    const result = await this.executeQuery(query);
    
    if (result.success) {
      return {
        success: true,
        message: `✅ Registro eliminado de ${tableName}`,
        affectedRows: result.rowsAffected
      };
    } else {
      throw new Error(result.error);
    }
  }

  prepareInsertData(data, tableSchema) {
    const insertData = {};
    const currentDate = new Date().toISOString().split('T')[0];

    for (const column of tableSchema) {
      if (column.isIdentity) continue; // Saltar identity columns

      const value = data[column.name];
      
      if (value !== undefined && value !== '') {
        insertData[column.name] = this.formatValue(value, column.type);
      } else if (!column.nullable) {
        // Generar valor por defecto para campos requeridos
        insertData[column.name] = this.generateDefaultValue(column);
      }
      // Campos opcionales sin valor se omiten
    }

    return insertData;
  }
formatValue(value, type) {
  if (value === null || value === undefined) return null;
  
  const lowerType = type.toLowerCase();
  
  // Manejar valores booleanos/texto mejor
  if (typeof value === 'boolean') {
    return value ? 1 : 0;
  }
  
  if (value === 'true' || value === 'false') {
    return value === 'true' ? 1 : 0;
  }
  
  if (lowerType.includes('int') || lowerType.includes('decimal') || 
      lowerType.includes('float') || lowerType.includes('numeric')) {
    const num = Number(value);
    return isNaN(num) ? 0 : num;
  }
  
  if (lowerType.includes('bit') || lowerType.includes('boolean')) {
    return value ? 1 : 0;
  }
  
  if (lowerType.includes('date') || lowerType.includes('time')) {
    // Intentar parsear fecha
    const date = new Date(value);
    return isNaN(date.getTime()) ? new Date().toISOString().split('T')[0] : date.toISOString().split('T')[0];
  }
  
  return String(value);
}

  generateDefaultValue(column) {
    const colName = column.name.toLowerCase();
    const type = column.type.toLowerCase();

    // Valores inteligentes basados en nombre de columna
    const smartDefaults = {
      'precio': 0, 'costo': 0, 'precio_venta': 0, 'precio_lista': 0,
      'cantidad': 0, 'stock': 0, 'existencia': 0,
      'fecha': new Date().toISOString().split('T')[0],
      'fecha_creacion': new Date().toISOString().split('T')[0],
      'fecha_registro': new Date().toISOString().split('T')[0],
      'activo': 1, 'disponible': 1, 'estado': 'Activo', 'status': 'Activo',
      'habilitado': 1, 'visible': 1,
      'tipo': 'General', 'categoria': 'General', 'marca': 'Generica'
    };

    for (const [key, defaultValue] of Object.entries(smartDefaults)) {
      if (colName.includes(key)) {
        return defaultValue;
      }
    }

    // Valores por tipo de dato
    if (type.includes('int') || type.includes('decimal') || type.includes('float') || type.includes('numeric')) {
      return 0;
    }
    
    if (type.includes('bit') || type.includes('boolean')) {
      return 0;
    }
    
    if (type.includes('date') || type.includes('time')) {
      return new Date().toISOString().split('T')[0];
    }
    
    if (type.includes('char') || type.includes('text') || type.includes('varchar')) {
      return 'Por definir';
    }
    
    return '';
  }
}

module.exports = new DBService();