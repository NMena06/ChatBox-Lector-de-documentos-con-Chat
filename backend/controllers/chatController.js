const { v4: uuidv4 } = require('uuid');
const aiService = require('../services/aiService');
const dbService = require('../services/dbService');
const embeddingService = require('../services/embeddingService');
const webSearchService = require('../services/webSearchService');
const sqlScriptService = require('../services/sqlScriptService');
const accountingService = require('../services/accountingService');

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

      let response;

      // 🌐 DETECTAR BÚSQUEDA WEB PRIMERO
if (this.isAccountingQuery(userMessage)) {
  response = await this.handleAccountingQuery(userMessage);
}
else {
        const schema = await dbService.getSchema();
        const intent = await aiService.interpretIntent(userMessage, schema);
        
        console.log('🎯 Intención detectada:', intent);

        if (intent.action !== 'none' && intent.action !== 'web_search') {
          response = await this.executeDatabaseOperation(intent, schema, userMessage);
          
          // Mostrar script generado (para transparencia)
          if (intent.action !== 'select') {
            try {
              const generatedScript = sqlScriptService.generateScriptFromIntent(intent, schema);
              response += `\n\n🔧 **Script ejecutado:**\n\`\`\`sql\n${generatedScript}\n\`\`\``;
            } catch (scriptError) {
              console.log('No se pudo mostrar el script:', scriptError);
            }
          }
        } else {
          // 🔍 BÚSQUEDA SEMÁNTICA COMO FALLBACK
          const searchResult = await embeddingService.answerQuery(userMessage);
          response = searchResult.text;
        }
      }

      // Guardar en historial de conversación
      conversation.push({ role: 'assistant', content: response });
      
      // Guardar en base de datos
      await this.saveToChatHistory(conversationId, 'user', userMessage);
      await this.saveToChatHistory(conversationId, 'assistant', response);

      return {
        conversationId,
        response: {
          text: response,
          sources: [],
          timestamp: new Date().toISOString()
        }
      };

    } catch (error) {
      console.error('❌ Error en ChatController:', error);
      
      const errorResponse = `⚠️ Lo siento, ocurrió un error procesando tu consulta.\n\n**Error:** ${error.message}\n\n💡 **Sugerencias:**\n• Verifica tu conexión a internet\n• Intenta reformular tu consulta\n• Para búsquedas web, usa términos específicos`;
      
      return {
        conversationId: conversationId || uuidv4(),
        response: {
          text: errorResponse,
          sources: [],
          timestamp: new Date().toISOString()
        }
      };
    }
  }
isAccountingQuery(message) {
  const lower = message.toLowerCase();
  const accountingKeywords = [
    'balance', 'contabilidad', 'ingresos', 'egresos', 
    'ventas del mes', 'reporte financiero', 'estado financiero'
  ];
  return accountingKeywords.some(keyword => lower.includes(keyword));
}

async handleAccountingQuery(query) {
  try {
    const lowerQuery = query.toLowerCase();
    
    if (lowerQuery.includes('balance') || lowerQuery.includes('estado financiero')) {
      const balance = await accountingService.getBalance();
      if (balance.success) {
        return this.formatBalanceResponse(balance.balance);
      }
    }
    
    if (lowerQuery.includes('ventas del mes')) {
      const currentDate = new Date();
      const report = await accountingService.generateFinancialReport(
        currentDate.getMonth() + 1,
        currentDate.getFullYear()
      );
      if (report.success) {
        return this.formatSalesReport(report.reporte);
      }
    }
    
    return "No entendí el comando de contabilidad. Puedo ayudarte con: balance, ventas del mes, reporte financiero.";
    
  } catch (error) {
    console.error('❌ Error en consulta contable:', error);
    return `Error procesando consulta contable: ${error.message}`;
  }
}

formatBalanceResponse(balance) {
  return `💰 **Estado Financiero - MvRodados**

**Ingresos Totales:** $${balance.ingresos.toLocaleString('es-AR')}
**Egresos Totales:** $${balance.egresos.toLocaleString('es-AR')}
**Balance Neto:** $${balance.balance.toLocaleString('es-AR')}

**Desglose por Categoría:**
${balance.transacciones.map(t => 
  `• ${t.categoria}: $${parseFloat(t.total).toLocaleString('es-AR')} (${t.cantidad} transacciones)`
).join('\n')}

*Reporte generado el ${new Date().toLocaleDateString('es-AR')}*`;
}

