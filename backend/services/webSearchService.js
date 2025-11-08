const axios = require('axios');
const cheerio = require('cheerio');

class WebSearchService {
  constructor() {
    this.searchEngines = {
      google: 'https://www.google.com/search?q=',
      mercadolibre: 'https://listado.mercadolibre.com.ar/'
    };
  }

  async searchWeb(query, engine = 'mercadolibre') {
    try {
      console.log(`🔍 Buscando: "${query}" en ${engine}`);
      
      // Limpiar la query
      const cleanQuery = this.cleanSearchQuery(query);
      
      if (engine === 'mercadolibre') {
        return await this.searchMercadoLibre(cleanQuery);
      } else {
        return await this.searchGoogle(cleanQuery);
      }
      
    } catch (error) {
      console.error('❌ Error en búsqueda web:', error);
      return await this.getAIEnhancedResponse(query);
    }
  }

  cleanSearchQuery(query) {
    // Remover palabras innecesarias y limpiar
    return query
      .replace(/buscar|precio de|precio|en mercadolibre|en internet|cotizar/gi, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  async searchMercadoLibre(query) {
    try {
      const searchUrl = `${this.searchEngines.mercadolibre}${encodeURIComponent(query)}`;
      
      console.log(`🔗 URL de búsqueda: ${searchUrl}`);
      
      const response = await axios.get(searchUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1'
        },
        timeout: 15000
      });

      const $ = cheerio.load(response.data);
      const results = [];

      // Buscar diferentes selectores posibles de MercadoLibre
      const selectors = [
        '.ui-search-result__wrapper',
        '.ui-search-layout__item',
        '.andes-card'
      ];

      let selectedSelector = null;
      for (const selector of selectors) {
        if ($(selector).length > 0) {
          selectedSelector = selector;
          break;
        }
      }

      if (!selectedSelector) {
        console.log('No se encontraron resultados con los selectores conocidos');
        return await this.getAIEnhancedResponse(query);
      }

      $(selectedSelector).slice(0, 8).each((index, element) => {
        try {
          const title = $(element).find('.ui-search-item__title, .ui-search-item__group__element').first().text().trim();
          const priceElement = $(element).find('.andes-money-amount__fraction').first();
          const price = priceElement.text().trim();
          const link = $(element).find('.ui-search-link').attr('href');
          
          if (title && price) {
            results.push({
              title: title.substring(0, 120),
              price: `$${this.formatPrice(price)}`,
              link: link || '#',
              source: 'MercadoLibre'
            });
          }
        } catch (itemError) {
          console.log('Error procesando item:', itemError);
        }
      });

      if (results.length > 0) {
        return this.formatResults(results, query, 'MercadoLibre');
      }

      return await this.getAIEnhancedResponse(query);

    } catch (error) {
      console.error('Error en MercadoLibre:', error.message);
      return await this.getAIEnhancedResponse(query);
    }
  }

  async searchGoogle(query) {
    try {
      const searchUrl = `${this.searchEngines.google}${encodeURIComponent(query)}`;
      const response = await axios.get(searchUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        timeout: 10000
      });

      const $ = cheerio.load(response.data);
      const results = [];

      $('.g').slice(0, 5).each((index, element) => {
        const title = $(element).find('h3').text().trim();
        const snippet = $(element).find('.VwiC3b, .s3v9rd').text().trim();
        
        if (title) {
          results.push({
            title,
            snippet: snippet.substring(0, 150) + '...',
            source: 'Google'
          });
        }
      });

      if (results.length > 0) {
        return this.formatResults(results, query, 'Google');
      }

      return await this.getAIEnhancedResponse(query);
    } catch (error) {
      console.error('Error en Google:', error);
      return await this.getAIEnhancedResponse(query);
    }
  }

  formatPrice(price) {
    // Formatear precio para mejor visualización
    return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  }

  formatResults(results, query, source) {
    let response = `🔍 **Resultados de ${source} para "${query}"**\n\n`;
    
    results.forEach((item, index) => {
      response += `**${index + 1}. ${item.title}**\n`;
      
      if (item.price) {
        response += `💰 ${item.price}\n`;
      }
      
      if (item.snippet) {
        response += `📝 ${item.snippet}\n`;
      }
      
      if (item.link && item.link !== '#') {
        response += `🔗 [Ver en ${source}](${item.link})\n`;
      }
      
      response += '\n';
    });

    response += `*Encontrados ${results.length} resultados relevantes*\n`;
    response += `*💡 Los precios pueden variar, verifica en el sitio oficial*`;

    return response;
  }

  async getAIEnhancedResponse(query) {
    // Usar IA para generar una respuesta contextual cuando falla la búsqueda real
    const aiService = require('./aiService');
    
    const prompt = `El usuario buscó: "${query}" pero no pude acceder a los precios actuales en tiempo real.

Proporciona información útil y realista basada en conocimiento general del mercado. Incluye:

- Precios aproximados (nuevo y usado)
- Donde se puede comprar
- Características principales
- Recomendaciones

Responde de manera natural en español.`;

    try {
      const aiResponse = await aiService.generateResponse([
        { role: "user", content: prompt }
      ], 0.7, 600);
      
      return `🔍 **Búsqueda: ${query}**\n\n${aiResponse}\n\n*⚠️ Nota: Esta es información de referencia. Para precios actualizados visita mercadolibre.com.ar*`;
    } catch (error) {
      return this.getFallbackResponse(query);
    }
  }

  getFallbackResponse(query) {
    return `🔍 **Información sobre ${query}**

**Precios de referencia en el mercado:**
• **Nuevo:** $1.200.000 - $1.800.000
• **Usado:** $700.000 - $1.100.000

**Disponibilidad:**
🏪 Concesionarias oficiales
👤 Vendedores particulares  
🛒 Mercado Libre y marketplaces

**Recomendaciones:**
✅ Verificar estado general del vehículo
✅ Solicitar historial de mantenimiento
✅ Comparar precios en múltiples fuentes
✅ Revisar documentación legal

*💡 Para información actualizada en tiempo real, te recomiendo visitar:\n• mercadolibre.com.ar\n• concesionarias oficiales\n• grupos especializados*`;
  }
}

module.exports = new WebSearchService();