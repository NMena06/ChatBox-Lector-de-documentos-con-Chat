const express = require('express');
const router = express.Router();
const crudController = require('../controllers/crudController');

// Obtener todas las tablas
router.get('/tables', crudController.getAllTables);

// CRUD para cualquier tabla
router.get('/tables/:tableName', crudController.getTableData);
router.post('/tables/:tableName', crudController.createRecord);
router.put('/tables/:tableName/:id', crudController.updateRecord);
router.delete('/tables/:tableName/:id', crudController.deleteRecord);

// Endpoint para schema
router.get('/schema/:tableName?', async (req, res) => {
  try {
    const dbService = require('../services/dbService');
    const schema = await dbService.getSchema();
    
    if (req.params.tableName) {
      res.json({ 
        success: true, 
        schema: schema[req.params.tableName] || null 
      });
    } else {
      res.json({ 
        success: true, 
        schema: schema 
      });
    }
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// 🆕 Endpoint para conversaciones (que espera el frontend)
router.get('/conversations', async (req, res) => {
  try {
    const dbService = require('../services/dbService');
    const result = await dbService.executeQuery(`
      SELECT DISTINCT conversationId, MAX(createdAt) as lastActivity,
      (SELECT TOP 1 message FROM ChatHistory h2 
       WHERE h2.conversationId = h1.conversationId 
       ORDER BY createdAt DESC) as lastMessage
      FROM ChatHistory h1
      GROUP BY conversationId
      ORDER BY lastActivity DESC
    `);
    
    res.json({
      success: true,
      conversations: result.data.map(conv => ({
        id: conv.conversationId,
        lastMessage: conv.lastMessage,
        lastActivity: conv.lastActivity
      }))
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;