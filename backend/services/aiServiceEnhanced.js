const Groq = require("groq-sdk");
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

class EnhancedAIService {
  constructor() {
    this.model = "llama-3.1-8b-instant";
  }

  async interpretIntent(query, schema) {
    const schemaInfo = this.formatSchemaForPrompt(schema);
    
    const prompt = `
ANALIZA LA CONSULTA DEL USUARIO Y GENERA UN JSON CON LA ACCIÓN A REALIZAR.

CONTEXTO: Eres un asistente especializado en MvRodados, una tienda de motos, bicicletas, accesorios e indumentaria.

ESQUEMA DE BASE DE DATOS DISPONIBLE:
${schemaInfo}

CONSULTA DEL USUARIO: "${query}"

INSTRUCCIONES ESPECÍFICAS:
1. Para comprobantes: Siempre usar id_tipo_comprobante (número) en lugar de texto
2. Para clientes: Usar id_cliente cuando se mencione un cliente
3. Para fechas: Formato YYYY-MM-DD
4. Para montos: Siempre números, sin símbolos de moneda

TABLAS PRINCIPALES Y SUS RELACIONES:
- Comprobantes: relacionada con Clientes (id_cliente) y TipoComprobante (id_tipo_comprobante)
- Clientes: información de clientes
- TipoComprobante: tipos de comprobantes disponibles
- Productos, Motos, Accesorios: catálogo de productos

RESPONDER SOLO CON JSON VÁLIDO:

PARA COMPROBANTES (INSERT):
{
  "action": "insert",
  "table": "Comprobantes", 
  "data": {
    "id_tipo_comprobante": 1,
    "id_cliente": 123,
    "numero": "FAC-001",
    "fecha": "2024-01-15",
    "total": 150000.00,
    "estado": "Pendiente",
    "observaciones": "Texto descriptivo"
  }
}

PARA CLIENTES (INSERT):
{
  "action": "insert",
  "table": "Clientes",
  "data": {
    "nombre": "Juan",
    "apellido": "Pérez",
    "email": "juan@email.com",
    "telefono": "123456789"
  }
}

PARA SELECT:
{
  "action": "select",
  "table": "NombreTabla",
  "condition": "condición SQL",
  "fields": ["campo1", "campo2"],
  "limit": 10
}

SI NO ES OPERACIÓN DE BD:
{
  "action": "none"
}

IMPORTANTE: 
- Usar siempre IDs numéricos para relaciones
- Fechas en formato YYYY-MM-DD
- Montos como números decimales
- Responde ÚNICAMENTE con JSON válido

EJEMPLOS:
"crear factura A para cliente Carlos López por $50000" -> 
{
  "action": "insert",
  "table": "Comprobantes",
  "data": {
    "id_tipo_comprobante": 1,
    "id_cliente": 15,
    "numero": "FAC-A-001",
    "fecha": "2024-01-15",
    "total": 50000.00,
    "estado": "Pendiente"
  }
}

"agregar cliente María Gonzalez" ->
{
  "action": "insert", 
  "table": "Clientes",
  "data": {
    "nombre": "María",
    "apellido": "Gonzalez"
  }
}
`;

    try {
      const response = await this.generateResponse([
        { role: "user", content: prompt }
      ], 0.1, 1000);

      console.log("🤖 Respuesta RAW mejorada:", response);

      const jsonStr = this.extractPureJSON(response);
      
      if (!jsonStr) {
        return this.enhancedFallback(query, schema);
      }

      const parsed = JSON.parse(jsonStr);
      console.log("🎯 Interpretación mejorada:", parsed);
      return parsed;

    } catch (error) {
      console.error('❌ Error en IA mejorada:', error);
      return this.enhancedFallback(query, schema);
    }
  }

  enhancedFallback(query, schema) {
    const lowerQuery = query.toLowerCase();
    
    // Detección mejorada de comprobantes
    if (lowerQuery.includes('factura') || lowerQuery.includes('comprobante') || 
        lowerQuery.includes('presupuesto') || lowerQuery.includes('remito')) {
      
      const tipoMap = {
        'factura a': 1, 'factura b': 2, 'factura c': 3,
        'presupuesto': 4, 'remito': 5, 'nota de crédito': 6,
        'nota de débito': 7, 'recibo': 8, 'pedido': 9
      };

      let id_tipo = 1; // Default Factura A
      for (const [key, value] of Object.entries(tipoMap)) {
        if (lowerQuery.includes(key)) {
          id_tipo = value;
          break;
        }
      }

      return {
        action: "insert",
        table: "Comprobantes",
        data: {
          id_tipo_comprobante: id_tipo,
          estado: "Pendiente",
          fecha: new Date().toISOString().split('T')[0]
        }
      };
    }

    // Fallback original mejorado
    const originalFallback = this.fallbackIntentDetection(query);
    if (originalFallback.action !== "none") {
      return originalFallback;
    }

    return { action: "none" };
  }

  // ... (mantener los otros métodos del AIService original)
}

module.exports = new EnhancedAIService();