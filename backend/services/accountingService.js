const dbService = require('./dbService');

class AccountingService {
  constructor() {
    this.transactionTypes = {
      INGRESO: 'ingreso',
      EGRESO: 'egreso',
      VENTA: 'venta',
      COMPRA: 'compra',
      GASTO: 'gasto'
    };
  }

  // 🔍 OBTENER TRANSACCIONES
  async getTransacciones(filters = {}) {
    try {
      let whereClause = '';
      const params = {};

      if (filters.tipo) {
        whereClause += ' AND tipo = @tipo';
        params.tipo = filters.tipo;
      }

      if (filters.fechaDesde) {
        whereClause += ' AND fecha >= @fechaDesde';
        params.fechaDesde = filters.fechaDesde;
      }

      if (filters.fechaHasta) {
        whereClause += ' AND fecha <= @fechaHasta';
        params.fechaHasta = filters.fechaHasta;
      }

      const query = `
        SELECT * FROM Transacciones 
        WHERE 1=1 ${whereClause}
        ORDER BY fecha DESC, id DESC
      `;

      const result = await dbService.executeQuery(query, params);
      return {
        success: true,
        data: result.data,
        total: result.data.length
      };
    } catch (error) {
      console.error('❌ Error obteniendo transacciones:', error);
      return { success: false, error: error.message };
    }
  }

  // 🔍 OBTENER BALANCES
  async getBalances(filters = {}) {
    try {
      let whereClause = '';
      const params = {};

      if (filters.fechaDesde) {
        whereClause += ' AND fecha >= @fechaDesde';
        params.fechaDesde = filters.fechaDesde;
      }

      if (filters.fechaHasta) {
        whereClause += ' AND fecha <= @fechaHasta';
        params.fechaHasta = filters.fechaHasta;
      }

      const query = `
        SELECT * FROM Balances 
        WHERE 1=1 ${whereClause}
        ORDER BY fecha DESC
      `;

      const result = await dbService.executeQuery(query, params);
      return {
        success: true,
        data: result.data,
        total: result.data.length
      };
    } catch (error) {
      console.error('❌ Error obteniendo balances:', error);
      return { success: false, error: error.message };
    }
  }

  // ➕ INSERTAR TRANSACCIÓN
  async insertTransaccion(transaccionData) {
    try {
      const {
        tipo,
        monto,
        descripcion,
        categoria,
        fecha = new Date(),
        referencia_id = null,
        referencia_tabla = null
      } = transaccionData;

      // Validaciones
      if (!tipo || !monto || !descripcion || !categoria) {
        throw new Error('Faltan campos obligatorios: tipo, monto, descripcion, categoria');
      }

      const query = `
        INSERT INTO Transacciones (tipo, monto, descripcion, categoria, fecha, referencia_id, referencia_tabla)
        OUTPUT INSERTED.*
        VALUES (@tipo, @monto, @descripcion, @categoria, @fecha, @referencia_id, @referencia_tabla)
      `;

      const result = await dbService.executeQuery(query, {
        tipo,
        monto: parseFloat(monto),
        descripcion,
        categoria,
        fecha,
        referencia_id,
        referencia_tabla
      });

      // Actualizar balances automáticamente
      await this.actualizarBalance(fecha);

      return {
        success: true,
        data: result.data[0],
        message: 'Transacción registrada correctamente'
      };
    } catch (error) {
      console.error('❌ Error insertando transacción:', error);
      return { success: false, error: error.message };
    }
  }

