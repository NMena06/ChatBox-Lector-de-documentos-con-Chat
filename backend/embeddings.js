require('dotenv').config();
const { poolPromise } = require('./db');
const Groq = require("groq-sdk");
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const CHUNK_SIZE = 1500;
const TOP_K = 3;

// Dividir texto en trozos
function splitIntoChunks(text) {
  const chunks = [];
  for (let i = 0; i < text.length; i += CHUNK_SIZE) {
    chunks.push(text.slice(i, i + CHUNK_SIZE));
  }
  return chunks;
}

// Rankear por relevancia
function rankChunks(query, chunks) {
  const qWords = query.toLowerCase().split(/\s+/);
  return chunks
    .map(chunk => {
      const cText = chunk.content.toLowerCase();
      let score = 0;
      for (const w of qWords) if (cText.includes(w)) score++;
      return { ...chunk, score };
    })
    .sort((a,b) => b.score - a.score)
    .slice(0, TOP_K);
}

// Consultar DB y generar respuesta
async function answerQuery(query, tablas = ['ms_ayuda', 'ms_ayuda_item', 'ms_ayuda_tipo_item']) {
  const pool = await poolPromise;
  let allChunks = [];

  for (const tabla of tablas) {
    const result = await pool.request().query(`SELECT * FROM ${tabla}`);
    const registros = result.recordset;

    registros.forEach(reg => {
      // Concatenamos todas las columnas como texto
      const text = Object.values(reg).join(" | ");
      splitIntoChunks(text).forEach(chunk => {
        allChunks.push({ name: tabla, content: chunk });
      });
    });
  }

  if (!allChunks.length) return { text: "No hay registros en la base de datos.", sources: [] };

  const topChunks = rankChunks(query, allChunks);
  if (!topChunks.length) return { text: "No se encontraron registros relevantes.", sources: [] };

  const context = topChunks.map(d => `${d.name}:\n${d.content}`).join("\n\n");

  try {
    const response = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        { role: "system", content: "Respondé solo basándote en los registros disponibles en la base de datos." },
        { role: "user", content: `Registros relevantes:\n${context}\n\nPregunta: ${query}` }
      ]
    });

    return {
      text: response.choices[0].message.content,
      sources: topChunks.map(c => ({ name: c.name }))
    };
  } catch (err) {
    console.error("Error en Groq:", err.message);
    return { text: "Error generando la respuesta.", sources: [] };
  }
}

module.exports = { answerQuery };
