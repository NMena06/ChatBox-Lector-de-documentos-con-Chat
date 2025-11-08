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
`;

    try {
      const response = await this.generateResponse([
        { role: "user", content: prompt }
      ], 0.1, 800);

      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) return { action: "none" };

      let jsonStr = jsonMatch[0]
        .replace(/'/g, '"')
        .replace(/(\w+):/g, '"$1":')
        .replace(/,\s*}/g, '}')
        .replace(/,\s*\]/g, ']');

      return JSON.parse(jsonStr);
    } catch (error) {
      console.error('❌ Error interpretando intención:', error);
      return { action: "none" };
    }
  }

  async webSearch(query) {
    const prompt = `El usuario quiere buscar: "${query}"
    
Simula una búsqueda web real y proporciona información útil sobre precios, características, disponibilidad, etc.

Responde en español de manera natural como si estuvieras mostrando resultados de búsqueda.`;

    return await this.generateResponse([
      { role: "user", content: prompt }
    ], 0.7, 800);
  }
}

module.exports = new AIService();