require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const { poolPromise } = require('./db');
const Groq = require("groq-sdk");
const axios = require('axios');

const app = express();
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));

let conversations = {};

// 🗃️ Obtener estructura de tablas
async function getDatabaseSchema() {
  try {
    const pool = await poolPromise;
    
    const tablesResult = await pool.request().query(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_TYPE = 'BASE TABLE'
      AND TABLE_NAME NOT LIKE 'ChatHistory'
    `);
    
    const schema = {};
    
    for (const table of tablesResult.recordset) {
      const tableName = table.TABLE_NAME;
      
      const columnsResult = await pool.request().query(`
        SELECT 
          c.COLUMN_NAME,
          c.DATA_TYPE,
          c.IS_NULLABLE,
          CASE WHEN ic.object_id IS NOT NULL THEN 1 ELSE 0 END AS IS_IDENTITY
        FROM INFORMATION_SCHEMA.COLUMNS c
        LEFT JOIN sys.identity_columns ic 
          ON ic.object_id = OBJECT_ID(c.TABLE_NAME) 
          AND ic.name = c.COLUMN_NAME
        WHERE c.TABLE_NAME = '${tableName}'
        ORDER BY c.ORDINAL_POSITION
      `);
      
      schema[tableName] = columnsResult.recordset.map(col => ({
        name: col.COLUMN_NAME,
        type: col.DATA_TYPE,
        nullable: col.IS_NULLABLE === 'YES',
        isIdentity: col.IS_IDENTITY === 1
      }));
    }
    
    console.log("📋 Schema cargado:", Object.keys(schema));
    return schema;
  } catch (err) {
    console.error('❌ Error obteniendo schema:', err);
    return {};
  }
}

// 🧠 Sistema MEJORADO de detección de intenciones
// En tu archivo del backend, actualiza la función detectIntent para incluir las nuevas tablas
function detectIntent(text) {
  const lower = text.toLowerCase();
  
  // PRIMERO verificar si es una consulta de base de datos
  if ((lower.includes('accesorio') || lower.includes('cascos') || lower.includes('bicicleta') || 
       lower.includes('indumentaria') || lower.includes('moto') || lower.includes('cliente') ||
       lower.includes('comprobante') || lower.includes('precio') || lower.includes('lista')) &&
      (lower.includes('ver') || lower.includes('mostrar') || lower.includes('listar') || 
       lower.includes('buscar') || lower.includes('consultar') || lower.includes('traer'))) {
    
    // Caso específico para búsquedas por categoría en Accesorios
    if (lower.includes('accesorio') && lower.includes('categoria')) {
      return 'select_Accesorios_categoria';
    }
    
    // Consultas específicas de tablas
    if (lower.includes('accesorio')) return 'select_Accesorios';
    if (lower.includes('casco')) return 'select_Cascos';
    if (lower.includes('bicicleta')) return 'select_Bicicletas';
    if (lower.includes('indumentaria') || lower.includes('ropa') || lower.includes('campera') || lower.includes('guante') || lower.includes('bota')) 
      return 'select_Indumentarias';
    if (lower.includes('cliente')) return 'select_Clientes';
    if (lower.includes('moto')) return 'select_Motos';
    if (lower.includes('comprobante')) return 'select_Comprobantes';
    if (lower.includes('precio') || lower.includes('lista')) return 'select_ListaPrecios';
    if (lower.includes('ayuda')) return 'select_ms_ayuda';
    
    return 'select_generic';
  }
  
  // Inserciones
  if (lower.includes('agregar') || lower.includes('añadir') || lower.includes('nuevo') || 
      lower.includes('insertar') || lower.includes('crear')) {
    if (lower.includes('cliente')) return 'insert_Clientes';
    if (lower.includes('moto')) return 'insert_Motos';
    if (lower.includes('comprobante')) return 'insert_Comprobantes';
    if (lower.includes('precio') || lower.includes('lista')) return 'insert_ListaPrecios';
    if (lower.includes('casco')) return 'insert_Cascos';
    if (lower.includes('bicicleta')) return 'insert_Bicicletas';
    if (lower.includes('indumentaria') || lower.includes('ropa') || lower.includes('campera') || lower.includes('guante') || lower.includes('bota')) 
      return 'insert_Indumentarias';
    if (lower.includes('accesorio')) return 'insert_Accesorios';
    if (lower.includes('ayuda')) {
      if (lower.includes('tipo')) return 'insert_ms_ayuda_tipo_item';
      if (lower.includes('item')) return 'insert_ms_ayuda_item';
      return 'insert_ms_ayuda';
    }
    return 'insert_generic';
  }
  
  // Búsqueda en internet SOLO cuando no hay referencias a tablas específicas
  if ((lower.includes('buscar') || lower.includes('precio') || lower.includes('mercado') || 
       lower.includes('mercadolibre') || lower.includes('internet')) &&
      !lower.includes('accesorio') && !lower.includes('casco') && !lower.includes('bicicleta') &&
      !lower.includes('indumentaria') && !lower.includes('moto') && !lower.includes('cliente') &&
      !lower.includes('comprobante') && !lower.includes('lista')) {
    return 'web_search';
  }
  
  // Actualizaciones
  if (lower.includes('actualizar') || lower.includes('modificar') || lower.includes('editar') || lower.includes('update')) {
    return 'update_generic';
  }
  
  // Eliminaciones
  if (lower.includes('eliminar') || lower.includes('borrar') || lower.includes('quitar') || lower.includes('delete')) {
    return 'delete_generic';
  }
  
  if (lower.startsWith('select')) return 'select_sql';
  if (lower.startsWith('insert')) return 'insert_sql';
  if (lower.startsWith('update')) return 'update_sql';
  if (lower.startsWith('delete')) return 'delete_sql';
  
  return 'general';
}


// 🌐 Búsqueda en Internet (Simulada con Groq)
async function webSearch(query) {
  try {
    const prompt = `
El usuario quiere buscar información en internet sobre: "${query}"

Simula una búsqueda real y proporciona información útil sobre precios, disponibilidad, características, etc.

Responde en español de manera natural y útil, como si estuvieras mostrando resultados de búsqueda reales.

Información a buscar: ${query}
`;

    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 800
    });

    return completion.choices[0].message.content;
  } catch (err) {
    console.error("❌ Error en búsqueda web:", err);
    return "No pude realizar la búsqueda en internet en este momento. Por favor intenta más tarde.";
  }
}

// 📊 Formatear datos para mostrar de manera legible
function formatDataForDisplay(data, tableName) {
  if (!data || data.length === 0) {
    return "No se encontraron registros.";
  }

  let formatted = `📊 **${tableName}** - ${data.length} registros encontrados:\n\n`;
  
  data.slice(0, 10).forEach((record, index) => {
    formatted += `**Registro ${index + 1}:**\n`;
    Object.entries(record).forEach(([key, value]) => {
      if (value !== null && value !== '') {
        formatted += `• ${key}: ${value}\n`;
      }
    });
    formatted += '\n';
  });

  if (data.length > 10) {
    formatted += `\n... y ${data.length - 10} registros más.`;
  }

  return formatted;
}
async function generateInsertWithDefaults(query, schema) {
  try {
    // Determinar la tabla objetivo
    const lowerQuery = query.toLowerCase();
    let targetTable = null;
    
    const tableMap = {
      'moto': 'Motos',
      'cliente': 'Clientes',
      'accesorio': 'Accesorios',
      'casco': 'Cascos',
      'bicicleta': 'Bicicletas',
      'indumentaria': 'Indumentarias',
      'ropa': 'Indumentarias',
      'comprobante': 'Comprobantes',
      'precio': 'ListaPrecios',
      'lista': 'ListaPrecios'
    };
    
    for (const [keyword, table] of Object.entries(tableMap)) {
      if (lowerQuery.includes(keyword)) {
        targetTable = table;
        break;
      }
    }
    
    if (!targetTable) {
      return { action: "none" };
    }
    
    const tableSchema = schema[targetTable];
    if (!tableSchema) {
      return { action: "none" };
    }
    
    // Usar Groq para extraer información y generar valores por defecto
    const prompt = `
EXTRÁE INFORMACIÓN DEL MENSAJE Y GENERA VALORES POR DEFECTO INTELIGENTES.

TABLA: ${targetTable}
COLUMNAS DISPONIBLES: ${tableSchema.map(col => `${col.name} (${col.type}${col.nullable ? ', nullable' : ', required'})`).join(', ')}

MENSAJE DEL USUARIO: "${query}"

INSTRUCCIONES:
1. Extrae todos los datos explícitos del mensaje
2. Para campos numéricos requeridos sin valor, usa 0 o 1 según el contexto
3. Para campos de texto requeridos sin valor, genera un valor apropiado basado en el contexto
4. Para campos de fecha, usa la fecha actual si no se especifica
5. Para campos booleanos, usa false por defecto
6. Para campos de categoría/tipo, usa un valor común apropiado

EJEMPLOS:
- "agregar moto yamaha yzf r6 azul 2020" -> marca: yamaha, modelo: yzf r6, color: azul, anio: 2020, precio: 0, estado: 'Disponible'
- "nuevo cliente juan perez" -> nombre: juan, apellido: perez, telefono: '', email: '', direccion: ''

RESPONDER SOLO CON JSON:
{
  "action": "insert",
  "table": "${targetTable}",
  "data": {
    "campo1": "valor1",
    "campo2": "valor2"
  }
}
`;

    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
      max_tokens: 800
    });

    const content = completion.choices[0].message.content.trim();
    console.log("🤖 Respuesta INSERT de Groq:", content);
    
    // Extraer JSON
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No se pudo extraer JSON");
    }
    
    let jsonStr = jsonMatch[0];
    
    // Limpiar JSON
    jsonStr = jsonStr.replace(/'/g, '"')
                    .replace(/(\w+):/g, '"$1":')
                    .replace(/,\s*}/g, '}');
    
    console.log("🔧 JSON INSERT limpiado:", jsonStr);
    
    const parsed = JSON.parse(jsonStr);
    
    // Asegurar que todos los campos requeridos tengan valores
    const completeData = await fillRequiredFields(parsed.data, tableSchema, query);
    parsed.data = completeData;
    
    console.log("🎯 INSERT final con valores completos:", parsed);
    return parsed;
    
  } catch (err) {
    console.error("❌ Error generando INSERT:", err.message);
    return { action: "none" };
  }
}
async function fillRequiredFields(data, tableSchema, originalQuery) {
  const completeData = { ...data };
  const currentDate = new Date().toISOString().split('T')[0]; // Fecha actual en formato YYYY-MM-DD
  
  for (const column of tableSchema) {
    // Solo procesar columnas que no son identity y no están en los datos
    if (!column.isIdentity && completeData[column.name] === undefined) {
      
      if (!column.nullable) {
        // Campo requerido - generar valor por defecto
        completeData[column.name] = generateDefaultValue(column, originalQuery);
      } else {
        // Campo opcional - usar null o valor vacío
        if (column.type.includes('int') || column.type.includes('decimal') || column.type.includes('float')) {
          completeData[column.name] = null;
        } else if (column.type.includes('date') || column.type.includes('datetime')) {
          completeData[column.name] = null;
        } else {
          completeData[column.name] = '';
        }
      }
    }
  }
  
  return completeData;
}
function generateDefaultValue(column, originalQuery) {
  const lowerQuery = originalQuery.toLowerCase();
  const columnName = column.name.toLowerCase();
  
  // Valores basados en el nombre de la columna
  if (columnName.includes('precio') || columnName.includes('precio') || columnName.includes('costo')) {
    return 0;
  }
  
  if (columnName.includes('cantidad') || columnName.includes('stock')) {
    return 0;
  }
  
  if (columnName.includes('anio') || columnName.includes('año')) {
    // Intentar extraer el año del query
    const yearMatch = originalQuery.match(/\b(20\d{2})\b/);
    if (yearMatch) {
      return parseInt(yearMatch[1]);
    }
    return new Date().getFullYear();
  }
  
  if (columnName.includes('fecha')) {
    return new Date().toISOString().split('T')[0];
  }
  
  if (columnName.includes('estado') || columnName.includes('status')) {
    return 'Activo';
  }
  
  if (columnName.includes('activo') || columnName.includes('disponible')) {
    return true;
  }
  
  if (columnName.includes('categoria') || columnName.includes('categoría') || columnName.includes('tipo')) {
    if (lowerQuery.includes('deportiv')) return 'Deportiva';
    if (lowerQuery.includes('urbana') || lowerQuery.includes('ciudad')) return 'Urbana';
    if (lowerQuery.includes('custom')) return 'Custom';
    if (lowerQuery.includes('scooter')) return 'Scooter';
    if (lowerQuery.includes('enduro')) return 'Enduro';
    return 'General';
  }
  
  if (columnName.includes('marca')) {
    if (lowerQuery.includes('yamaha')) return 'Yamaha';
    if (lowerQuery.includes('honda')) return 'Honda';
    if (lowerQuery.includes('suzuki')) return 'Suzuki';
    if (lowerQuery.includes('kawasaki')) return 'Kawasaki';
    if (lowerQuery.includes('bmw')) return 'BMW';
    if (lowerQuery.includes('ducati')) return 'Ducati';
    return 'Otra';
  }
  
  if (columnName.includes('color')) {
    if (lowerQuery.includes('negro')) return 'Negro';
    if (lowerQuery.includes('azul')) return 'Azul';
    if (lowerQuery.includes('rojo')) return 'Rojo';
    if (lowerQuery.includes('blanco')) return 'Blanco';
    if (lowerQuery.includes('verde')) return 'Verde';
    if (lowerQuery.includes('amarillo')) return 'Amarillo';
    return 'Sin especificar';
  }
  
  // Valores basados en el tipo de dato
  if (column.type.includes('int') || column.type.includes('decimal') || column.type.includes('float')) {
    return 0;
  }
  
  if (column.type.includes('bit') || column.type.includes('boolean')) {
    return false;
  }
  
  if (column.type.includes('date') || column.type.includes('datetime')) {
    return new Date().toISOString().split('T')[0];
  }
  
  // Para campos de texto
  return 'Por definir';
}

// 🧩 Interpretación MEJORADA
// 🧩 Interpretación MEJORADA con manejo de errores robusto
// 🧩 Interpretación MEJORADA con valores automáticos
async function interpretIntent(query, schema) {
  try {
    const lowerQuery = query.toLowerCase();
    
    // Manejo específico para búsquedas por categoría en Accesorios
    if (lowerQuery.includes('accesorio') && lowerQuery.includes('categoria')) {
      if (lowerQuery.includes('estetica') || lowerQuery.includes('estética')) {
        return {
          action: 'select',
          table: 'Accesorios',
          condition: "categoria = 'Estética'"
        };
      }
      if (lowerQuery.includes('electronico') || lowerQuery.includes('electrónico')) {
        return {
          action: 'select',
          table: 'Accesorios',
          condition: "categoria = 'Electrónicos'"
        };
      }
      if (lowerQuery.includes('seguridad')) {
        return {
          action: 'select',
          table: 'Accesorios', 
          condition: "categoria = 'Seguridad'"
        };
      }
    }
    
    // Para inserciones, usar Groq para generar valores automáticos
    if (lowerQuery.includes('agregar') || lowerQuery.includes('añadir') || lowerQuery.includes('insertar') || lowerQuery.includes('nuevo')) {
      return await generateInsertWithDefaults(query, schema);
    }
    
    // Para otras consultas, usar Groq normal
    const schemaInfo = JSON.stringify(schema, null, 2);
    
    const prompt = `
ANALIZA EL MENSAJE Y DEVUELVE UN JSON VÁLIDO CON LA ACCIÓN A REALIZAR.

TABLAS DISPONIBLES: ${Object.keys(schema).join(', ')}

FORMATO JSON VÁLIDO:
- Para SELECT: {"action":"select","table":"NombreTabla","condition":"condición SQL"}
- Para INSERT: {"action":"insert","table":"NombreTabla","data":{"campo1":"valor1"}}
- Para UPDATE: {"action":"update","table":"NombreTabla","data":{"campo":"valor"},"condition":"condición"}
- Para DELETE: {"action":"delete","table":"NombreTabla","condition":"condición"}

IMPORTANTE: 
- Usa comillas dobles para todos los strings en JSON
- Escapa comillas simples dentro de strings con \\'
- Si no hay condición, omite el campo "condition"

EJEMPLOS:
- "buscar accesorios con categoria estetica" -> {"action":"select","table":"Accesorios","condition":"categoria = 'Estética'"}
- "ver todos los cascos" -> {"action":"select","table":"Cascos"}
- "mostrar clientes" -> {"action":"select","table":"Clientes"}

MENSAJE DEL USUARIO: "${query.replace(/"/g, '\\"')}"

RESPONDER SOLO CON JSON VÁLIDO:
`;

    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.1,
      max_tokens: 500
    });

    const content = completion.choices[0].message.content.trim();
    console.log("🤖 Respuesta RAW de Groq:", content);
    
    // Limpiar y extraer JSON
    let jsonStr = content;
    
    // Intentar extraer JSON si está embebido en texto
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonStr = jsonMatch[0];
    }
    
    // Limpiar posibles problemas de formato
    jsonStr = jsonStr.replace(/'/g, '"') // Reemplazar comillas simples por dobles
                    .replace(/(\w+):/g, '"$1":') // Asegurar comillas en keys
                    .replace(/,\s*}/g, '}') // Remover comas finales
                    .replace(/,\s*\]/g, ']'); // Remover comas finales en arrays
    
    console.log("🔧 JSON limpiado:", jsonStr);
    
    const parsed = JSON.parse(jsonStr);
    console.log("🧩 Interpretación final:", parsed);
    return parsed;
    
  } catch (err) {
    console.error("❌ Error interpretando intención:", err.message);
    
    // Fallback: intentar interpretación básica
    return fallbackIntentDetection(query, schema);
  }
}


// 🆘 Fallback para cuando falla Groq
function fallbackIntentDetection(query, schema) {
  const lowerQuery = query.toLowerCase();
  
  // Detección básica de tablas
  const tableMatch = {
    'accesorio': 'Accesorios',
    'casco': 'Cascos', 
    'bicicleta': 'Bicicletas',
    'indumentaria': 'Indumentarias',
    'ropa': 'Indumentarias',
    'campera': 'Indumentarias',
    'guante': 'Indumentarias',
    'bota': 'Indumentarias',
    'cliente': 'Clientes',
    'moto': 'Motos',
    'comprobante': 'Comprobantes',
    'precio': 'ListaPrecios',
    'lista': 'ListaPrecios'
  };
  
  // Encontrar tabla
  let targetTable = null;
  for (const [keyword, table] of Object.entries(tableMatch)) {
    if (lowerQuery.includes(keyword)) {
      targetTable = table;
      break;
    }
  }
  
  if (!targetTable) {
    return { action: "none" };
  }
  
  // Para búsquedas específicas de categoría en Accesorios
  if (targetTable === 'Accesorios' && lowerQuery.includes('categoria')) {
    let condition = '';
    if (lowerQuery.includes('estetica') || lowerQuery.includes('estética')) {
      condition = "categoria = 'Estética'";
    } else if (lowerQuery.includes('electronico') || lowerQuery.includes('electrónico')) {
      condition = "categoria = 'Electrónicos'";
    } else if (lowerQuery.includes('seguridad')) {
      condition = "categoria = 'Seguridad'";
    }
    
    return {
      action: 'select',
      table: targetTable,
      condition: condition
    };
  }
  
  // Consulta SELECT genérica
  return {
    action: 'select',
    table: targetTable
  };
}
// 🛠️ Ejecutar SQL MEJORADO
async function executeSQL(intent, schema) {
  try {
    const pool = await poolPromise;

    if (intent.action === 'insert' && intent.table && intent.data) {
      const tableSchema = schema[intent.table];
      if (!tableSchema) {
        return { message: `❌ No se encontró la tabla ${intent.table}` };
      }

      // Filtrar columnas identity y completar datos automáticamente
      const nonIdentityColumns = tableSchema.filter(col => !col.isIdentity);
      const completeData = {};
      
      for (const column of nonIdentityColumns) {
        if (intent.data[column.name] !== undefined && intent.data[column.name] !== '') {
          completeData[column.name] = intent.data[column.name];
        } else {
          // Si no hay dato y el campo es requerido, usar valor por defecto
          if (!column.nullable) {
            completeData[column.name] = generateDefaultValue(column, JSON.stringify(intent.data));
          } else {
            if (column.type.includes('int') || column.type.includes('decimal') || column.type.includes('float')) {
              completeData[column.name] = null;
            } else {
              completeData[column.name] = '';
            }
          }
        }
      }

      const cols = Object.keys(completeData).map(c => `[${c}]`).join(', ');
      const vals = Object.values(completeData)
        .map(v => {
          if (v === null) return 'NULL';
          if (typeof v === 'number') return v;
          if (typeof v === 'boolean') return v ? 1 : 0;
          return `'${v.toString().replace(/'/g, "''")}'`;
        })
        .join(', ');

      const query = `INSERT INTO ${intent.table} (${cols}) VALUES (${vals})`;
      console.log("🚀 Ejecutando INSERT:", query);
      
      await pool.request().query(query);
      
      // Obtener ID generado
      const identityColumn = tableSchema.find(col => col.isIdentity);
      let generatedId = null;
      
      if (identityColumn) {
        const idResult = await pool.request().query(`SELECT SCOPE_IDENTITY() as new_id`);
        generatedId = idResult.recordset[0].new_id;
      }
      
      let successMessage = `✅ Registro insertado correctamente en ${intent.table}`;
      if (generatedId) {
        successMessage += ` (ID: ${generatedId})`;
      }
      
      // Mostrar datos insertados
      successMessage += `\n\n📋 Datos insertados:`;
      Object.entries(completeData).forEach(([key, value]) => {
        if (value !== null && value !== '') {
          successMessage += `\n• ${key}: ${value}`;
        }
      });
      
      return { 
        success: true,
        message: successMessage,
        data: completeData,
        generatedId: generatedId
      };

    } else if (intent.action === 'select' && intent.table) {
      let whereClause = '';
      if (intent.condition) {
        whereClause = `WHERE ${intent.condition}`;
      }
      
      const query = `SELECT * FROM ${intent.table} ${whereClause} ORDER BY 1 DESC`;
      console.log("🔍 Ejecutando SELECT:", query);
      
      const result = await pool.request().query(query);
      const formattedData = formatDataForDisplay(result.recordset, intent.table);
      
      return {
        success: true,
        message: formattedData,
        data: result.recordset,
        rawData: result.recordset
      };
    } else if (intent.action === 'update' && intent.table && intent.data && intent.condition) {
      const sets = Object.entries(intent.data)
        .map(([k, v]) => `[${k}]='${v.toString().replace(/'/g, "''")}'`)
        .join(', ');

      const query = `UPDATE ${intent.table} SET ${sets} WHERE ${intent.condition}`;
      console.log("🔄 Ejecutando UPDATE:", query);
      
      const result = await pool.request().query(query);
      
      return {
        success: true,
        message: `✅ Registro actualizado correctamente en ${intent.table}`,
        affectedRows: result.rowsAffected[0]
      };

    } else if (intent.action === 'delete' && intent.table && intent.condition) {
      const query = `DELETE FROM ${intent.table} WHERE ${intent.condition}`;
      console.log("🗑️ Ejecutando DELETE:", query);
      
      const result = await pool.request().query(query);
      
      return {
        success: true,
        message: `✅ Registro eliminado correctamente de ${intent.table}`,
        affectedRows: result.rowsAffected[0]
      };
    }

    return { success: false, message: "⚠️ No se pudo ejecutar la instrucción." };
  } catch (err) {
    console.error("❌ Error ejecutando SQL:", err);
    return { success: false, message: `❌ Error al ejecutar: ${err.message}` };
  }
}

