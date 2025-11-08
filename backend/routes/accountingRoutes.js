const express = require('express');
const router = express.Router();
const accountingService = require('../services/accountingService');

// 🔍 OBTENER TRANSACCIONES
router.get('/transacciones', async (req, res) => {
  try {
    const { tipo, fechaDesde, fechaHasta } = req.query;
    const filters = { tipo, fechaDesde, fechaHasta };
    
    const result = await accountingService.getTransacciones(filters);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('❌ Error en GET /transacciones:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 🔍 OBTENER BALANCES
router.get('/balances', async (req, res) => {
  try {
    const { fechaDesde, fechaHasta } = req.query;
    const filters = { fechaDesde, fechaHasta };
    
    const result = await accountingService.getBalances(filters);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('❌ Error en GET /balances:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ➕ INSERTAR TRANSACCIÓN
router.post('/transacciones', async (req, res) => {
  try {
    const transaccionData = req.body;
    const result = await accountingService.insertTransaccion(transaccionData);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('❌ Error en POST /transacciones:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ➕ INSERTAR BALANCE
router.post('/balances', async (req, res) => {
  try {
    const balanceData = req.body;
    const result = await accountingService.insertBalance(balanceData);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('❌ Error en POST /balances:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ✏️ ACTUALIZAR TRANSACCIÓN
router.put('/transacciones/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const transaccionData = req.body;
    const result = await accountingService.updateTransaccion(id, transaccionData);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('❌ Error en PUT /transacciones/:id:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ✏️ ACTUALIZAR BALANCE
router.put('/balances/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const balanceData = req.body;
    const result = await accountingService.updateBalance(id, balanceData);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('❌ Error en PUT /balances/:id:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 🗑️ ELIMINAR TRANSACCIÓN
router.delete('/transacciones/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await accountingService.deleteTransaccion(id);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('❌ Error en DELETE /transacciones/:id:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 🗑️ ELIMINAR BALANCE
router.delete('/balances/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await accountingService.deleteBalance(id);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('❌ Error en DELETE /balances/:id:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 📊 OBTENER ESTADÍSTICAS
router.get('/estadisticas', async (req, res) => {
  try {
    const { periodo = 'mes' } = req.query;
    const result = await accountingService.getEstadisticas(periodo);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('❌ Error en GET /estadisticas:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;