  // ➕ INSERTAR BALANCE
  async insertBalance(balanceData) {
    try {
      const {
        fecha = new Date(),
        ingresos = 0,
        egresos = 0
      } = balanceData;

      const balance = parseFloat(ingresos) - parseFloat(egresos);

      // Verificar si ya existe un balance para esta fecha
      const existeQuery = `SELECT id FROM Balances WHERE fecha = @fecha`;
      const existeResult = await dbService.executeQuery(existeQuery, { fecha });

      let query, params;

      if (existeResult.data.length > 0) {
        // Actualizar balance existente
        query = `
          UPDATE Balances 
          SET ingresos = @ingresos, egresos = @egresos, balance = @balance
          OUTPUT INSERTED.*
          WHERE fecha = @fecha
        `;
      } else {
        // Insertar nuevo balance
        query = `
          INSERT INTO Balances (fecha, ingresos, egresos, balance)
          OUTPUT INSERTED.*
          VALUES (@fecha, @ingresos, @egresos, @balance)
        `;
      }

      params = {
        fecha,
        ingresos: parseFloat(ingresos),
        egresos: parseFloat(egresos),
        balance
      };

      const result = await dbService.executeQuery(query, params);

      return {
        success: true,
        data: result.data[0],
        message: existeResult.data.length > 0 ? 'Balance actualizado correctamente' : 'Balance creado correctamente'
      };
    } catch (error) {
      console.error('❌ Error insertando balance:', error);
      return { success: false, error: error.message };
    }
  }

  // ✏️ ACTUALIZAR TRANSACCIÓN
  async updateTransaccion(id, transaccionData) {
    try {
      const {
        tipo,
        monto,
        descripcion,
        categoria,
        fecha,
        referencia_id,
        referencia_tabla
      } = transaccionData;

      // Obtener transacción actual para saber la fecha
      const transaccionActual = await dbService.executeQuery(
        'SELECT * FROM Transacciones WHERE id = @id',
        { id }
      );

      if (!transaccionActual.data.length) {
        throw new Error('Transacción no encontrada');
      }

      const query = `
        UPDATE Transacciones 
        SET tipo = @tipo, monto = @monto, descripcion = @descripcion, 
            categoria = @categoria, fecha = @fecha, 
            referencia_id = @referencia_id, referencia_tabla = @referencia_tabla
        OUTPUT INSERTED.*
        WHERE id = @id
      `;

      const result = await dbService.executeQuery(query, {
        id,
        tipo,
        monto: parseFloat(monto),
        descripcion,
        categoria,
        fecha,
        referencia_id,
        referencia_tabla
      });

      // Actualizar balances para ambas fechas (antigua y nueva)
      await this.actualizarBalance(transaccionActual.data[0].fecha);
      if (fecha !== transaccionActual.data[0].fecha) {
        await this.actualizarBalance(fecha);
      }

      return {
        success: true,
        data: result.data[0],
        message: 'Transacción actualizada correctamente'
      };
    } catch (error) {
      console.error('❌ Error actualizando transacción:', error);
      return { success: false, error: error.message };
    }
  }

  // ✏️ ACTUALIZAR BALANCE
  async updateBalance(id, balanceData) {
    try {
      const {
        fecha,
        ingresos,
        egresos
      } = balanceData;

      const balance = parseFloat(ingresos) - parseFloat(egresos);

      const query = `
        UPDATE Balances 
        SET fecha = @fecha, ingresos = @ingresos, egresos = @egresos, balance = @balance
        OUTPUT INSERTED.*
        WHERE id = @id
      `;

      const result = await dbService.executeQuery(query, {
        id,
        fecha,
        ingresos: parseFloat(ingresos),
        egresos: parseFloat(egresos),
        balance
      });

      return {
        success: true,
        data: result.data[0],
        message: 'Balance actualizado correctamente'
      };
    } catch (error) {
      console.error('❌ Error actualizando balance:', error);
      return { success: false, error: error.message };
    }
  }

