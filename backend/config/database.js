require('dotenv').config();
const sql = require('mssql');

const dbConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  port: parseInt(process.env.DB_PORT, 10),
  database: process.env.DB_NAME,
  options: {
    encrypt: false,
    trustServerCertificate: true,
    enableArithAbort: true,
    connectTimeout: 30000,
    requestTimeout: 30000,
    pool: {
      max: 10,
      min: 0,
      idleTimeoutMillis: 30000
    }
  }
};

class Database {
  constructor() {
    this.pool = null;
    this.connected = false;
  }

  async connect() {
    try {
      this.pool = await new sql.ConnectionPool(dbConfig).connect();
      this.connected = true;
      console.log('✅ Conectado a SQL Server');
      return this.pool;
    } catch (err) {
      console.error('❌ Error de conexión a DB:', err);
      throw err;
    }
  }

  async getConnection() {
    if (!this.connected) {
      await this.connect();
    }
    return this.pool;
  }

  async close() {
    if (this.pool) {
      await this.pool.close();
      this.connected = false;
      console.log('🔌 Conexión a DB cerrada');
    }
  }
}

module.exports = { sql, Database: new Database() };