// 💾 Guardar mensaje
async function saveMessage(conversationId, role, message) {
  try {
    const pool = await poolPromise;
    await pool.request()
      .input('conversationId', conversationId)
      .input('role', role)
      .input('message', message)
      .query(`
        INSERT INTO ChatHistory (conversationId, role, message)
        VALUES (@conversationId, @role, @message)
      `);
  } catch (err) {
    console.error('❌ Error guardando mensaje en DB:', err);
  }
}

// 📩 Endpoint principal COMPLETAMENTE MEJORADO
app.post('/chat', async (req, res) => {
  try {
    let { message, query, conversationId } = req.body;
    message = message || query;

    if (!message) return res.status(400).json({ error: 'Mensaje vacío' });

    if (!conversationId) {
      conversationId = uuidv4();
      conversations[conversationId] = [];
    }

    conversations[conversationId].push({ role: 'user', content: message });
    await saveMessage(conversationId, 'user', message);

    const schema = await getDatabaseSchema();
    const intentType = detectIntent(message);
    let botResponse = '';

    console.log("🔍 Intención detectada:", intentType);

    // Procesar según el tipo de intención
    if (intentType === 'web_search') {
      botResponse = await webSearch(message);
    } 
    else if (intentType.startsWith('insert_') || intentType.startsWith('select_') || 
             intentType === 'insert_generic' || intentType === 'select_generic' ||
             intentType === 'update_generic' || intentType === 'delete_generic' ||
             intentType === 'select_Accesorios_categoria_estetica') { // ← AÑADIR ESTA LÍNEA
      
      const intent = await interpretIntent(message, schema);
      
      if (intent.action !== 'none') {
        const result = await executeSQL(intent, schema);
        botResponse = result.message;
        
        // Para inserts, mostrar datos insertados
        if (intent.action === 'insert' && result.data) {
          botResponse += `\n\n📋 Datos insertados:`;
          Object.entries(result.data).forEach(([key, value]) => {
            if (value) botResponse += `\n• ${key}: ${value}`;
          });
        }
      } else {
        botResponse = "🤖 No entendí qué acción quieres realizar. Por favor sé más específico.";
      }
    }
    else if (['select_sql', 'insert_sql', 'update_sql', 'delete_sql'].includes(intentType)) {
      botResponse = await executeDirectSQL(message);
    } 
    else {
      // Consulta general al sistema de búsqueda
      try {
        const { answerQuery } = require('./search');
        const result = await answerQuery(message);
        botResponse = result.text;
      } catch (err) {
        botResponse = "🤖 No entendí tu consulta. Puedo ayudarte con:\n• Búsquedas en internet\n• Gestión de datos (agregar, ver, modificar, eliminar)\n• Consultas específicas de tu base de datos";
      }
    }

    conversations[conversationId].push({ role: 'assistant', content: botResponse });
    await saveMessage(conversationId, 'assistant', botResponse);

    res.json({ 
      conversationId, 
      response: {
        text: botResponse,
        sources: []
      }
    });
  } catch (err) {
    console.error('❌ Error en /chat:', err);
    res.status(500).json({ error: 'Error interno del servidor: ' + err.message });
  }
});

