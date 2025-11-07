// frontend/src/App.jsx
import React, { useState, useRef, useEffect } from 'react';

export default function App() {
  const [query, setQuery] = useState('');
  const [chat, setChat] = useState([]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chat]);

  async function sendQuery() {
    if (!query.trim()) return;
    setLoading(true);
    setChat(c => [...c, { role: 'user', text: query }]);

    try {
      const resp = await fetch('http://localhost:3001/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      });
      const data = await resp.json();

      // Desestructuramos correctamente la respuesta
      const { text, sources } = data.response || { text: 'Sin respuesta', sources: [] };

      setChat(c => [...c, {
        role: 'assistant',
        text,
        sources
      }]);
    } catch (error) {
      setChat(c => [...c, { 
        role: 'assistant', 
        text: 'Error al conectar con el servidor',
        sources: []
      }]);
    }

    setQuery('');
    setLoading(false);
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendQuery();
    }
  };

  return (
    <div className="chat-container">
      <div className="chat-header">
        <h1>Lectura con ChatBox de documentos</h1>
        <div className="status-indicator">
          <div className={`status-dot ${loading ? 'loading' : 'online'}`}></div>
          <span>{loading ? 'Pensando...' : 'En línea'}</span>
        </div>
      </div>

      <div className="chat-messages">
        {chat.length === 0 ? (
          <div className="empty-state">
            <div className="welcome-icon">💬</div>
            <h3>¡Bienvenido MsAyuda-Chatbot!</h3>
            <p>Haz una pregunta sobre tus documentos y te ayudaré a encontrar la información.</p>
          </div>
        ) : (
          chat.map((m, i) => (
            <div key={i} className={`message ${m.role}`}>
              <div className="message-avatar">
                {m.role === 'user' ? '👤' : '🤖'}
              </div>
              <div className="message-content">
                <div className="message-sender">
                  {m.role === 'user' ? 'Tú' : 'Asistente'}
                </div>
                <div className="message-text">{m.text}</div>
                {m.sources && m.sources.length > 0 && (
                  <div className="sources">
                    <div className="sources-label">Fuentes:</div>
                    <div className="sources-list">
                      {m.sources.map((s, idx) => (
                        <span key={idx} className="source-tag">
                          {s.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
        {loading && (
          <div className="message assistant">
            <div className="message-avatar">🤖</div>
            <div className="message-content">
              <div className="message-sender">Ayudin</div>
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input-container">
        <div className="input-wrapper">
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Escribe tu mensaje..."
            disabled={loading}
            className="chat-input"
          />
          <button 
            onClick={sendQuery} 
            disabled={loading || !query.trim()}
            className="send-button"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M2 21L23 12L2 3V10L17 12L2 14V21Z" fill="currentColor"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
