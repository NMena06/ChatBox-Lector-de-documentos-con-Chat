require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

// Importar rutas
const chatRoutes = require('./routes/chatRoutes');
const crudRoutes = require('./routes/crudRoutes');
const articulosRoutes = require('./routes/articulos'); // 🔥 NUEVA RUTA
const accountingRoutes = require('./routes/accountingRoutes'); // Si tienes rutas de contabilidad
const comprobantesRoutes = require('./routes/comprobantesRoutes');

// Importar servicios para inicialización
const { Database } = require('./config/database');

const app = express();

// Middlewares
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use('/api/comprobantes', comprobantesRoutes);
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
// require('dotenv').config();
// const express = require('express');
// const bodyParser = require('body-parser');
// const cors = require('cors');
// const { v4: uuidv4 } = require('uuid');
// const { poolPromise } = require('./db');
// const Groq = require("groq-sdk");

// const app = express();
// const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// app.use(cors());
// app.use(bodyParser.json({ limit: '10mb' }));

// let conversations = {};

// // 🗃️ Obtener estructura de tablas MEJORADO
// async function getDatabaseSchema() {
//   try {
//     const pool = await poolPromise;
    
//     const tablesResult = await pool.request().query(`
//       SELECT TABLE_NAME 
//       FROM INFORMATION_SCHEMA.TABLES 
//       WHERE TABLE_TYPE = 'BASE TABLE'
//       AND TABLE_NAME NOT IN ('ChatHistory', 'sysdiagrams')
//     `);
    
//     const schema = {};
    
//     for (const table of tablesResult.recordset) {
//       const tableName = table.TABLE_NAME;
      
//       const columnsResult = await pool.request().query(`
//         SELECT 
//           c.COLUMN_NAME,
//           c.DATA_TYPE,
//           c.IS_NULLABLE,
//           c.CHARACTER_MAXIMUM_LENGTH,
//           COLUMNPROPERTY(OBJECT_ID(c.TABLE_NAME), c.COLUMN_NAME, 'IsIdentity') AS IS_IDENTITY,
//           CASE WHEN pk.COLUMN_NAME IS NOT NULL THEN 1 ELSE 0 END AS IS_PRIMARY_KEY
//         FROM INFORMATION_SCHEMA.COLUMNS c
//         LEFT JOIN (
//           SELECT ku.TABLE_NAME, ku.COLUMN_NAME
//           FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS AS tc
//           JOIN INFORMATION_SCHEMA.KEY_COLUMN_USAGE AS ku
//             ON tc.CONSTRAINT_TYPE = 'PRIMARY KEY' 
//             AND tc.CONSTRAINT_NAME = ku.CONSTRAINT_NAME
//         ) pk ON c.TABLE_NAME = pk.TABLE_NAME AND c.COLUMN_NAME = pk.COLUMN_NAME
//         WHERE c.TABLE_NAME = '${tableName}'
//         ORDER BY c.ORDINAL_POSITION
//       `);
      
//       schema[tableName] = columnsResult.recordset.map(col => ({
//         name: col.COLUMN_NAME,
//         type: col.DATA_TYPE,
//         nullable: col.IS_NULLABLE === 'YES',
//         maxLength: col.CHARACTER_MAXIMUM_LENGTH,
//         isIdentity: col.IS_IDENTITY === 1,
//         isPrimaryKey: col.IS_PRIMARY_KEY === 1
//       }));
//     }
    
//     console.log("📋 Schema cargado:", Object.keys(schema));
//     return schema;
//   } catch (err) {
//     console.error('❌ Error obteniendo schema:', err);
//     return {};
//   }
// }

// // 🧠 Sistema MEJORADO de detección de intenciones
// function detectIntent(text) {
//   const lower = text.toLowerCase();
  
//   // Detectar consultas SELECT
//   if ((lower.includes('ver') || lower.includes('mostrar') || lower.includes('listar') || 
//        lower.includes('buscar') || lower.includes('consultar') || lower.includes('traer') ||
//        lower.includes('obtener') || lower.includes('cuales') || lower.includes('cuáles') ||
//        lower.includes('donde') || lower.includes('dónde')) &&
//       !lower.includes('agregar') && !lower.includes('insertar') && !lower.includes('nuevo')) {
    
