const dbService = require('../services/dbService');

class ComprobanteController {
  
  // 🔍 Obtener tipos de comprobante
  async getTiposComprobante(req, res) {
    try {
      const result = await dbService.executeQuery(`
        SELECT id, nombre, codigo, descripcion 
        FROM TipoComprobante 
        WHERE activo = 1 
        ORDER BY nombre
      `);
      
      res.json({ 
        success: true, 
        data: result.data 
      });
    } catch (error) {
      console.error('❌ Error obteniendo tipos de comprobante:', error);
      res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  }

  // 🔍 Obtener comprobantes con joins
  async getComprobantes(req, res) {
    try {
      const { page = 1, limit = 50, search, tipo, estado } = req.query;
      const offset = (page - 1) * limit;

      let whereConditions = ['1=1'];
      let params = {};

      if (search) {
        whereConditions.push('(C.numero LIKE @search OR CL.nombre LIKE @search OR T.nombre LIKE @search)');
        params.search = `%${search}%`;
      }

      if (tipo) {
        whereConditions.push('T.id = @tipo');
        params.tipo = parseInt(tipo);
      }

      if (estado) {
        whereConditions.push('C.estado = @estado');
        params.estado = estado;
      }

      const whereClause = whereConditions.join(' AND ');

      // Query principal
      const query = `
        SELECT 
          C.id, C.numero, C.fecha, C.total, C.estado, C.observaciones,
          CL.id as cliente_id, 
          ISNULL(CL.nombre + ' ' + ISNULL(CL.apellido, ''), 'Sin cliente') as cliente_nombre,
          T.id as tipo_id, T.nombre as tipo_nombre, T.codigo as tipo_codigo
        FROM Comprobantes C
        LEFT JOIN Clientes CL ON C.id_cliente = CL.id
        LEFT JOIN TipoComprobante T ON C.id_tipo_comprobante = T.id
        WHERE ${whereClause}
        ORDER BY C.fecha DESC, C.id DESC
        OFFSET ${offset} ROWS FETCH NEXT ${limit} ROWS ONLY
      `;

      // Query para contar total
      const countQuery = `
        SELECT COUNT(*) as total
        FROM Comprobantes C
        LEFT JOIN Clientes CL ON C.id_cliente = CL.id
        LEFT JOIN TipoComprobante T ON C.id_tipo_comprobante = T.id
        WHERE ${whereClause}
      `;

      const [comprobantesResult, countResult] = await Promise.all([
        dbService.executeQuery(query, params),
        dbService.executeQuery(countQuery, params)
      ]);

      res.json({
        success: true,
        data: comprobantesResult.data,
        total: countResult.data[0].total,
        page: parseInt(page),
        limit: parseInt(limit)
      });

    } catch (error) {
      console.error('❌ Error obteniendo comprobantes:', error);
      res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  }

  // ➕ Crear comprobante
  async createComprobante(req, res) {
    try {
      const {
        id_tipo_comprobante,
        id_cliente,
        numero,
        fecha,
        total,
        estado = 'Pendiente',
        observaciones = ''
      } = req.body;

      // Validaciones básicas
      if (!id_tipo_comprobante || !numero || !fecha || total === undefined) {
        return res.status(400).json({ 
          success: false, 
          error: 'Faltan campos obligatorios: tipo de comprobante, número, fecha y total' 
        });
      }

      // Verificar si el número ya existe
      const existeQuery = `SELECT id FROM Comprobantes WHERE numero = @numero`;
      const existeResult = await dbService.executeQuery(existeQuery, { numero });
      
      if (existeResult.data.length > 0) {
        return res.status(400).json({
          success: false,
          error: 'Ya existe un comprobante con ese número'
        });
      }

      // Generar query de inserción
      const query = `
        INSERT INTO Comprobantes (
          id_tipo_comprobante, id_cliente, numero, fecha, total, estado, observaciones
        )
        OUTPUT INSERTED.*
        VALUES (@id_tipo_comprobante, @id_cliente, @numero, @fecha, @total, @estado, @observaciones)
      `;

      const params = {
        id_tipo_comprobante: parseInt(id_tipo_comprobante),
        id_cliente: id_cliente ? parseInt(id_cliente) : null,
        numero: numero.toString(),
        fecha: fecha,
        total: parseFloat(total),
        estado: estado,
        observaciones: observaciones
      };

      const result = await dbService.executeQuery(query, params);

      res.json({
        success: true,
        data: result.data[0],
        message: 'Comprobante creado correctamente'
      });

    } catch (error) {
      console.error('❌ Error creando comprobante:', error);
      res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  }

  // ✏️ Actualizar comprobante
  async updateComprobante(req, res) {
    try {
      const { id } = req.params;
      const {
        id_tipo_comprobante,
        id_cliente,
        numero,
        fecha,
        total,
        estado,
        observaciones
      } = req.body;

      // Verificar que el comprobante existe
      const existeQuery = `SELECT id FROM Comprobantes WHERE id = @id`;
      const existeResult = await dbService.executeQuery(existeQuery, { id: parseInt(id) });
      
      if (existeResult.data.length === 0) {
        return res.status(404).json({ 
          success: false, 
          error: 'Comprobante no encontrado' 
        });
      }

      const query = `
        UPDATE Comprobantes 
        SET id_tipo_comprobante = @id_tipo_comprobante,
            id_cliente = @id_cliente,
            numero = @numero,
            fecha = @fecha,
            total = @total,
            estado = @estado,
            observaciones = @observaciones
        OUTPUT INSERTED.*
        WHERE id = @id
      `;

      const params = {
        id: parseInt(id),
        id_tipo_comprobante: parseInt(id_tipo_comprobante),
        id_cliente: id_cliente ? parseInt(id_cliente) : null,
        numero: numero.toString(),
        fecha: fecha,
        total: parseFloat(total),
        estado: estado,
        observaciones: observaciones
      };

      const result = await dbService.executeQuery(query, params);

      res.json({
        success: true,
        data: result.data[0],
        message: 'Comprobante actualizado correctamente'
      });

    } catch (error) {
      console.error('❌ Error actualizando comprobante:', error);
      res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  }

  // 🗑️ Eliminar comprobante
  async deleteComprobante(req, res) {
    try {
      const { id } = req.params;

      const query = 'DELETE FROM Comprobantes WHERE id = @id';
      const result = await dbService.executeQuery(query, { id: parseInt(id) });

      if (result.rowsAffected === 0) {
        return res.status(404).json({ 
          success: false, 
          error: 'Comprobante no encontrado' 
        });
      }

      res.json({
        success: true,
        message: 'Comprobante eliminado correctamente'
      });

    } catch (error) {
      console.error('❌ Error eliminando comprobante:', error);
      res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  }

  // 📊 Obtener estadísticas
  async getEstadisticas(req, res) {
    try {
      const query = `
        SELECT 
          COUNT(*) as total,
          ISNULL(SUM(total), 0) as total_monto,
          ISNULL(AVG(total), 0) as promedio_monto,
          COUNT(CASE WHEN estado = 'Completado' THEN 1 END) as completados,
          COUNT(CASE WHEN estado = 'Pendiente' THEN 1 END) as pendientes,
          COUNT(CASE WHEN estado = 'Cancelado' THEN 1 END) as cancelados
        FROM Comprobantes
        WHERE fecha >= DATEADD(MONTH, -1, GETDATE())
      `;

      const result = await dbService.executeQuery(query);
      
      res.json({
        success: true,
        data: result.data[0]
      });

    } catch (error) {
      console.error('❌ Error obteniendo estadísticas:', error);
      res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  }

  // 🔍 Obtener próximo número de comprobante
  async getProximoNumero(req, res) {
    try {
      const { tipoId } = req.params;
      
      const tipoQuery = `SELECT codigo FROM TipoComprobante WHERE id = @tipoId`;
      const tipoResult = await dbService.executeQuery(tipoQuery, { tipoId: parseInt(tipoId) });
      
      if (tipoResult.data.length === 0) {
        return res.status(404).json({ 
          success: false, 
          error: 'Tipo de comprobante no encontrado' 
        });
      }

      const codigo = tipoResult.data[0].codigo;
      
      // Buscar el último número para este tipo
      const ultimoQuery = `
        SELECT MAX(numero) as ultimo_numero 
        FROM Comprobantes 
        WHERE numero LIKE @pattern
      `;
      
      const ultimoResult = await dbService.executeQuery(ultimoQuery, { 
        pattern: `${codigo}-%` 
      });

      let proximoNumero = 1;
      if (ultimoResult.data[0].ultimo_numero) {
        const partes = ultimoResult.data[0].ultimo_numero.split('-');
        if (partes.length > 1) {
          proximoNumero = parseInt(partes[1]) + 1;
        }
      }

      const numeroComprobante = `${codigo}-${proximoNumero.toString().padStart(3, '0')}`;

      res.json({
        success: true,
        data: { numero: numeroComprobante }
      });

    } catch (error) {
      console.error('❌ Error generando número:', error);
      res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  }
}

module.exports = new ComprobanteController();