import { useState } from 'react';
import Swal from 'sweetalert2';

const API_BASE = 'http://localhost:3001/api';

export const useTables = () => {
  const [tables, setTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState('');
  const [tableData, setTableData] = useState([]);
  const [showTables, setShowTables] = useState(false);
  const [editingRow, setEditingRow] = useState(null);
  const [newRow, setNewRow] = useState({});
  const [loading, setLoading] = useState(false);

  const loadTables = () => {
    fetch(`${API_BASE}/tables`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setTables(data.tables || []);
        } else {
          throw new Error(data.error);
        }
      })
      .catch(err => {
        console.error('Error cargando tablas:', err);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudieron cargar las tablas',
          timer: 3000
        });
      });
  };

  const loadTableData = (tableName) => {
    setSelectedTable(tableName);
    setLoading(true);
    
    fetch(`${API_BASE}/tables/${tableName}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setTableData(data.data);
          setShowTables(true);
          Swal.fire({
            icon: 'success',
            title: 'Tabla cargada',
            text: `Datos de ${tableName} cargados correctamente`,
            timer: 2000,
            showConfirmButton: false
          });
        } else {
          throw new Error(data.error);
        }
      })
      .catch(err => {
        console.error('Error cargando tabla:', err);
        setTableData([]);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: `No se pudo cargar la tabla ${tableName}: ${err.message}`,
          timer: 3000
        });
      })
      .finally(() => setLoading(false));
  };

  const handleAddRow = () => {
    if (Object.keys(newRow).length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Campos vacíos',
        text: 'Por favor, completa al menos un campo',
        timer: 3000
      });
      return;
    }
    
    fetch(`${API_BASE}/tables/${selectedTable}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newRow)
    })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        loadTableData(selectedTable);
        setNewRow({});
        Swal.fire({
          icon: 'success',
          title: '¡Éxito!',
          text: 'Registro agregado correctamente',
          timer: 2000,
          showConfirmButton: false
        });
      } else {
        throw new Error(data.error);
      }
    })
    .catch(err => {
      console.error('Error agregando registro:', err);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: `Error al agregar registro: ${err.message}`,
        timer: 3000
      });
    });
  };

  const handleUpdateRow = (id, data) => {
    fetch(`${API_BASE}/tables/${selectedTable}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        loadTableData(selectedTable);
        setEditingRow(null);
        Swal.fire({
          icon: 'success',
          title: '¡Éxito!',
          text: 'Registro actualizado correctamente',
          timer: 2000,
          showConfirmButton: false
        });
      } else {
        throw new Error(data.error);
      }
    })
    .catch(err => {
      console.error('Error actualizando registro:', err);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: `Error al actualizar registro: ${err.message}`,
        timer: 3000
      });
    });
  };

  const handleDeleteRow = async (id) => {
    const result = await Swal.fire({
      title: '¿Estás seguro?',
      text: "¡No podrás revertir esta acción!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (!result.isConfirmed) return;
    
    fetch(`${API_BASE}/tables/${selectedTable}/${id}`, {
      method: 'DELETE'
    })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        loadTableData(selectedTable);
        Swal.fire({
          icon: 'success',
          title: '¡Eliminado!',
          text: 'Registro eliminado correctamente',
          timer: 2000,
          showConfirmButton: false
        });
      } else {
        throw new Error(data.error);
      }
    })
    .catch(err => {
      console.error('Error eliminando registro:', err);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: `Error al eliminar registro: ${err.message}`,
        timer: 3000
      });
    });
  };
const goBackToChat = () => {
  setShowTables(false);
  setSelectedTable('');
  setTableData([]);
};
  return {
    tables,
    selectedTable,
    tableData,
    showTables,
    setShowTables,
    editingRow,
    setEditingRow,
    newRow,
    setNewRow,
    loading,
    loadTables,
    loadTableData,
    handleAddRow,
    handleUpdateRow,
    goBackToChat,
    handleDeleteRow
  };
};