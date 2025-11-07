import React from 'react';
import SidebarNavigation from './SidebarNavigation';
import TablesPanel from './TablesPanel';
import ConversationsPanel from './ConversationsPanel';
import HelpPanel from './HelpPanel';
import CommandsPanel from './CommandsPanel';
import mvRodados from '../../mvRodados.png';

const Sidebar = ({ 
  sidebarOpen, 
  setSidebarOpen, 
  activeSidebarTab, 
  setActiveSidebarTab,
  tables,
  selectedTable,
  loadTableData,
  conversations,
  formatDate,
  setShowTables,
  usePrompt,
  quickAction
}) => {
  return (
    <div className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
      <div className="sidebar-header">
        <img 
          src={mvRodados} 
          alt="MV Rodados" 
          style={{ height: '100px', objectFit: 'contain' }} 
        />
        <button 
          className="sidebar-close"
          onClick={() => setSidebarOpen(false)}
        >
          ✕
        </button>
      </div>
      
      <SidebarNavigation 
        activeSidebarTab={activeSidebarTab} 
        setActiveSidebarTab={setActiveSidebarTab} 
      />
      
      <div className="sidebar-content">
        {activeSidebarTab === 'tables' && (
          <TablesPanel 
            tables={tables}
            selectedTable={selectedTable}
            loadTableData={loadTableData}
          />
        )}
        
        {activeSidebarTab === 'conversations' && (
          <ConversationsPanel 
            conversations={conversations}
            formatDate={formatDate}
            setShowTables={setShowTables}
          />
        )}
        
        {activeSidebarTab === 'help' && (
          <HelpPanel 
            usePrompt={usePrompt}
            quickAction={quickAction}
            setShowTables={setShowTables}
          />
        )}
        
        {activeSidebarTab === 'commands' && (
          <CommandsPanel />
        )}
      </div>
    </div>
  );
};

export default Sidebar;