//     // Mapeo de palabras clave a tablas
//     const tableMapping = {
//       'accesorio': 'Accesorios',
//       'casco': 'Cascos',
//       'bicicleta': 'Bicicletas',
//       'indumentaria': 'Indumentarias',
//       'ropa': 'Indumentarias',
//       'campera': 'Indumentarias',
//       'guante': 'Indumentarias',
//       'bota': 'Indumentarias',
//       'cliente': 'Clientes',
//       'moto': 'Motos',
//       'comprobante': 'Comprobantes',
//       'precio': 'ListaPrecios',
//       'lista': 'ListaPrecios',
//       'venta': 'Ventas',
//       'producto': 'Productos',
//       'usuario': 'Usuarios',
//       'ayuda': 'ms_ayuda',
//       'tipo': 'ms_ayuda_tipo_item',
//       'item': 'ms_ayuda_item'
//     };
    
//     for (const [keyword, table] of Object.entries(tableMapping)) {
//       if (lower.includes(keyword)) {
//         return `select_${table}`;
//       }
//     }
    
//     return 'select_generic';
//   }
  
//   // Detectar INSERT
//   if (lower.includes('agregar') || lower.includes('añadir') || lower.includes('nuevo') || 
//       lower.includes('insertar') || lower.includes('crear') || lower.includes('dar de alta')) {
    
//     const tableMapping = {
//       'cliente': 'Clientes',
//       'moto': 'Motos',
//       'comprobante': 'Comprobantes',
//       'precio': 'ListaPrecios',
//       'lista': 'ListaPrecios',
//       'casco': 'Cascos',
//       'bicicleta': 'Bicicletas',
//       'indumentaria': 'Indumentarias',
//       'accesorio': 'Accesorios',
//       'venta': 'Ventas',
//       'producto': 'Productos'
//     };
    
//     for (const [keyword, table] of Object.entries(tableMapping)) {
//       if (lower.includes(keyword)) {
//         return `insert_${table}`;
//       }
//     }
    
//     return 'insert_generic';
//   }
  
//   // Detectar UPDATE
//   if (lower.includes('actualizar') || lower.includes('modificar') || lower.includes('editar') || 
//       lower.includes('cambiar') || lower.includes('update')) {
//     return 'update_generic';
//   }
  
//   // Detectar DELETE
//   if (lower.includes('eliminar') || lower.includes('borrar') || lower.includes('quitar') || 
//       lower.includes('remover') || lower.includes('delete')) {
//     return 'delete_generic';
//   }
  
//   // Búsqueda web
//   if ((lower.includes('buscar') || lower.includes('precio') || lower.includes('mercado') || 
//        lower.includes('mercadolibre') || lower.includes('internet')) &&
//       !lower.match(/\b(clientes?|motos?|accesorios?|cascos?|bicicletas?|indumentarias?|comprobantes?)\b/)) {
//     return 'web_search';
//   }
  
//   // SQL directo
//   if (lower.startsWith('select ') || lower.startsWith('insert ') || 
//       lower.startsWith('update ') || lower.startsWith('delete ')) {
//     return 'sql_direct';
//   }
  
//   return 'general_query';
// }

// // 🧩 Interpretación MEJORADA con Groq
// async function interpretIntent(query, schema) {
//   try {
//     const schemaInfo = Object.entries(schema).map(([tableName, columns]) => {
//       return `${tableName}: ${columns.map(col => 
//         `${col.name} (${col.type}${col.nullable ? ', nullable' : ', required'})`
//       ).join(', ')}`;
//     }).join('\n');

//     const prompt = `
// ANALIZA LA CONSULTA DEL USUARIO Y GENERA UN JSON CON LA ACCIÓN A REALIZAR.

// ESQUEMA DE BASE DE DATOS:
// ${schemaInfo}

// CONSULTA DEL USUARIO: "${query}"

// INSTRUCCIONES:
// 1. Identifica la tabla objetivo basándote en las palabras clave
// 2. Determina la acción (select, insert, update, delete)
// 3. Para SELECT: incluye condiciones WHERE si son especificadas
// 4. Para INSERT: extrae los datos del mensaje y genera valores para campos requeridos
// 5. Para UPDATE: identifica qué campos modificar y la condición
// 6. Para DELETE: identifica la condición para eliminar

// RESPONDER SOLO CON JSON VÁLIDO EN ESTE FORMATO:

// PARA SELECT:
// {
//   "action": "select",
//   "table": "NombreTabla",
//   "condition": "condición SQL opcional",
//   "fields": ["campo1", "campo2"] // opcional, para seleccionar campos específicos
// }

// PARA INSERT:
// {
//   "action": "insert", 
//   "table": "NombreTabla",
//   "data": {
//     "campo1": "valor1",
//     "campo2": "valor2"
//   }
// }

// PARA UPDATE:
// {
//   "action": "update",
//   "table": "NombreTabla", 
//   "data": {
//     "campo": "nuevo_valor"
//   },
//   "condition": "condición WHERE"
// }

// PARA DELETE:
// {
//   "action": "delete",
//   "table": "NombreTabla",
//   "condition": "condición WHERE"
// }

// SI NO ES UNA OPERACIÓN DE BASE DE DATOS:
// {
//   "action": "none"
// }

// EJEMPLOS:
// - "ver todos los clientes" -> {"action":"select","table":"Clientes"}
// - "agregar un cliente llamado Juan Pérez" -> {"action":"insert","table":"Clientes","data":{"nombre":"Juan","apellido":"Pérez"}}
// - "buscar motos marca Honda" -> {"action":"select","table":"Motos","condition":"marca = 'Honda'"}
// - "actualizar precio del producto 123 a 5000" -> {"action":"update","table":"Productos","data":{"precio":5000},"condition":"id = 123"}

// RESPONDER SOLO CON JSON:
// `;

//     const completion = await groq.chat.completions.create({
//       model: "llama-3.1-8b-instant",
//       messages: [{ role: "user", content: prompt }],
//       temperature: 0.1,
//       max_tokens: 1000
//     });

//     const content = completion.choices[0].message.content.trim();
//     console.log("🤖 Respuesta RAW de Groq:", content);
    
//     // Extraer JSON
//     const jsonMatch = content.match(/\{[\s\S]*\}/);
//     if (!jsonMatch) {
//       throw new Error("No se pudo extraer JSON de la respuesta");
//     }
    
//     let jsonStr = jsonMatch[0]
//       .replace(/'/g, '"')
//       .replace(/(\w+):/g, '"$1":')
//       .replace(/,\s*}/g, '}')
//       .replace(/,\s*\]/g, ']');
    
//     console.log("🔧 JSON limpiado:", jsonStr);
    
//     const parsed = JSON.parse(jsonStr);
    
//     // Validar y completar datos para INSERT
//     if (parsed.action === 'insert' && parsed.table && schema[parsed.table]) {
//       parsed.data = await completeInsertData(parsed.data, schema[parsed.table], query);
//     }
    
//     console.log("🎯 Interpretación final:", parsed);
//     return parsed;
    
//   } catch (err) {
//     console.error("❌ Error interpretando intención:", err);
//     return fallbackIntentDetection(query, schema);
//   }
// }

// // 🔧 Completar datos para INSERT automáticamente
// async function completeInsertData(data, tableSchema, originalQuery) {
//   const completeData = { ...data };
//   const currentDate = new Date().toISOString().split('T')[0];
  
//   for (const column of tableSchema) {
//     // Saltar columnas identity
//     if (column.isIdentity) continue;
    
//     // Si el campo no está en los datos o está vacío
//     if (completeData[column.name] === undefined || completeData[column.name] === '') {
      
//       if (!column.nullable) {
//         // Campo requerido - generar valor por defecto
//         completeData[column.name] = generateSmartDefault(column, originalQuery);
//       } else {
//         // Campo opcional - valor por defecto según tipo
//         completeData[column.name] = generateDefaultByType(column);
//       }
//     }
//   }
  
//   return completeData;
// }

// function generateSmartDefault(column, query) {
//   const lowerQuery = query.toLowerCase();
//   const colName = column.name.toLowerCase();
  
//   // Valores inteligentes basados en nombre de columna y contexto
//   const smartDefaults = {
//     // Precios y cantidades
//     'precio': 0, 'precio_venta': 0, 'costo': 0, 'precio_lista': 0,
//     'cantidad': 0, 'stock': 0, 'existencia': 0,
    
//     // Fechas
//     'fecha': new Date().toISOString().split('T')[0],
//     'fecha_creacion': new Date().toISOString().split('T')[0],
//     'fecha_registro': new Date().toISOString().split('T')[0],
    
