import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import Sidebar from './components/sidebar/Sidebar';
import ChatHeader from './components/chat/ChatHeader';
import ChatMessages from './components/chat/ChatMessages';
import ChatInput from './components/chat/ChatInput';
import TableCRUD from './components/tables/TableCRUD';
import { useChat } from './hooks/useChat';
import { useTables } from './hooks/useTables';
import { useConversations } from './hooks/useConversations';

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeSidebarTab, setActiveSidebarTab] = useState('tables');
  const [openHelpCategory, setOpenHelpCategory] = useState(null);

  // Usar hooks personalizados
  const chat = useChat();
  const tables = useTables();
  const conversations = useConversations();

  // Cargar datos al iniciar
  useEffect(() => {
    chat.loadHistory();
    conversations.loadConversations();
    tables.loadTables();
  }, []);

  // Función para usar prompts de ayuda
  const usePrompt = (promptText) => {
    chat.setQuery(promptText);
    setSidebarOpen(false);
    setTimeout(() => {
      const input = document.querySelector('.chat-input');
      if (input) input.focus();
    }, 100);
  };

  // Función para acción rápida
  const quickAction = (action) => {
    switch(action) {
      case 'clear':
        chat.clearChat();
        tables.setShowTables(false);
        break;
      case 'history':
        chat.loadHistory();
        Swal.fire({
          icon: 'info',
          title: 'Historial cargado',
          text: 'Historial actualizado',
          timer: 1500,
          showConfirmButton: false
        });
        break;
      case 'refresh':
        tables.loadTables();
        Swal.fire({
          icon: 'info',
          title: 'Tablas actualizadas',
          text: 'Lista de tablas refrescada',
          timer: 1500,
          showConfirmButton: false
        });
        break;
      default:
        break;
    }
  };

  return (
    <div className="app-container">
      {/* Sidebar */}
      <Sidebar 
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        activeSidebarTab={activeSidebarTab}
        setActiveSidebarTab={setActiveSidebarTab}
        tables={tables.tables}
        selectedTable={tables.selectedTable}
        loadTableData={tables.loadTableData}
        conversations={conversations.conversations}
        formatDate={conversations.formatDate}
        setShowTables={tables.setShowTables}
        usePrompt={usePrompt}
        quickAction={quickAction}
      />

      {/* Overlay para móvil */}
      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)}></div>}

      {/* Chat Principal */}
      <div className="chat-container">
        <ChatHeader 
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          loading={chat.loading}
        />

        <div className="chat-messages">
          <ChatMessages 
            showTables={tables.showTables}
            selectedTable={tables.selectedTable}
            loading={tables.loading}
            loadTableData={tables.loadTableData}
            setShowTables={tables.setShowTables}
            TableCRUD={() => (
              <TableCRUD 
                tableData={tables.tableData}
                editingRow={tables.editingRow}
                setEditingRow={tables.setEditingRow}
                newRow={tables.newRow}
                setNewRow={tables.setNewRow}
                handleAddRow={tables.handleAddRow}
                handleUpdateRow={tables.handleUpdateRow}
                handleDeleteRow={tables.handleDeleteRow}
              />
            )}
            chat={chat.chat}
            messagesEndRef={chat.messagesEndRef}
          />
        </div>

        <ChatInput 
          query={chat.query}
          setQuery={chat.setQuery}
          handleKeyPress={chat.handleKeyPress}
          loading={chat.loading}
          sendQuery={chat.sendQuery}
        />
      </div>
    </div>
  );
}