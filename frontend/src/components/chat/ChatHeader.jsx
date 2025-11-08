import React from 'react';
import './ChatHeader.css';
const ChatHeader = ({ sidebarOpen, setSidebarOpen, loading }) => {
  return (
    <div className="chat-header">
      <div className="header-left">
        <button 
          className="sidebar-toggle"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          ☰
        </button>
        <h1>MvRodados - Sistema inteligente</h1>
      </div>
      <div className="status-indicator">
        <div className={`status-dot ${loading ? 'loading' : 'online'}`}></div>
        <span>{loading ? 'Pensando...' : 'En línea'}</span>
      </div>
    </div>
  );
};

export default ChatHeader;