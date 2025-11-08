const Groq = require("groq-sdk");
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

class AIService {
  constructor() {
    this.model = "llama-3.1-8b-instant";
  }

  async generateResponse(messages, temperature = 0.7, maxTokens = 1000) {
    try {
      const completion = await groq.chat.completions.create({
        model: this.model,
        messages: messages,
        temperature: temperature,
        max_tokens: maxTokens
      });

      return completion.choices[0].message.content;
    } catch (error) {
      console.error('❌ Error en AI Service:', error);
      throw new Error(`Error generando respuesta: ${error.message}`);
    }
  }

  async interpretIntent(query, schema) {
    const schemaInfo = Object.entries(schema).map(([tableName, columns]) => {
      return `${tableName}: ${columns.map(col => 
        `${col.name} (${col.type}${col.nullable ? ', nullable' : ', required'})`
      ).join(', ')}`;
    }).join('\n');

    const prompt = `
ANALIZA LA CONSULTA DEL USUARIO Y GENERA UN JSON CON LA ACCIÓN A REALIZAR.

ESQUEMA DE BASE DE DATOS:
${schemaInfo}

CONSULTA: "${query}"

RESPONDER SOLO CON JSON VÁLIDO:

PARA SELECT:
{
  "action": "select",
  "table": "NombreTabla",
  "condition": "condición SQL",
  "fields": ["campo1", "campo2"],
  "limit": 10
}

PARA INSERT:
{
  "action": "insert", 
  "table": "NombreTabla",
  "data": {
    "campo1": "valor1",
    "campo2": "valor2"
  }
}

PARA UPDATE:
{
  "action": "update",
  "table": "NombreTabla", 
  "data": {
    "campo": "nuevo_valor"
  },
  "condition": "condición WHERE"
}

PARA DELETE:
{
  "action": "delete",
  "table": "NombreTabla",
  "condition": "condición WHERE"
}

SI NO ES OPERACIÓN DE BD:
{
  "action": "none"
}

IMPORTANTE: Responde ÚNICAMENTE con el JSON válido, sin texto adicional, sin code blocks, sin explicaciones.
`;

    try {
      const response = await this.generateResponse([
        { role: "user", content: prompt }
      ], 0.1, 800);

      console.log("🤖 Respuesta RAW de Groq:", response);

      // Extraer JSON de manera más robusta
      const jsonStr = this.extractPureJSON(response);
      
      if (!jsonStr) {
        console.warn("No se pudo extraer JSON, usando fallback");
        return this.fallbackIntentDetection(query);
      }

      console.log("🔧 JSON extraído:", jsonStr);
      
      const parsed = JSON.parse(jsonStr);
      console.log("🎯 Interpretación final:", parsed);
      return parsed;

    } catch (error) {
      console.error('❌ Error interpretando intención:', error);
      return this.fallbackIntentDetection(query);
    }
  }

  extractPureJSON(text) {
    // Intentar parsear directamente primero
    try {
      const directParse = JSON.parse(text.trim());
      return text.trim();
    } catch (e) {
      // Si falla, buscar JSON en el texto
    }

    // Buscar el primer { y el último }
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    
    if (start === -1 || end === -1) {
      return null;
    }

    let jsonStr = text.substring(start, end + 1);
    
    // Limpiar el JSON
    jsonStr = jsonStr
      .replace(/[\r\n\t]/g, ' ')
      .replace(/\s+/g, ' ')
      .replace(/'/g, '"')
      .replace(/([{\[,])\s*([a-zA-Z0-9_]+)\s*:/g, '$1"$2":')
      .replace(/:\s*'([^']*)'/g, ':"$1"')
      .replace(/,\s*}/g, '}')
      .replace(/,\s*]/g, ']');

    return jsonStr;
  }

  fallbackIntentDetection(query) {
    const lowerQuery = query.toLowerCase();
    
    // Detección básica de intenciones
    if (lowerQuery.includes('buscar') && 
        (lowerQuery.includes('precio') || lowerQuery.includes('mercadolibre'))) {
      return { action: "web_search" };
    }

    if (lowerQuery.includes('ver') || lowerQuery.includes('mostrar') || lowerQuery.includes('listar')) {
      const table = this.detectTable(lowerQuery);
      return table ? { action: "select", table } : { action: "none" };
    }

    if (lowerQuery.includes('agregar') || lowerQuery.includes('insertar') || lowerQuery.includes('nuevo')) {
      const table = this.detectTable(lowerQuery);
      return table ? { action: "insert", table } : { action: "none" };
    }

    if (lowerQuery.includes('actualizar') || lowerQuery.includes('modificar') || lowerQuery.includes('editar')) {
      const table = this.detectTable(lowerQuery);
      return table ? { action: "update", table } : { action: "none" };
    }

    if (lowerQuery.includes('eliminar') || lowerQuery.includes('borrar')) {
      const table = this.detectTable(lowerQuery);
      return table ? { action: "delete", table } : { action: "none" };
    }

    return { action: "none" };
  }

  detectTable(query) {
    const tableMap = {
      'cliente': 'Clientes',
      'moto': 'Motos', 
      'accesorio': 'Accesorios',
      'casco': 'Cascos',
      'bicicleta': 'Bicicletas',
      'indumentaria': 'Indumentarias',
      'comprobante': 'Comprobantes',
      'lista': 'ListaPrecios',
      'precio': 'ListaPrecios'
    };

    for (const [keyword, table] of Object.entries(tableMap)) {
      if (query.includes(keyword)) {
        return table;
      }
    }
    return null;
  }

  async webSearch(query) {
    const prompt = `El usuario quiere buscar información actualizada sobre: "${query}"
    
Proporciona información real y útil basada en el mercado actual de Argentina. Incluye:

1. Precios aproximados en pesos argentinos (nuevo/usado)
2. Disponibilidad en Argentina
3. Características principales
4. Recomendaciones de compra para el mercado argentino

Responde en español de manera natural y útil, enfocado exclusivamente en Argentina.`;

    return await this.generateResponse([
      { role: "user", content: prompt }
    ], 0.7, 800);
  }
}

module.exports = new AIService();