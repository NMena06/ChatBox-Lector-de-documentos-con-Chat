import { useState, useRef, useEffect } from 'react';
import Swal from 'sweetalert2';

export const useChat = () => {
  const [query, setQuery] = useState('');
  const [chat, setChat] = useState([]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat]);

  const loadHistory = () => {
    fetch('http://localhost:3001/history')
      .then(res => res.json())
      .then(data => {
        setChat(data.history?.map(m => ({
          role: m.role,
          text: m.message,
          sources: JSON.parse(m.sources || '[]'),
          timestamp: m.createdAt
        })) || []);
      })
      .catch(err => {
        console.error(err);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo cargar el historial',
          timer: 3000
        });
      });
  };

  const sendQuery = async () => {
    if (!query.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Mensaje vacío',
        text: 'Por favor, escribe un mensaje',
        timer: 2000
      });
      return;
    }

    setLoading(true);
    setChat(c => [...c, { role: 'user', text: query, timestamp: new Date() }]);

    try {
      const resp = await fetch('http://localhost:3001/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      });
      
      if (!resp.ok) {
        throw new Error(`Error ${resp.status}: ${resp.statusText}`);
      }
      
      const data = await resp.json();
      const responseText = data.response?.text || data.response || 'Sin respuesta';
      
      setChat(c => [...c, { 
        role: 'assistant', 
        text: responseText, 
        sources: data.response?.sources || [], 
        timestamp: new Date() 
      }]);
      
    } catch (error) {
      console.error('Error:', error);
      setChat(c => [...c, { 
        role: 'assistant', 
        text: `Error al conectar con el servidor: ${error.message}`, 
        sources: [], 
        timestamp: new Date() 
      }]);
      
      Swal.fire({
        icon: 'error',
        title: 'Error de conexión',
        text: 'No se pudo conectar con el servidor',
        timer: 3000
      });
    }

    setQuery('');
    setLoading(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendQuery();
    }
  };

  const clearChat = () => {
    setChat([]);
    Swal.fire({
      icon: 'success',
      title: 'Conversación limpia',
      text: 'Listo para comenzar de nuevo',
      timer: 1500,
      showConfirmButton: false
    });
  };

  return {
    query,
    setQuery,
    chat,
    loading,
    messagesEndRef,
    sendQuery,
    handleKeyPress,
    loadHistory,
    clearChat
  };
};