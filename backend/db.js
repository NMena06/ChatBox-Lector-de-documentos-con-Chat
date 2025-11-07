require('dotenv').config();
const sql = require('mssql');

const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  port: parseInt(process.env.DB_PORT, 10),
  database: process.env.DB_NAME,
  options: {
    encrypt: false,             // porque es local
    trustServerCertificate: true,
    enableArithAbort: true
  }
};

const poolPromise = new sql.ConnectionPool(config)
  .connect()
  .then(pool => {
    console.log('✅ Conectado a SQL Server en puerto 1433');
    return pool;
  })
  .catch(err => console.log('❌ Error de conexión', err));

module.exports = { sql, poolPromise };
