const express = require('express');
const router = express.Router();
const articulosController = require('../controllers/articulosController');

// Tipos de artículo
router.get('/articulos/tipos', articulosController.getTiposArticulo);
router.post('/articulos/tipos', articulosController.createTipoArticulo);

// Artículos
router.get('/articulos', articulosController.getArticulos);

// Estadísticas
router.get('/articulos/estadisticas', articulosController.getEstadisticas);

module.exports = router;