// 🗂️ Endpoints CRUD para gestión de tablas desde el frontend
app.get('/tables/:tableName', async (req, res) => {
  try {
    const { tableName } = req.params;
    const pool = await poolPromise;
    const result = await pool.request().query(`SELECT TOP 100 * FROM ${tableName} ORDER BY 1 DESC`);
    res.json({ success: true, data: result.recordset });
  } catch (err) {
    console.error('❌ Error obteniendo datos de tabla:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// INSERT desde frontend
app.post('/tables/:tableName', async (req, res) => {
  try {
    const { tableName } = req.params;
    const data = req.body;
    
    const pool = await poolPromise;
    const schema = await getDatabaseSchema();
    const tableSchema = schema[tableName];
    
    if (!tableSchema) {
      return res.status(400).json({ success: false, error: `Tabla ${tableName} no encontrada` });
    }

    // Filtrar columnas identity
    const nonIdentityColumns = tableSchema.filter(col => !col.isIdentity);
    const completeData = {};
    
    for (const column of nonIdentityColumns) {
      if (data[column.name] !== undefined && data[column.name] !== '') {
        completeData[column.name] = data[column.name];
      } else {
        if (column.type.includes('int') || column.type.includes('decimal') || column.type.includes('float')) {
          completeData[column.name] = null;
        } else {
          completeData[column.name] = '';
        }
      }
    }

    const cols = Object.keys(completeData).map(c => `[${c}]`).join(', ');
    const vals = Object.values(completeData)
      .map(v => {
        if (v === null) return 'NULL';
        if (typeof v === 'number') return v;
        return `'${v.toString().replace(/'/g, "''")}'`;
      })
      .join(', ');

    const query = `INSERT INTO ${tableName} (${cols}) VALUES (${vals})`;
    await pool.request().query(query);
    
    // Obtener ID generado
    const identityColumn = tableSchema.find(col => col.isIdentity);
    let generatedId = null;
    
    if (identityColumn) {
      const idResult = await pool.request().query(`SELECT SCOPE_IDENTITY() as new_id`);
      generatedId = idResult.recordset[0].new_id;
    }
    
    res.json({ 
      success: true, 
      message: 'Registro insertado correctamente',
      generatedId: generatedId,
      data: completeData
    });
    
  } catch (err) {
    console.error('❌ Error insertando registro:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// UPDATE desde frontend
app.put('/tables/:tableName/:id', async (req, res) => {
  try {
    const { tableName, id } = req.params;
    const data = req.body;
    
    const pool = await poolPromise;
    
    const sets = Object.entries(data)
      .map(([k, v]) => `[${k}]='${v.toString().replace(/'/g, "''")}'`)
      .join(', ');

    const query = `UPDATE ${tableName} SET ${sets} WHERE id = ${id}`;
    const result = await pool.request().query(query);
    
    res.json({ 
      success: true, 
      message: 'Registro actualizado correctamente',
      affectedRows: result.rowsAffected[0]
    });
    
  } catch (err) {
    console.error('❌ Error actualizando registro:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE desde frontend
app.delete('/tables/:tableName/:id', async (req, res) => {
  try {
    const { tableName, id } = req.params;
    
    const pool = await poolPromise;
    const query = `DELETE FROM ${tableName} WHERE id = ${id}`;
    const result = await pool.request().query(query);
    
    res.json({ 
      success: true, 
      message: 'Registro eliminado correctamente',
      affectedRows: result.rowsAffected[0]
    });
    
  } catch (err) {
    console.error('❌ Error eliminando registro:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/tables', async (req, res) => {
  try {
    const schema = await getDatabaseSchema();
    res.json({ success: true, tables: Object.keys(schema) });
  } catch (err) {
    console.error('❌ Error obteniendo tablas:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Función para ejecutar SQL directo
async function executeDirectSQL(query) {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(query);
    return `✅ Consulta ejecutada:\n${JSON.stringify(result.recordset, null, 2)}`;
  } catch (err) {
    return `⚠️ Error al ejecutar SQL: ${err.message}`;
  }
}

// 📜 Obtener historial
app.get('/history', async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query('SELECT * FROM ChatHistory ORDER BY createdAt ASC');
    res.json(result.recordset);
  } catch (err) {
    console.error('❌ Error al traer historial:', err);
    res.status(500).json({ error: 'Error al traer historial' });
  }
});

const port = process.env.PORT || 3001;
app.listen(port, () => console.log(`✅ Server escuchando en puerto ${port}`));