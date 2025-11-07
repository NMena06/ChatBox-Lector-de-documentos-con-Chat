import React from 'react';

const Message = ({ message }) => {
  return (
    <div className={`message ${message.role}`}>
      <div className="message-avatar">{message.role === 'user' ? '👤' : '🤖'}</div>
      <div className="message-content">
        <div className="message-sender">{message.role === 'user' ? 'Tú' : 'Asistente'}</div>
        <div className="message-text" style={{ whiteSpace: 'pre-wrap' }}>{message.text}</div>
        <div className="message-time">
          {new Date(message.timestamp).toLocaleTimeString('es-ES', {
            hour: '2-digit',
            minute: '2-digit'
          })}
        </div>
      </div>
    </div>
  );
};

export default Message;