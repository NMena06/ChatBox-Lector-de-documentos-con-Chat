import React from 'react';
import Swal from 'sweetalert2';

const ConversationsPanel = ({ conversations, formatDate, setShowTables }) => {
  const handleNewConversation = () => {
    setShowTables(false);
    Swal.fire({
      icon: 'success',
      title: 'Nueva conversación',
      text: 'Conversación limpia lista para comenzar',
      timer: 2000,
      showConfirmButton: false
    });
  };

  const handleLoadConversation = () => {
    setShowTables(false);
    Swal.fire({
      icon: 'info',
      title: 'Cargando conversación',
      text: 'Cargando historial de conversación...',
      timer: 1500,
      showConfirmButton: false
    });
  };

  return (
    <div className="conversations-section">
      <h3>💬 Conversaciones</h3>
      <button 
        className="new-conversation-btn"
        onClick={handleNewConversation}
      >
        + Nueva Conversación
      </button>
      
      <div className="conversations-list">
        {conversations.map(conv => (
          <div 
            key={conv.id}
            className="conversation-item"
            onClick={handleLoadConversation}
          >
            <div className="conversation-preview">
              <div className="conversation-text">
                {conv.lastMessage || 'Nueva conversación'}
              </div>
              <div className="conversation-date">
                {formatDate(conv.lastActivity)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ConversationsPanel;