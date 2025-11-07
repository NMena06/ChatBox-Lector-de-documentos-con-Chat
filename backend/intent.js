const Groq = require("groq-sdk");
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function interpretIntent(query) {
  try {
    const prompt = `
Analizá el siguiente mensaje y devolveme un JSON con:
- action: "insert", "update", "select" o "none"
- table: nombre de tabla si aplica
- data: objeto con columnas y valores si hay datos
- condition: condición si hay un WHERE (para updates o selects)

Mensaje: "${query}"
    `;

    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [{ role: "user", content: prompt }],
    });

    const content = completion.choices[0].message.content;
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { action: "none" };

    console.log("🧩 Interpretación:", parsed);
    return parsed;
  } catch (err) {
    console.error("Error interpretando intención:", err);
    return { action: "none" };
  }
}
async function executeSQL(intent) {
  try {
    const pool = await poolPromise;

    if (intent.action === 'insert') {
      const cols = Object.keys(intent.data).map(c => `[${c}]`).join(', ');
      const vals = Object.values(intent.data)
        .map(v => `'${v}'`)
        .join(', ');

      const query = `INSERT INTO ${intent.table} (${cols}) VALUES (${vals})`;
      await pool.request().query(query);
      return { message: `✅ Registro insertado correctamente en ${intent.table}` };

    } else if (intent.action === 'update') {
      const sets = Object.entries(intent.data)
        .map(([k, v]) => `[${k}]='${v}'`)
        .join(', ');

      const query = `UPDATE ${intent.table} SET ${sets} WHERE ${intent.condition || '1=1'}`;
      await pool.request().query(query);
      return { message: `✅ Registros actualizados en ${intent.table}` };
    }

    return { message: "⚠️ No se pudo ejecutar la instrucción." };
  } catch (err) {
    console.error("❌ Error ejecutando SQL:", err);
    return { message: "❌ Error al ejecutar la instrucción SQL." };
  }
}