//     // Estados y flags
//     'activo': 1, 'disponible': 1, 'estado': 'Activo', 'status': 'Activo',
//     'habilitado': 1, 'visible': 1,
    
//     // Textos comunes
//     'tipo': 'General', 'categoria': 'General', 'categoría': 'General',
//     'marca': 'Generica', 'modelo': 'Standard'
//   };
  
//   // Buscar en nombres de columna
//   for (const [key, value] of Object.entries(smartDefaults)) {
//     if (colName.includes(key)) {
//       return value;
//     }
//   }
  
//   // Valores por tipo de dato
//   return generateDefaultByType(column);
// }

// function generateDefaultByType(column) {
//   const type = column.type.toLowerCase();
  
//   if (type.includes('int') || type.includes('decimal') || type.includes('float') || type.includes('numeric')) {
//     return 0;
//   }
  
//   if (type.includes('bit') || type.includes('boolean')) {
//     return 0;
//   }
  
//   if (type.includes('date') || type.includes('time')) {
//     return new Date().toISOString().split('T')[0];
//   }
  
//   if (type.includes('char') || type.includes('text') || type.includes('varchar')) {
//     return 'Por definir';
//   }
  
//   return '';
// }

// // 🛠️ Ejecutar SQL MEJORADO
// async function executeSQL(intent, schema) {
//   try {
//     const pool = await poolPromise;

//     if (!intent.table || !schema[intent.table]) {
//       return { success: false, message: `❌ Tabla "${intent.table}" no encontrada en el esquema` };
//     }

//     const tableSchema = schema[intent.table];

//     if (intent.action === 'insert' && intent.data) {
//       return await executeInsert(intent.table, intent.data, tableSchema, pool);
//     } 
//     else if (intent.action === 'select') {
//       return await executeSelect(intent.table, intent.condition, intent.fields, pool);
//     }
//     else if (intent.action === 'update' && intent.data && intent.condition) {
//       return await executeUpdate(intent.table, intent.data, intent.condition, pool);
//     }
//     else if (intent.action === 'delete' && intent.condition) {
//       return await executeDelete(intent.table, intent.condition, pool);
//     }
//     else {
//       return { success: false, message: "⚠️ Acción no soportada o parámetros incompletos" };
//     }
//   } catch (err) {
//     console.error("❌ Error ejecutando SQL:", err);
//     return { success: false, message: `❌ Error en la base de datos: ${err.message}` };
//   }
// }

// async function executeInsert(tableName, data, tableSchema, pool) {
//   // Filtrar columnas identity
//   const nonIdentityColumns = tableSchema.filter(col => !col.isIdentity);
//   const insertData = {};
  
//   // Validar y formatear datos
//   for (const column of nonIdentityColumns) {
//     if (data[column.name] !== undefined && data[column.name] !== '') {
//       insertData[column.name] = data[column.name];
//     } else if (!column.nullable) {
//       // Campo requerido sin valor - usar valor por defecto
//       insertData[column.name] = generateDefaultByType(column);
//     }
//     // Campos opcionales sin valor se omiten
//   }

//   const cols = Object.keys(insertData).map(c => `[${c}]`).join(', ');
//   const vals = Object.values(insertData).map(v => formatSQLValue(v)).join(', ');

//   const query = `INSERT INTO ${tableName} (${cols}) VALUES (${vals})`;
//   console.log("🚀 Ejecutando INSERT:", query);
  
//   await pool.request().query(query);
  
//   // Obtener ID generado si existe
//   const identityColumn = tableSchema.find(col => col.isIdentity);
//   let generatedId = null;
  
//   if (identityColumn) {
//     const idResult = await pool.request().query(`SELECT SCOPE_IDENTITY() as new_id`);
//     generatedId = idResult.recordset[0].new_id;
//   }
  
//   let message = `✅ Registro insertado correctamente en ${tableName}`;
//   if (generatedId) {
//     message += ` (ID: ${generatedId})`;
//   }
  
//   // Mostrar resumen de datos insertados
//   message += `\n\n📋 Datos insertados:`;
//   Object.entries(insertData).forEach(([key, value]) => {
//     message += `\n• ${key}: ${value}`;
//   });

//   return {
//     success: true,
//     message: message,
//     data: insertData,
//     generatedId: generatedId
//   };
// }

