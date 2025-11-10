const dbService = require('../services/dbService');

class ArticulosController {
// Obtener todos los tipos de artículo
  async getTiposArticulo(req, res) {
    try {
      const result = await dbService.executeQuery(`
        SELECT id, nombre, descripcion, activo, fecha_creacion
        FROM TipoArticulo 
        WHERE activo = 1 
        ORDER BY nombre
      `);
      
      res.json({ 
        success: true, 
        data: result.data 
      });
    } catch (error) {
      console.error('❌ Error obteniendo tipos de artículo:', error);
      res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  }

  // Obtener artículos con joins
  async getArticulos(req, res) {
    try {
      const { search, tipo, categoria } = req.query;
      
      let whereConditions = ['A.activo = 1'];
      let params = {};

      if (search) {
        whereConditions.push('(A.nombre LIKE @search OR A.marca LIKE @search OR A.descripcion LIKE @search)');
        params.search = `%${search}%`;
      }

      if (tipo) {
        whereConditions.push('A.id_tipo_articulo = @tipo');
        params.tipo = parseInt(tipo);
      }

      if (categoria) {
        whereConditions.push('A.categoria LIKE @categoria');
        params.categoria = `%${categoria}%`;
      }

      const whereClause = whereConditions.join(' AND ');

      const query = `
        SELECT 
          A.*,
          TA.nombre as tipo_nombre,
          TA.descripcion as tipo_descripcion
        FROM Articulos A
        INNER JOIN TipoArticulo TA ON A.id_tipo_articulo = TA.id
        WHERE ${whereClause}
        ORDER BY A.nombre
      `;

      const result = await dbService.executeQuery(query, params);

      res.json({
        success: true,
        data: result.data,
        total: result.data.length
      });

    } catch (error) {
      console.error('❌ Error obteniendo artículos:', error);
      res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  }

  // Crear nuevo tipo de artículo
  async createTipoArticulo(req, res) {
    try {
      const { nombre, descripcion } = req.body;

      if (!nombre) {
        return res.status(400).json({ 
          success: false, 
          error: 'El nombre del tipo es obligatorio' 
        });
      }

      const query = `
        INSERT INTO TipoArticulo (nombre, descripcion)
        OUTPUT INSERTED.*
        VALUES (@nombre, @descripcion)
      `;

      const result = await dbService.executeQuery(query, { 
        nombre, 
        descripcion: descripcion || '' 
      });

      res.json({
        success: true,
        data: result.data[0],
        message: 'Tipo de artículo creado correctamente'
      });

    } catch (error) {
      console.error('❌ Error creando tipo de artículo:', error);
      res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  }

  // Obtener estadísticas de artículos
  async getEstadisticas(req, res) {
    try {
      const query = `
        SELECT 
          TA.nombre as tipo,
          COUNT(A.id) as cantidad,
          SUM(A.stock) as total_stock,
          SUM(A.precio_venta * A.stock) as valor_total
        FROM Articulos A
        INNER JOIN TipoArticulo TA ON A.id_tipo_articulo = TA.id
        WHERE A.activo = 1
        GROUP BY TA.nombre, TA.id
        ORDER BY TA.nombre
      `;

      const result = await dbService.executeQuery(query);

      res.json({
        success: true,
        data: result.data
      });

    } catch (error) {
      console.error('❌ Error obteniendo estadísticas:', error);
      res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  }


  // Crear nuevo tipo de artículo
  async createTipoArticulo(req, res) {
    try {
      const { nombre, descripcion } = req.body;

      if (!nombre) {
        return res.status(400).json({ 
          success: false, 
          error: 'El nombre del tipo es obligatorio' 
        });
      }

      const result = await dbService.createTipoArticulo({ nombre, descripcion });

      res.json({
        success: true,
        data: result.data[0],
        message: 'Tipo de artículo creado correctamente'
      });

    } catch (error) {
      console.error('❌ Error creando tipo de artículo:', error);
      res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  }

  // Obtener estadísticas de artículos
  async getEstadisticas(req, res) {
    try {
      const query = `
        SELECT 
          TA.nombre as tipo,
          COUNT(A.id) as cantidad,
          SUM(A.stock) as total_stock,
          SUM(A.precio_venta * A.stock) as valor_total
        FROM Articulos A
        INNER JOIN TipoArticulo TA ON A.id_tipo_articulo = TA.id
        WHERE A.activo = 1
        GROUP BY TA.nombre, TA.id
        ORDER BY TA.nombre
      `;

      const result = await dbService.executeQuery(query);

      res.json({
        success: true,
        data: result.data
      });

    } catch (error) {
      console.error('❌ Error obteniendo estadísticas:', error);
      res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  }
}

module.exports = new ArticulosController();