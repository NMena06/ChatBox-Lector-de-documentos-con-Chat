const { executeQuery } = require('../db');

class TipoComprobanteController {
  async listar(req, res) {
    try {
      const result = await executeQuery(`SELECT * FROM TipoComprobante ORDER BY nombre`);
      res.json({ success: true, data: result.data });
    } catch (error) {
      console.error('❌ Error listando tipos de comprobante:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }
}

module.exports = new TipoComprobanteController();