// async function executeSelect(tableName, condition, fields, pool) {
//   const selectedFields = fields && fields.length > 0 ? 
//     fields.map(f => `[${f}]`).join(', ') : '*';
  
//   let whereClause = '';
//   if (condition && condition.trim()) {
//     whereClause = `WHERE ${condition}`;
//   }
  
//   const query = `SELECT ${selectedFields} FROM ${tableName} ${whereClause} ORDER BY 1 DESC`;
//   console.log("🔍 Ejecutando SELECT:", query);
  
//   const result = await pool.request().query(query);
//   const formattedData = formatDataForDisplay(result.recordset, tableName);
  
//   return {
//     success: true,
//     message: formattedData,
//     data: result.recordset,
//     count: result.recordset.length
//   };
// }

// async function executeUpdate(tableName, data, condition, pool) {
//   const sets = Object.entries(data)
//     .map(([k, v]) => `[${k}] = ${formatSQLValue(v)}`)
//     .join(', ');

//   const query = `UPDATE ${tableName} SET ${sets} WHERE ${condition}`;
//   console.log("🔄 Ejecutando UPDATE:", query);
  
//   const result = await pool.request().query(query);
  
//   return {
//     success: true,
//     message: `✅ Registro actualizado correctamente en ${tableName}`,
//     affectedRows: result.rowsAffected[0]
//   };
// }

// async function executeDelete(tableName, condition, pool) {
//   const query = `DELETE FROM ${tableName} WHERE ${condition}`;
//   console.log("🗑️ Ejecutando DELETE:", query);
  
//   const result = await pool.request().query(query);
  
//   return {
//     success: true,
//     message: `✅ Registro eliminado correctamente de ${tableName}`,
//     affectedRows: result.rowsAffected[0]
//   };
// }

// function formatSQLValue(value) {
//   if (value === null || value === undefined) return 'NULL';
//   if (typeof value === 'number') return value;
//   if (typeof value === 'boolean') return value ? 1 : 0;
//   if (value instanceof Date) return `'${value.toISOString().split('T')[0]}'`;
//   return `'${value.toString().replace(/'/g, "''")}'`;
// }

// function formatDataForDisplay(data, tableName) {
//   if (!data || data.length === 0) {
//     return `📊 **${tableName}** - No se encontraron registros.`;
//   }

//   let formatted = `📊 **${tableName}** - ${data.length} registros encontrados:\n\n`;
  
//   data.slice(0, 5).forEach((record, index) => {
//     formatted += `**Registro ${index + 1}:**\n`;
//     Object.entries(record).forEach(([key, value]) => {
//       if (value !== null && value !== '') {
//         formatted += `• ${key}: ${value}\n`;
//       }
//     });
//     formatted += '\n';
//   });

//   if (data.length > 5) {
//     formatted += `\n... y ${data.length - 5} registros más.`;
//   }

//   return formatted;
// }

// // 🌐 Búsqueda en Internet
// async function webSearch(query) {
//   try {
//     const prompt = `El usuario quiere buscar: "${query}"
    
// Simula una búsqueda web real y proporciona información útil sobre precios, características, disponibilidad, etc.

// Responde en español de manera natural como si estuvieras mostrando resultados de búsqueda.`;

//     const completion = await groq.chat.completions.create({
//       model: "llama-3.1-8b-instant",
//       messages: [{ role: "user", content: prompt }],
//       temperature: 0.7,
//       max_tokens: 800
//     });

//     return completion.choices[0].message.content;
//   } catch (err) {
//     console.error("❌ Error en búsqueda web:", err);
//     return "No pude realizar la búsqueda en internet en este momento.";
//   }
// }

// // 🆘 Fallback para cuando falla Groq
// function fallbackIntentDetection(query, schema) {
//   const lowerQuery = query.toLowerCase();
  
//   // Detección básica de tablas
//   const tableMap = {
//     'accesorio': 'Accesorios',
//     'casco': 'Cascos', 
//     'bicicleta': 'Bicicletas',
//     'indumentaria': 'Indumentarias',
//     'ropa': 'Indumentarias',
//     'cliente': 'Clientes',
//     'moto': 'Motos',
//     'comprobante': 'Comprobantes',
//     'precio': 'ListaPrecios',
//     'lista': 'ListaPrecios',
//     'venta': 'Ventas',
//     'producto': 'Productos'
//   };
  
