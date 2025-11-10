import React from 'react';
import Message from './Message';
import './ChatMessages.css';

const ChatMessages = ({ 
  showTables, 
  selectedTable, 
  loading, 
  loadTableData, 
  setShowTables, 
  TableCRUD, 
  chat, 
  messagesEndRef 
}) => {
  if (showTables) {
    return (
      <div className="table-view">
        <div className="table-header">
          <h3>📋 {selectedTable}</h3>
          <div className="table-actions">
            <button 
              className="refresh-button"
              onClick={() => loadTableData(selectedTable)}
              disabled={loading}
            >
              {loading ? '🔄 Cargando...' : '🔄 Actualizar'}
            </button>
            <button 
              className="back-button"
              onClick={() => setShowTables(false)}
            >
              ← Volver al chat
            </button>
          </div>
        </div>
        
{loading ? (
  <div className="loading-table">
    <div className="loading-spinner"></div>
    Cargando datos de {selectedTable}...
  </div>
) : (
  TableCRUD?.()
)}

      </div>
    );
  }

  return (
    <>
      {chat.length === 0 && (
        <div className="empty-state">
          <div className="welcome-icon">💬</div>
          <h3>¡Bienvenido MvRodados - Sistema de Gestión inteligente!</h3>
          <p>Puedes:</p>
          <ul className="welcome-tips">
            <li>• <strong>Búsquedas en internet:</strong> "buscar precio honda wave en mercadolibre"</li>
            <li>• <strong>Agregar datos:</strong> "agregar cliente Juan Perez telefono 848484"</li>
            <li>• <strong>Ver datos:</strong> "mostrar clientes" o "ver motos"</li>
            <li>• <strong>Gestionar tablas:</strong> Usa el menú lateral para editar datos directamente</li>
          </ul>
        </div>
      )}

      {chat.map((m, i) => (
        <Message key={i} message={m} />
      ))}

      {loading && (
        <div className="message assistant">
          <div className="message-avatar">🤖</div>
          <div className="message-content">
            <div className="message-sender">Asistente</div>
            <div className="typing-indicator">
              <span></span><span></span><span></span>
            </div>
          </div>
        </div>
      )}

      <div ref={messagesEndRef} />
    </>
  );
};

export default ChatMessages;