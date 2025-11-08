const { v4: uuidv4 } = require('uuid');
const aiService = require('../services/aiService');
const dbService = require('../services/dbService');
const embeddingService = require('../services/embeddingService');

class ChatController {
  constructor() {
    this.conversations = new Map();
  }

  async processMessage(userMessage, conversationId = null) {
    try {
      // Generar o usar conversationId
      if (!conversationId) {
        conversationId = uuidv4();
      }

      if (!this.conversations.has(conversationId)) {
        this.conversations.set(conversationId, []);
      }

      const conversation = this.conversations.get(conversationId);
      conversation.push({ role: 'user', content: userMessage });

      // Obtener schema para interpretación
      const schema = await dbService.getSchema();
      
      // Determinar el tipo de consulta
      const intent = await aiService.interpretIntent(userMessage, schema);
      
      let response;

      if (intent.action !== 'none') {
        // Ejecutar operación en base de datos
        response = await this.executeDatabaseOperation(intent, schema);
      } else if (this.isWebSearchQuery(userMessage)) {
        // Búsqueda web simulada
        response = await aiService.webSearch(userMessage);
      } else {
        // Búsqueda semántica en base de datos
        const searchResult = await embeddingService.answerQuery(userMessage);
        response = searchResult.text;
      }

      // Guardar en historial de conversación
      conversation.push({ role: 'assistant', content: response });
      
      // Guardar en base de datos (opcional)
      await this.saveToChatHistory(conversationId, 'user', userMessage);
      await this.saveToChatHistory(conversationId, 'assistant', response);

      return {
        conversationId,
        response: {
          text: response,
          sources: []
        }
      };

    } catch (error) {
      console.error('❌ Error en ChatController:', error);
      
      const errorResponse = `⚠️ Lo siento, ocurrió un error: ${error.message}. Por favor, intenta de nuevo.`;
      
      return {
        conversationId: conversationId || uuidv4(),
        response: {
          text: errorResponse,
          sources: []
        }
      };
    }
  }

  async executeDatabaseOperation(intent, schema) {
    try {
      switch (intent.action) {
        case 'select':
          const selectResult = await dbService.selectRecords(
            intent.table, 
            intent.condition, 
            intent.fields, 
            intent.limit
          );
          return this.formatSelectResponse(selectResult, intent.table);
          
        case 'insert':
          const insertResult = await dbService.insertRecord(
            intent.table, 
            intent.data, 
            schema
          );
          return insertResult.message;
          
        case 'update':
          const updateResult = await dbService.updateRecord(
            intent.table, 
            intent.data, 
            intent.condition
          );
          return updateResult.message;
          
        case 'delete':
          const deleteResult = await dbService.deleteRecord(
            intent.table, 
            intent.condition
          );
          return deleteResult.message;
          
        default:
          return "No entendí la operación que quieres realizar.";
      }
    } catch (error) {
      throw new Error(`Error en operación de base de datos: ${error.message}`);
    }
  }

  formatSelectResponse(result, tableName) {
    if (!result.data || result.data.length === 0) {
      return `📊 **${tableName}** - No se encontraron registros.`;
    }

    let formatted = `📊 **${tableName}** - ${result.count} registros encontrados:\n\n`;
    
    result.data.slice(0, 5).forEach((record, index) => {
      formatted += `**Registro ${index + 1}:**\n`;
      Object.entries(record).forEach(([key, value]) => {
        if (value !== null && value !== '') {
          formatted += `• ${key}: ${value}\n`;
        }
      });
      formatted += '\n';
    });

    if (result.data.length > 5) {
      formatted += `\n... y ${result.data.length - 5} registros más.`;
    }

    return formatted;
  }

  isWebSearchQuery(message) {
    const lower = message.toLowerCase();
    return (lower.includes('buscar') || lower.includes('precio') || 
            lower.includes('mercado') || lower.includes('internet')) &&
           !lower.match(/\b(clientes?|motos?|accesorios?|cascos?|bicicletas?|indumentarias?|comprobantes?)\b/);
  }

  async saveToChatHistory(conversationId, role, message) {
    try {
      await dbService.executeQuery(
        `INSERT INTO ChatHistory (conversationId, role, message) VALUES (@conversationId, @role, @message)`,
        { conversationId, role, message }
      );
    } catch (error) {
      console.warn('⚠️ No se pudo guardar en historial:', error.message);
    }
  }

  async getConversationHistory(conversationId) {
    return this.conversations.get(conversationId) || [];
  }

  clearConversation(conversationId) {
    this.conversations.delete(conversationId);
  }
}

module.exports = new ChatController();