//   // Encontrar tabla
//   let targetTable = null;
//   for (const [keyword, table] of Object.entries(tableMap)) {
//     if (lowerQuery.includes(keyword)) {
//       targetTable = table;
//       break;
//     }
//   }
  
//   if (!targetTable) {
//     return { action: "none" };
//   }
  
//   // Consulta SELECT genérica
//   return {
//     action: 'select',
//     table: targetTable
//   };
// }

// // 💾 Guardar mensaje en historial
// async function saveMessage(conversationId, role, message) {
//   try {
//     const pool = await poolPromise;
//     await pool.request()
//       .input('conversationId', conversationId)
//       .input('role', role)
//       .input('message', message)
//       .query(`
//         INSERT INTO ChatHistory (conversationId, role, message)
//         VALUES (@conversationId, @role, @message)
//       `);
//   } catch (err) {
//     console.error('❌ Error guardando mensaje:', err);
//   }
// }

// // 📩 Endpoint principal MEJORADO
// app.post('/chat', async (req, res) => {
//   try {
//     let { message, query, conversationId } = req.body;
//     message = message || query;

//     if (!message) {
//       return res.status(400).json({ error: 'Mensaje vacío' });
//     }

//     if (!conversationId) {
//       conversationId = uuidv4();
//       conversations[conversationId] = [];
//     }

//     conversations[conversationId].push({ role: 'user', content: message });
//     await saveMessage(conversationId, 'user', message);

//     const schema = await getDatabaseSchema();
//     const intentType = detectIntent(message);
//     let botResponse = '';

//     console.log("🔍 Intención detectada:", intentType);

//     // Procesar según el tipo de intención
//     if (intentType === 'web_search') {
//       botResponse = await webSearch(message);
//     } 
//     else if (intentType === 'sql_direct') {
//       botResponse = await executeDirectSQL(message);
//     }
//     else if (intentType.startsWith('select_') || intentType.startsWith('insert_') || 
//              intentType === 'update_generic' || intentType === 'delete_generic') {
      
//       const intent = await interpretIntent(message, schema);
      
//       if (intent.action !== 'none') {
//         const result = await executeSQL(intent, schema);
//         botResponse = result.message;
//       } else {
//         // Fallback a búsqueda general
//         try {
//           const { answerQuery } = require('./search');
//           const searchResult = await answerQuery(message);
//           botResponse = searchResult.text;
//         } catch (err) {
//           botResponse = "🤖 No entendí tu consulta. Puedo ayudarte con:\n• Consultas de base de datos (ver, agregar, modificar, eliminar)\n• Búsquedas en internet\n• Gestión de clientes, productos, ventas, etc.";
//         }
//       }
//     }
//     else {
//       // Consulta general
//       try {
//         const { answerQuery } = require('./search');
//         const result = await answerQuery(message);
//         botResponse = result.text;
//       } catch (err) {
//         botResponse = "🤖 Hola! Soy tu asistente de base de datos. Puedo ayudarte a:\n• Ver información (clientes, productos, ventas, etc.)\n• Agregar nuevos registros\n• Modificar datos existentes\n• Realizar búsquedas específicas\n\n¿En qué puedo ayudarte?";
//       }
//     }

//     conversations[conversationId].push({ role: 'assistant', content: botResponse });
//     await saveMessage(conversationId, 'assistant', botResponse);

//     res.json({ 
//       conversationId, 
//       response: {
//         text: botResponse,
//         sources: []
//       }
//     });
//   } catch (err) {
//     console.error('❌ Error en /chat:', err);
//     res.status(500).json({ error: 'Error interno del servidor: ' + err.message });
//   }
// });

// // 🗂️ Endpoints CRUD para frontend (mantener los mismos)
// app.get('/tables/:tableName', async (req, res) => {
//   try {
//     const { tableName } = req.params;
//     const pool = await poolPromise;
//     const result = await pool.request().query(`SELECT TOP 100 * FROM ${tableName} ORDER BY 1 DESC`);
//     res.json({ success: true, data: result.recordset });
//   } catch (err) {
//     console.error('❌ Error obteniendo datos:', err);
//     res.status(500).json({ success: false, error: err.message });
//   }
// });

// app.post('/tables/:tableName', async (req, res) => {
//   try {
//     const { tableName } = req.params;
//     const data = req.body;
    
