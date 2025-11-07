// backend/server.js
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { getAuthUrl, getOAuth2Client } = require('./googleAuth');
const { indexDriveFiles } = require('./indexer');
const { answerQuery } = require('./embeddings');
const { getIndexedDocs } = require('./embeddings');

const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));

// 🔐 Paso 1: Obtener URL de autenticación de Google
app.get('/auth/url', (req, res) => {
  const url = getAuthUrl();
  res.json({ url });
});

// 🔑 Paso 2: Callback de OAuth2
app.get('/oauth2callback', async (req, res) => {
  const code = req.query.code;
  if (!code) return res.status(400).send('No se recibió el código de autorización');
  try {
    const oAuth2Client = getOAuth2Client();
    const { tokens } = await oAuth2Client.getToken(code);
    res.json({ tokens });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error al intercambiar el token');
  }
});

// 🗂️ Paso 3: Indexar archivos de Drive
app.post('/index', async (req, res) => {
  const { tokens } = req.body;
  if (!tokens) return res.status(400).send('No se recibieron tokens');
  try {
    await indexDriveFiles(tokens);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// 💬 Paso 4: Chat con embeddings gratuitos
app.post("/chat", async (req, res) => {
  const { query, fileName } = req.body;
  if (!query) return res.status(400).send("No query");

  try {
    const response = await answerQuery(query, fileName); // enviamos el PDF específico
    res.json({ response });
  } catch (err) {
    console.error("❌ Error en /chat:", err);
    res.status(500).json({ error: err.message });
  }
});



const port = process.env.PORT || 3001;
app.listen(port, () => console.log('✅ Server escuchando en puerto', port));