  // 🗑️ ELIMINAR TRANSACCIÓN
  async deleteTransaccion(id) {
    try {
      // Obtener transacción para saber la fecha
      const transaccion = await dbService.executeQuery(
        'SELECT * FROM Transacciones WHERE id = @id',
        { id }
      );

      if (!transaccion.data.length) {
        throw new Error('Transacción no encontrada');
      }

      const query = 'DELETE FROM Transacciones WHERE id = @id';
      const result = await dbService.executeQuery(query, { id });

      // Actualizar balances después de eliminar
      await this.actualizarBalance(transaccion.data[0].fecha);

      return {
        success: true,
        message: 'Transacción eliminada correctamente',
        affectedRows: result.rowsAffected
      };
    } catch (error) {
      console.error('❌ Error eliminando transacción:', error);
      return { success: false, error: error.message };
    }
  }

  // 🗑️ ELIMINAR BALANCE
  async deleteBalance(id) {
    try {
      const query = 'DELETE FROM Balances WHERE id = @id';
      const result = await dbService.executeQuery(query, { id });

      return {
        success: true,
        message: 'Balance eliminado correctamente',
        affectedRows: result.rowsAffected
      };
    } catch (error) {
      console.error('❌ Error eliminando balance:', error);
      return { success: false, error: error.message };
    }
  }

  // 🔄 ACTUALIZAR BALANCE AUTOMÁTICAMENTE
  async actualizarBalance(fecha) {
    try {
      const fechaDate = new Date(fecha);
      const fechaInicio = new Date(fechaDate.getFullYear(), fechaDate.getMonth(), fechaDate.getDate());
      const fechaFin = new Date(fechaDate.getFullYear(), fechaDate.getMonth(), fechaDate.getDate() + 1);

      const query = `
        SELECT 
          SUM(CASE WHEN tipo IN ('ingreso', 'venta') THEN monto ELSE 0 END) as ingresos,
          SUM(CASE WHEN tipo IN ('egreso', 'compra', 'gasto') THEN monto ELSE 0 END) as egresos
        FROM Transacciones 
        WHERE fecha >= @fechaInicio AND fecha < @fechaFin
      `;

      const result = await dbService.executeQuery(query, {
        fechaInicio,
        fechaFin
      });

      const ingresos = result.data[0]?.ingresos || 0;
      const egresos = result.data[0]?.egresos || 0;
      const balance = parseFloat(ingresos) - parseFloat(egresos);

      // Insertar o actualizar balance
      await this.insertBalance({
        fecha: fechaInicio,
        ingresos,
        egresos
      });

      console.log(`✅ Balance actualizado para ${fechaInicio.toISOString().split('T')[0]}: $${balance}`);
      
    } catch (error) {
      console.error('❌ Error actualizando balance:', error);
    }
  }

  // 📊 OBTENER ESTADÍSTICAS
  async getEstadisticas(periodo = 'mes') {
    try {
      let groupBy, whereClause = '';
      const now = new Date();

      if (periodo === 'mes') {
        const inicioMes = new Date(now.getFullYear(), now.getMonth(), 1);
        whereClause = ' WHERE fecha >= @inicioMes';
        groupBy = 'GROUP BY DAY(fecha)';
      } else if (periodo === 'año') {
        const inicioAño = new Date(now.getFullYear(), 0, 1);
        whereClause = ' WHERE fecha >= @inicioAño';
        groupBy = 'GROUP BY MONTH(fecha)';
      }

      const query = `
        SELECT 
          ${periodo === 'mes' ? 'DAY(fecha) as dia' : 'MONTH(fecha) as mes'},
          SUM(ingresos) as total_ingresos,
          SUM(egresos) as total_egresos,
          SUM(balance) as total_balance
        FROM Balances 
        ${whereClause}
        ${groupBy}
        ORDER BY ${periodo === 'mes' ? 'dia' : 'mes'}
      `;

      const result = await dbService.executeQuery(query, periodo === 'mes' ? 
        { inicioMes: new Date(now.getFullYear(), now.getMonth(), 1) } : 
        { inicioAño: new Date(now.getFullYear(), 0, 1) }
      );

      return {
        success: true,
        data: result.data,
        periodo
      };
    } catch (error) {
      console.error('❌ Error obteniendo estadísticas:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new AccountingService();