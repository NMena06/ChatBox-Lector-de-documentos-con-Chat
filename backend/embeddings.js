// embeddings.js
const Groq = require("groq-sdk");
const fs = require("fs");
const path = require("path");
const pdfParse = require("pdf-parse");
const mammoth = require("mammoth");
const xlsx = require("xlsx");

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const CHUNK_SIZE = 1500;
const TOP_K = 3;

function splitIntoChunks(text) {
  const chunks = [];
  for (let i = 0; i < text.length; i += CHUNK_SIZE) {
    chunks.push(text.slice(i, i + CHUNK_SIZE));
  }
  return chunks;
}

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

// Extraer texto de Word
async function readDocx(filePath) {
  const { value } = await mammoth.extractRawText({ path: filePath });
  return value;
}

// Extraer texto de Excel
function readExcel(filePath) {
  const wb = xlsx.readFile(filePath);
  let text = "";
  wb.SheetNames.forEach(sheet => {
    const data = xlsx.utils.sheet_to_csv(wb.Sheets[sheet]);
    text += data + "\n";
  });
  return text;
}

async function answerQuery(query, fileName = null) {
  const folder = path.join(__dirname, "drive_pdfs");
  if (!fs.existsSync(folder)) return { text: "No hay documentos disponibles.", sources: [] };

  const files = fs.readdirSync(folder);
  if (!files.length) return { text: "No hay documentos en la carpeta.", sources: [] };

  let allChunks = [];

  const processFile = async (file) => {
    const ext = path.extname(file).toLowerCase();
    const filePath = path.join(folder, file);
    let text = "";

    try {
      if (ext === ".pdf") {
        const dataBuffer = fs.readFileSync(filePath);
        text = (await pdfParse(dataBuffer)).text;
      } else if (ext === ".docx") {
        text = await readDocx(filePath);
      } else if (ext === ".xlsx" || ext === ".xls") {
        text = readExcel(filePath);
      } else return;
    } catch (err) {
      console.error(`Error leyendo ${file}:`, err.message);
      return;
    }

    splitIntoChunks(text).forEach(chunk => {
      allChunks.push({ name: file, content: chunk });
    });
  };

  if (fileName) {
    const targetFile = files.find(f => f === fileName);
    if (!targetFile) return { text: `No se encontró el archivo: ${fileName}`, sources: [] };
    await processFile(targetFile);
  } else {
    for (const file of files) await processFile(file);
  }

  const topChunks = rankChunks(query, allChunks);
  if (!topChunks.length) return { text: "No se encontraron fragmentos relevantes.", sources: [] };

  const context = topChunks.map(d => `${d.name}:\n${d.content}`).join("\n\n");

  try {
    const response = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        { role: "system", content: "Respondé solo basándote en los documentos disponibles." },
        { role: "user", content: `Documentos relevantes:\n${context}\n\nPregunta: ${query}` }
      ]
    });

    // Mandamos el texto y los nombres de los documentos usados como "fuentes"
    return { 
      text: response.choices[0].message.content,
      sources: topChunks.map(c => ({ name: c.name })) 
    };
  } catch (err) {
    console.error("Error en Groq:", err.message);
    return { text: "Error generando la respuesta. Puede ser que el contenido sea muy grande.", sources: [] };
  }
}

module.exports = { answerQuery };
