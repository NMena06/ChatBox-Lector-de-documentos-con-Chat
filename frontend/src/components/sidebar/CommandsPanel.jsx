import React, { useState } from 'react';
import { commandsData } from '../../data/commandsData';

const CommandsPanel = () => {
  const [openHelpCategory, setOpenHelpCategory] = useState(null);

  const toggleHelpCategory = (categoryId) => {
    setOpenHelpCategory(openHelpCategory === categoryId ? null : categoryId);
  };

  return (
    <div className="commands-panel">
      <h3>⌨️ Comandos del Sistema</h3>
      
      <div className="commands-categories">
        {commandsData.map(category => (
          <div key={category.id} className="command-category">
            <div 
              className="category-header"
              onClick={() => toggleHelpCategory(category.id)}
            >
              <div className="category-title">
                <span className="category-icon">{category.icon}</span>
                {category.title}
              </div>
              <div className={`category-arrow ${openHelpCategory === category.id ? 'open' : ''}`}>
                ▼
              </div>
            </div>
            <div className={`category-content ${openHelpCategory === category.id ? 'open' : ''}`}>
              <div className="command-list">
                {category.items.map((item, index) => (
                  <div key={index} className="command-item">
                    <div className="command-title">{item.title}</div>
                    <div className="command-description">{item.description}</div>
                    <div className="keywords-list">
                      {item.keywords.map((keyword, kwIndex) => (
                        <span key={kwIndex} className="keyword-tag">
                          {keyword}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="usage-tips">
        <h4>💡 Consejos de Uso:</h4>
        <ul>
          <li>• Combina palabras clave para mejores resultados</li>
          <li>• Usa nombres específicos de tablas cuando sea posible</li>
          <li>• Para búsqueda web, no menciones tablas de la base de datos</li>
          <li>• El sistema completa automáticamente campos faltantes</li>
        </ul>
      </div>
    </div>
  );
};

export default CommandsPanel;