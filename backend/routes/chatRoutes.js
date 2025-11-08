const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');

router.post('/chat', async (req, res) => {
  try {
    const { message, conversationId } = req.body;
    
    if (!message) {
      return res.status(400).json({ 
        error: 'El mensaje es requerido' 
      });
    }

    const result = await chatController.processMessage(message, conversationId);
    res.json(result);
  } catch (error) {
    console.error('❌ Error en /chat:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor: ' + error.message 
    });
  }
});

// 🆕 Historial global (para el frontend)
router.get('/history', async (req, res) => {
  try {
    const dbService = require('../services/dbService');
    const result = await dbService.executeQuery(`
      SELECT * FROM ChatHistory 
      ORDER BY createdAt ASC
    `);
    
    res.json({
      success: true,
      history: result.data.map(msg => ({
        role: msg.role,
        message: msg.message,
        sources: msg.sources,
        createdAt: msg.createdAt
      }))
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.get('/history/:conversationId', async (req, res) => {
  try {
    const { conversationId } = req.params;
    const history = await chatController.getConversationHistory(conversationId);
    res.json({ success: true, history });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

router.delete('/history/:conversationId', async (req, res) => {
  try {
    const { conversationId } = req.params;
    chatController.clearConversation(conversationId);
    res.json({ success: true, message: 'Historial limpiado' });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

module.exports = router;