formatSalesReport(reporte) {
  return `📊 **Reporte de Ventas - ${reporte.periodo.mes}/${reporte.periodo.año}**

**Ventas del Mes:**
• Total de ventas: ${reporte.ventas.total_ventas}
• Monto total: $${parseFloat(reporte.ventas.total_ventas_monto).toLocaleString('es-AR')}
• Ventas promedio: $${parseFloat(reporte.resumen.ventas_promedio).toLocaleString('es-AR')}

**Rentabilidad:** ${reporte.resumen.rentabilidad}

**Recomendaciones:**
${reporte.resumen.recomendaciones.map(rec => `• ${rec}`).join('\n')}`;
}
  isWebSearchQuery(message) {
    const lower = message.toLowerCase();
    const webKeywords = [
      'buscar', 'precio de', 'precio', 'cotizar', 
      'mercado libre', 'mercadolibre', 'ml',
      'cuanto sale', 'cuánto sale', 'valor de'
    ];
    
    const excludeKeywords = [
      'cliente', 'moto', 'accesorio', 'casco', 
      'tabla', 'base de datos', 'registro'
    ];
    
    const hasWebKeyword = webKeywords.some(keyword => lower.includes(keyword));
    const hasExcludeKeyword = excludeKeywords.some(exclude => lower.includes(exclude));
    
    return hasWebKeyword && !hasExcludeKeyword;
  }

  extractSearchQuery(message) {
    // Limpiar y extraer los términos de búsqueda relevantes
    return message
      .replace(/buscar|precio de|precio|cotizar|en mercadolibre|en internet|cuanto sale|cuánto sale|valor de/gi, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  async executeDatabaseOperation(intent, schema, originalMessage) {
    try {
      // Generar script SQL automáticamente
      const sqlScript = sqlScriptService.generateScriptFromIntent(intent, schema);
      console.log(`🛠️ Ejecutando script: ${sqlScript}`);

      let result;
      
      switch (intent.action) {
        case 'select':
          result = await dbService.executeQuery(sqlScript);
          return this.formatSelectResponse(result, intent.table, originalMessage);
          
        case 'insert':
          result = await dbService.executeQuery(sqlScript);
          return `✅ **Registro insertado en ${intent.table}**\n\n📋 **Datos insertados:**\n${Object.entries(intent.data).map(([key, value]) => `• ${key}: ${value}`).join('\n')}`;
          
        case 'update':
          result = await dbService.executeQuery(sqlScript);
          return `✅ **Registro actualizado en ${intent.table}**\n\n🔄 **Cambios realizados:**\n${Object.entries(intent.data).map(([key, value]) => `• ${key}: ${value}`).join('\n')}\n\n📌 **Condición:** ${intent.condition}`;
          
        case 'delete':
          result = await dbService.executeQuery(sqlScript);
          return `✅ **Registro eliminado de ${intent.table}**\n\n🗑️ **Condición de eliminación:** ${intent.condition}`;
          
        default:
          return "No entendí la operación que quieres realizar.";
      }
    } catch (error) {
      throw new Error(`Error en operación de base de datos: ${error.message}`);
    }
  }

  formatSelectResponse(result, tableName, originalMessage) {
    if (!result.data || result.data.length === 0) {
      return `📊 **${tableName}** - No se encontraron registros para tu búsqueda.\n\n💡 **Sugerencia:** Prueba con criterios de búsqueda diferentes o verifica los nombres de las tablas.`;
    }

    let formatted = `📊 **${tableName}** - ${result.data.length} registros encontrados:\n\n`;
    
    // Mostrar máximo 5 registros para no saturar
    const displayData = result.data.slice(0, 5);
    
    displayData.forEach((record, index) => {
      formatted += `**Registro ${index + 1}:**\n`;
      Object.entries(record).forEach(([key, value]) => {
        if (value !== null && value !== '' && value !== undefined) {
          formatted += `• ${key}: ${value}\n`;
        }
      });
      formatted += '\n';
    });

    if (result.data.length > 5) {
      formatted += `\n... y ${result.data.length - 5} registros más.\n`;
    }

    return formatted;
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

  getAvailableScripts() {
    return sqlScriptService.getAvailableScripts();
  }

  async executeSpecificScript(scriptName, params = {}) {
    try {
      const script = sqlScriptService.getScript(scriptName, ...Object.values(params));
      const result = await dbService.executeQuery(script);
      return {
        success: true,
        data: result.data,
        script: script,
        message: `Script ${scriptName} ejecutado correctamente`
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = new ChatController();