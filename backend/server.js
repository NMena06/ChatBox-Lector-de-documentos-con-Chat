require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { poolPromise } = require('./db');
const { answerQuery } = require('./embeddings');

const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));

// Obtener historial
app.get('/history', async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .query('SELECT * FROM ChatHistory ORDER BY createdAt ASC');
    res.json({ history: result.recordset });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener historial' });
  }
});

// Enviar consulta
app.post('/chat', async (req, res) => {
  const { query } = req.body;
  if (!query) return res.status(400).send("No query");

  try {
    await saveMessageToDB('user', query);

    const response = await answerQuery(query); // ahora lee de DB
    const { text, sources } = response || { text: 'Sin respuesta', sources: [] };

    await saveMessageToDB('assistant', text, sources);

    res.json({ response: { text, sources } });
  } catch (err) {
    console.error("❌ Error en /chat:", err);
    res.status(500).json({ error: err.message });
  }
});

// Guardar mensajes en DB
async function saveMessageToDB(role, message, sources = []) {
  try {
    const pool = await poolPromise;
    const sourcesStr = JSON.stringify(sources);
    await pool.request()
      .input('role', role)
      .input('message', message)
      .input('sources', sourcesStr)
      .query(`
        INSERT INTO ChatHistory (role, message, sources)
        VALUES (@role, @message, @sources)
      `);
  } catch (err) {
    console.error('❌ Error guardando en DB:', err);
  }
}

const port = process.env.PORT || 3001;
app.listen(port, () => console.log('✅ Server escuchando en puerto', port));
