require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

// Importar rutas
const chatRoutes = require('./routes/chatRoutes');
const crudRoutes = require('./routes/crudRoutes');
const articulosRoutes = require('./routes/articulos'); // 🔥 NUEVA RUTA
const accountingRoutes = require('./routes/accountingRoutes'); // Si tienes rutas de contabilidad
// const comprobantesRoutes = require('./routes/comprobantesRoutes');
const comprobanteRoutes = require('./routes/comprobantesRoutes');

// Importar servicios para inicialización
const { Database } = require('./config/database');

const app = express();

// Middlewares
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use('/api', comprobanteRoutes); // ✅ debería ser así
// Rutas
app.use('/api', chatRoutes);
app.use('/api', crudRoutes);
app.use('/api', articulosRoutes); // 🔥 AGREGAR ESTA LÍNEA
// app.use('/api', accountingRoutes); // Si tienes contabilidad

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'AI Database Assistant'
  });
});

// Ruta de inicio
app.get('/', (req, res) => {
  res.json({
    message: '🚀 AI Database Assistant API',
    version: '2.0.0',
    endpoints: {
      chat: 'POST /api/chat',
      history: 'GET /api/history/:conversationId',
      tables: 'GET /api/tables',
      tableData: 'GET /api/tables/:tableName',
      schema: 'GET /api/schema',
      articulos: 'GET /api/articulos/tipos', // 🔥 NUEVO ENDPOINT
      tiposArticulo: 'GET /api/articulos/tipos' // 🔥 NUEVO ENDPOINT
    }
  });
});

// Manejo de errores global
app.use((error, req, res, next) => {
  console.error('❌ Error global:', error);
  res.status(500).json({
    success: false,
    error: 'Error interno del servidor',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
  });
});

// Ruta no encontrada
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Ruta no encontrada'
  });
});

// Inicializar servidor
const PORT = process.env.PORT || 3001;

async function startServer() {
  try {
    // Conectar a la base de datos
    await Database.connect();
    
    // Iniciar servidor
    app.listen(PORT, () => {
      console.log(`🚀 Servidor ejecutándose en puerto ${PORT}`);
      console.log(`📊 Entorno: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 Health check: http://localhost:${PORT}/health`);
      console.log(`📦 Endpoint artículos: http://localhost:${PORT}/api/articulos/tipos`); // 🔥 NUEVO LOG
    });
  } catch (error) {
    console.error('❌ Error iniciando servidor:', error);
    process.exit(1);
  }
}

// Manejo graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🔻 Cerrando servidor...');
  await Database.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🔻 Cerrando servidor...');
  await Database.close();
  process.exit(0);
});

startServer();

module.exports = app;