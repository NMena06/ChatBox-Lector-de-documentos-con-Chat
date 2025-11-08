const dbService = require('../services/dbService');

class CrudController {
  async getAllTables(req, res) {
    try {
      const schema = await dbService.getSchema();
      res.json({ 
        success: true, 
        tables: Object.keys(schema) 
      });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  }

  async getTableData(req, res) {
    try {
      const { tableName } = req.params;
      const { page = 1, limit = 100, search } = req.query;
      
      let condition = '';
      if (search) {
        condition = this.buildSearchCondition(search, tableName);
      }

      const result = await dbService.selectRecords(
        tableName, 
        condition, 
        [], 
        limit
      );

      res.json({
        success: true,
        data: result.data,
        total: result.count,
        page: parseInt(page),
        limit: parseInt(limit)
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  async createRecord(req, res) {
    try {
      const { tableName } = req.params;
      const data = req.body;
      
      const schema = await dbService.getSchema();
      const result = await dbService.insertRecord(tableName, data, schema);

      res.json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  async updateRecord(req, res) {
    try {
      const { tableName, id } = req.params;
      const data = req.body;
      
      const condition = `id = ${id}`;
      const result = await dbService.updateRecord(tableName, data, condition);

      res.json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  async deleteRecord(req, res) {
    try {
      const { tableName, id } = req.params;
      
      const condition = `id = ${id}`;
      const result = await dbService.deleteRecord(tableName, condition);

      res.json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  buildSearchCondition(search, tableName) {
    // Implementar búsqueda inteligente por tabla
    const searchTerms = search.split(' ').filter(term => term.length > 2);
    
    if (searchTerms.length === 0) return '';

    // Mapeo de columnas comunes por tabla
    const columnMap = {
      'Clientes': ['nombre', 'apellido', 'email', 'telefono'],
      'Productos': ['nombre', 'descripcion', 'marca', 'modelo'],
      'Motos': ['marca', 'modelo', 'anio', 'cilindrada'],
      'Ventas': ['numero_factura', 'cliente_nombre']
    };

    const columns = columnMap[tableName] || ['nombre', 'descripcion'];
    
    const conditions = searchTerms.map(term => {
      const columnConditions = columns.map(col => 
        `${col} LIKE '%${term}%'`
      ).join(' OR ');
      
      return `(${columnConditions})`;
    });

    return conditions.join(' AND ');
  }
}

module.exports = new CrudController();