//     const pool = await poolPromise;
//     const schema = await getDatabaseSchema();
//     const tableSchema = schema[tableName];
    
//     if (!tableSchema) {
//       return res.status(400).json({ success: false, error: `Tabla no encontrada` });
//     }

//     // Filtrar columnas identity y completar datos
//     const nonIdentityColumns = tableSchema.filter(col => !col.isIdentity);
//     const insertData = {};
    
//     for (const column of nonIdentityColumns) {
//       if (data[column.name] !== undefined && data[column.name] !== '') {
//         insertData[column.name] = data[column.name];
//       } else if (!column.nullable) {
//         insertData[column.name] = generateDefaultByType(column);
//       }
//     }

//     const cols = Object.keys(insertData).map(c => `[${c}]`).join(', ');
//     const vals = Object.values(insertData).map(v => formatSQLValue(v)).join(', ');

//     const query = `INSERT INTO ${tableName} (${cols}) VALUES (${vals})`;
//     await pool.request().query(query);
    
//     // Obtener ID generado
//     const identityColumn = tableSchema.find(col => col.isIdentity);
//     let generatedId = null;
    
//     if (identityColumn) {
//       const idResult = await pool.request().query(`SELECT SCOPE_IDENTITY() as new_id`);
//       generatedId = idResult.recordset[0].new_id;
//     }
    
//     res.json({ 
//       success: true, 
//       message: 'Registro insertado correctamente',
//       generatedId: generatedId,
//       data: insertData
//     });
    
//   } catch (err) {
//     console.error('❌ Error insertando:', err);
//     res.status(500).json({ success: false, error: err.message });
//   }
// });

// app.put('/tables/:tableName/:id', async (req, res) => {
//   try {
//     const { tableName, id } = req.params;
//     const data = req.body;
    
//     const pool = await poolPromise;
    
//     const sets = Object.entries(data)
//       .map(([k, v]) => `[${k}] = ${formatSQLValue(v)}`)
//       .join(', ');

//     const query = `UPDATE ${tableName} SET ${sets} WHERE id = ${id}`;
//     const result = await pool.request().query(query);
    
//     res.json({ 
//       success: true, 
//       message: 'Registro actualizado correctamente',
//       affectedRows: result.rowsAffected[0]
//     });
    
//   } catch (err) {
//     console.error('❌ Error actualizando:', err);
//     res.status(500).json({ success: false, error: err.message });
//   }
// });

// app.delete('/tables/:tableName/:id', async (req, res) => {
//   try {
//     const { tableName, id } = req.params;
    
//     const pool = await poolPromise;
//     const query = `DELETE FROM ${tableName} WHERE id = ${id}`;
//     const result = await pool.request().query(query);
    
//     res.json({ 
//       success: true, 
//       message: 'Registro eliminado correctamente',
//       affectedRows: result.rowsAffected[0]
//     });
    
//   } catch (err) {
//     console.error('❌ Error eliminando:', err);
//     res.status(500).json({ success: false, error: err.message });
//   }
// });

// app.get('/tables', async (req, res) => {
//   try {
//     const schema = await getDatabaseSchema();
//     res.json({ success: true, tables: Object.keys(schema) });
//   } catch (err) {
//     console.error('❌ Error obteniendo tablas:', err);
//     res.status(500).json({ success: false, error: err.message });
//   }
// });

// // Función para ejecutar SQL directo
// async function executeDirectSQL(query) {
//   try {
//     const pool = await poolPromise;
//     const result = await pool.request().query(query);
//     return `✅ Consulta ejecutada correctamente.\nResultados: ${JSON.stringify(result.recordset, null, 2)}`;
//   } catch (err) {
//     return `❌ Error ejecutando SQL: ${err.message}`;
//   }
// }

// // 📜 Obtener historial
// app.get('/history', async (req, res) => {
//   try {
//     const pool = await poolPromise;
//     const result = await pool.request().query('SELECT * FROM ChatHistory ORDER BY createdAt ASC');
//     res.json(result.recordset);
//   } catch (err) {
//     console.error('❌ Error obteniendo historial:', err);
//     res.status(500).json({ error: 'Error al obtener historial' });
//   }
// });

// const port = process.env.PORT || 3001;
// app.listen(port, () => console.log(`🚀 Servidor ejecutándose en puerto ${port}`));

// module.exports = { app, getDatabaseSchema };