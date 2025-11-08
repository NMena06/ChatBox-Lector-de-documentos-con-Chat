import React from 'react';
import './ChatInput.css';
const ChatInput = ({ query, setQuery, handleKeyPress, loading, sendQuery }) => {
  return (
    <div className="chat-input-container">
      <div className="input-wrapper">
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Ej: buscar precio honda wave en mercadolibre, o agregar cliente Juan Perez..."
          disabled={loading}
          className="chat-input"
        />
        <button onClick={sendQuery} disabled={loading || !query.trim()} className="send-button">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M2 21L23 12L2 3V10L17 12L2 14V21Z" fill="currentColor"/>
          </svg>
        </button>
      </div>
    </div>
  );
};

export default ChatInput;