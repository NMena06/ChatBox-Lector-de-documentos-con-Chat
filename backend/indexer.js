// backend/indexer.js
const { google } = require("googleapis");
const pdf = require("pdf-parse");
const fs = require("fs");
const path = require("path");

const TEMP_DIR = path.join(__dirname, "temp");
if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR);

let indexedDocs = [];

/**
 * Descarga y lee archivos PDF desde Google Drive
 */
async function indexDriveFiles(tokens) {
  const oAuth2Client = new google.auth.OAuth2();
  oAuth2Client.setCredentials(tokens);

  const drive = google.drive({ version: "v3", auth: oAuth2Client });

  console.log("📁 Indexando archivos PDF de tu Drive...");

  // Buscar PDFs
  const res = await drive.files.list({
    q: "mimeType='application/pdf'",
    fields: "files(id, name, mimeType)",
    pageSize: 10,
  });

  const files = res.data.files || [];
  indexedDocs = []; // reinicia índice

  for (const file of files) {
    console.log(`📄 Leyendo: ${file.name}`);

    const destPath = path.join(TEMP_DIR, file.id + ".pdf");
    const dest = fs.createWriteStream(destPath);

    // Descargar archivo
    await new Promise((resolve, reject) => {
      drive.files
        .get({ fileId: file.id, alt: "media" }, { responseType: "stream" })
        .then((res) => {
          res.data
            .on("end", resolve)
            .on("error", reject)
            .pipe(dest);
        });
    });

    // Leer PDF
    const buffer = fs.readFileSync(destPath);
    const data = await pdf(buffer);

    indexedDocs.push({
      id: file.id,
      name: file.name,
      text: data.text.slice(0, 5000), // limitar texto
    });

    fs.unlinkSync(destPath); // limpiar
  }

  console.log("✅ Indexación completada:", indexedDocs.length, "PDFs leídos");
  return indexedDocs;
}

function getIndexedDocs() {
  return indexedDocs;
}

module.exports = { indexDriveFiles, getIndexedDocs };
