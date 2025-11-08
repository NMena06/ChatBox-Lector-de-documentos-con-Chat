import { useState } from 'react';
import Swal from 'sweetalert2';

const API_BASE = 'http://localhost:3001/api';

export const useConversations = () => {
  const [conversations, setConversations] = useState([]);

  const loadConversations = () => {
    fetch(`${API_BASE}/conversations`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setConversations(data.conversations || []);
        } else {
          throw new Error(data.error);
        }
      })
      .catch(err => {
        console.error('Error cargando conversaciones:', err);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudieron cargar las conversaciones',
          timer: 3000
        });
      });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Ayer';
    if (diffDays === 2) return 'Anteayer';
    if (diffDays <= 7) return `Hace ${diffDays} días`;
    
    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  return {
    conversations,
    loadConversations,
    formatDate
  };
};