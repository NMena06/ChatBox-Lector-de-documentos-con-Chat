import { useState } from 'react';
import Swal from 'sweetalert2';

export const useTables = () => {
  const [tables, setTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState('');
  const [tableData, setTableData] = useState([]);
  const [showTables, setShowTables] = useState(false);
  const [editingRow, setEditingRow] = useState(null);
  const [newRow, setNewRow] = useState({});
  const [loading, setLoading] = useState(false);

  const loadTables = () => {
    fetch('http://localhost:3001/tables')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setTables(data.tables || []);
        }
      })
      .catch(err => {
        console.error(err);
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
    
    fetch(`http://localhost:3001/tables/${tableName}`)
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
        }
      })
      .catch(err => {
        console.error('Error cargando tabla:', err);
        setTableData([]);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: `No se pudo cargar la tabla ${tableName}`,
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
    
    fetch(`http://localhost:3001/tables/${selectedTable}`, {
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
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Error: ' + data.error,
          timer: 3000
        });
      }
    })
    .catch(err => {
      console.error('Error agregando registro:', err);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Error al agregar registro',
        timer: 3000
      });
    });
  };

  const handleUpdateRow = (id, data) => {
    fetch(`http://localhost:3001/tables/${selectedTable}/${id}`, {
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
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Error: ' + data.error,
          timer: 3000
        });
      }
    })
    .catch(err => {
      console.error('Error actualizando registro:', err);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Error al actualizar registro',
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
    
    fetch(`http://localhost:3001/tables/${selectedTable}/${id}`, {
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
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Error: ' + data.error,
          timer: 3000
        });
      }
    })
    .catch(err => {
      console.error('Error eliminando registro:', err);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Error al eliminar registro',
        timer: 3000
      });
    });
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
    handleDeleteRow
  };
};