import React, { useState } from 'react';
import { helpData } from '../../data/helpData';

const HelpPanel = ({ usePrompt, quickAction, setShowTables }) => {
  const [openHelpCategory, setOpenHelpCategory] = useState(null);

  const toggleHelpCategory = (categoryId) => {
    setOpenHelpCategory(openHelpCategory === categoryId ? null : categoryId);
  };

  return (
    <div className="help-panel">
      <h3>💡 Ayuda Rápida</h3>
      
      <div className="help-categories">
        {helpData.map(category => (
          <div key={category.id} className="help-category">
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
              <div className="prompt-list">
                {category.prompts.map((prompt, index) => (
                  <div
                    key={index}
                    className="prompt-item"
                    onClick={() => usePrompt(prompt.text)}
                  >
                    {prompt.text}
                    <small>{prompt.description}</small>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="quick-actions">
        <button 
          className="quick-action-btn"
          onClick={() => quickAction('clear')}
        >
          🗑️ Limpiar Chat
        </button>
        <button 
          className="quick-action-btn"
          onClick={() => quickAction('history')}
        >
          📜 Recargar Historial
        </button>
        <button 
          className="quick-action-btn"
          onClick={() => quickAction('refresh')}
        >
          🔄 Actualizar Tablas
        </button>
        <button 
          className="quick-action-btn"
          onClick={() => setShowTables(false)}
        >
          💬 Volver al Chat
        </button>
      </div>
    </div>
  );
};

export default HelpPanel;