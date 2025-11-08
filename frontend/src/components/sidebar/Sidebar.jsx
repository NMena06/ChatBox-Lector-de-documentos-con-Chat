import React from 'react';
import SidebarNavigation from './SidebarNavigation';
import ProductosPanel from './ProductosPanel';
import ContabilidadPanel from './ContabilidadPanel';
import VentasPanel from './VentasPanel';
import ScriptsPanel from './ScriptsPanel';
import HelpPanel from './HelpPanel';
import mvRodados from '../../mvRodados.png';
import './Sidebar.css';

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
          className="sidebar-logo"
           height="60px"
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
        {activeSidebarTab === 'productos' && (
          <ProductosPanel 
            tables={tables}
            selectedTable={selectedTable}
            loadTableData={loadTableData}
          />
        )}
        
        {activeSidebarTab === 'contabilidad' && (
          <ContabilidadPanel 
            tables={tables}
            selectedTable={selectedTable}
            loadTableData={loadTableData}
          />
        )}
        
        {activeSidebarTab === 'ventas' && (
          <VentasPanel 
            tables={tables}
            selectedTable={selectedTable}
            loadTableData={loadTableData}
          />
        )}
        
        {activeSidebarTab === 'clientes' && (
          <VentasPanel 
            tables={tables}
            selectedTable={selectedTable}
            loadTableData={loadTableData}
          />
        )}
        
        {activeSidebarTab === 'scripts' && (
          <ScriptsPanel 
            usePrompt={usePrompt}
            selectedTable={selectedTable}
          />
        )}
        
        {/* {activeSidebarTab === 'help' && (
          <HelpPanel 
            usePrompt={usePrompt}
            quickAction={quickAction}
            setShowTables={setShowTables}
          />
        )} */}
      </div>
    </div>
  );
};

export default Sidebar;