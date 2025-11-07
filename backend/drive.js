const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

const SCOPES = ['https://www.googleapis.com/auth/drive.readonly'];
const TOKEN_PATH = path.join(__dirname, 'token.json');

// Autenticación con OAuth2
async function authorize() {
  const credentials = JSON.parse(fs.readFileSync('credentials.json'));
  const { client_secret, client_id, redirect_uris } = credentials.web;

  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

  // Intentar cargar token existente
  if (fs.existsSync(TOKEN_PATH)) {
    oAuth2Client.setCredentials(JSON.parse(fs.readFileSync(TOKEN_PATH)));
    return oAuth2Client;
  }

  // Generar link para obtener nuevo token
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });
  console.log('📎 Abrí este link en tu navegador para autorizar el acceso a Google Drive:\n', authUrl);

  // Esperar código manualmente
  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    readline.question('Pegá el código de autorización aquí: ', async (code) => {
      readline.close();
      const { tokens } = await oAuth2Client.getToken(code);
      oAuth2Client.setCredentials(tokens);
      fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens));
      console.log('✅ Token guardado en', TOKEN_PATH);
      resolve(oAuth2Client);
    });
  });
}

// Descargar todos los PDFs del Drive
async function downloadDrivePDFs() {
  const auth = await authorize();
  const drive = google.drive({ version: 'v3', auth });

  const res = await drive.files.list({
    q: "mimeType='application/pdf'",
    fields: 'files(id, name, modifiedTime)',
  });

  const files = res.data.files;
  if (!files.length) {
    console.log('📂 No hay archivos PDF en tu Drive.');
    return;
  }

  const downloadDir = path.join(__dirname, 'drive_pdfs');
  if (!fs.existsSync(downloadDir)) fs.mkdirSync(downloadDir);

  for (const file of files) {
    const destPath = path.join(downloadDir, file.name);
    const dest = fs.createWriteStream(destPath);
    console.log(`⬇️ Descargando: ${file.name}`);
    await drive.files.get({ fileId: file.id, alt: 'media' }, { responseType: 'stream' })
      .then(res => {
        return new Promise((resolve, reject) => {
          res.data
            .on('end', () => {
              console.log(`✅ Descargado: ${file.name}`);
              resolve();
            })
            .on('error', reject)
            .pipe(dest);
        });
      });
  }
}

module.exports = { downloadDrivePDFs };
