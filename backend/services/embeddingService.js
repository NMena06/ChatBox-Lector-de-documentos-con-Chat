const dbService = require('./dbService');
const aiService = require('./aiService');

class EmbeddingService {
  constructor() {
    this.CHUNK_SIZE = 1500;
    this.TOP_K = 3;
    // Solo las tablas que existen en tu base de datos
    this.availableTables = [
      'Accesorios',
      'Bicicletas', 
      'Cascos',
      'Clientes',
      'Comprobantes',
      'Indumentarias',
      'ListaPrecios',
      'Motos',
      'ChatHistory'
    ];
  }

  splitIntoChunks(text) {
    const chunks = [];
    for (let i = 0; i < text.length; i += this.CHUNK_SIZE) {
      chunks.push(text.slice(i, i + this.CHUNK_SIZE));
    }
    return chunks;
  }

  rankChunks(query, chunks) {
    const qWords = query.toLowerCase().split(/\s+/);
    return chunks
      .map(chunk => {
        const cText = chunk.content.toLowerCase();
        let score = 0;
        for (const w of qWords) if (cText.includes(w)) score++;
        return { ...chunk, score };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, this.TOP_K);
  }

  async answerQuery(query, tablas = null) {
    // Usar solo las tablas disponibles si no se especifican
    const tablesToSearch = tablas || this.availableTables;
    let allChunks = [];

    for (const tabla of tablesToSearch) {
      try {
        // Limitar a 20 registros por tabla para no sobrecargar
        const result = await dbService.selectRecords(tabla, '', [], 20);
        const registros = result.data;

        registros.forEach(reg => {
          const text = Object.values(reg).join(" | ");
          this.splitIntoChunks(text).forEach(chunk => {
            allChunks.push({ name: tabla, content: chunk, record: reg });
          });
        });
      } catch (error) {
        console.warn(`⚠️ No se pudo acceder a la tabla ${tabla}:`, error.message);
      }
    }

    if (!allChunks.length) {
      return { text: "No hay registros en la base de datos para analizar.", sources: [] };
    }

    const topChunks = this.rankChunks(query, allChunks);
    if (!topChunks.length) {
      return { text: "No se encontraron registros relevantes en la base de datos.", sources: [] };
    }

    const context = topChunks.map(d => `${d.name}:\n${d.content}`).join("\n\n");

    try {
      const response = await aiService.generateResponse([
        { 
          role: "system", 
          content: `Eres un asistente especializado en la tienda MvRodados. 
          Responde solo basándote en los registros disponibles de las tablas: ${this.availableTables.join(', ')}.
          Si no hay información suficiente, indica que no puedes responder con los datos actuales.` 
        },
        { 
          role: "user", 
          content: `Registros relevantes encontrados:\n${context}\n\nPregunta: ${query}` 
        }
      ], 0.3, 800);

      return {
        text: response,
        sources: topChunks.map(c => ({ name: c.name, record: c.record }))
      };
    } catch (err) {
      console.error("❌ Error generando respuesta:", err.message);
      return { text: "Error generando la respuesta basada en los datos.", sources: [] };
    }
  }
}

module.exports = new EmbeddingService();