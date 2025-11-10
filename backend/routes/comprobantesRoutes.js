const express = require('express');
const router = express.Router();
const comprobanteController = require('../controllers/comprobantesController');

// Tipos de comprobante
router.get('/comprobantes/tipos', comprobanteController.getTiposComprobante);

// CRUD de comprobantes
router.get('/comprobantes', comprobanteController.getComprobantes);
router.post('/comprobantes', comprobanteController.createComprobante);
router.put('/comprobantes/:id', comprobanteController.updateComprobante);
router.delete('/comprobantes/:id', comprobanteController.deleteComprobante);

// Estadísticas
router.get('/comprobantes/estadisticas', comprobanteController.getEstadisticas);
router.get('/comprobantes/proximo-numero/:tipoId', comprobanteController.getProximoNumero);


// ✅ Nueva ruta: obtener tipos de comprobantes
router.get('/tipos', async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query('SELECT id, nombre FROM TipoComprobante');
    res.json(result.recordset);
  } catch (err) {
    console.error('Error al obtener tipos de comprobantes:', err);
    res.status(500).json({ error: 'Error al obtener tipos de comprobantes' });
  }
});

module.exports = router;
