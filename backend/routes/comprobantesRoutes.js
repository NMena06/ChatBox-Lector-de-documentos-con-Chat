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
module.exports = router;