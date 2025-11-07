export const helpData = [
  {
    id: 'search',
    title: '🔍 Búsquedas',
    icon: '🔍',
    prompts: [
      {
        text: 'buscar precio honda wave 110 en mercadolibre',
        description: 'Búsqueda en internet'
      },
      {
        text: 'mostrar todos los clientes',
        description: 'Ver tabla completa'
      },
      {
        text: 'buscar motos marca yamaha',
        description: 'Búsqueda con filtro'
      },
      {
        text: 'ver accesorios categoria estetica',
        description: 'Búsqueda por categoría'
      }
    ]
  },
  {
    id: 'insert',
    title: '➕ Insertar Datos',
    icon: '➕',
    prompts: [
      {
        text: 'agregar nuevo cliente Juan Perez telefono 123456789',
        description: 'Cliente básico'
      },
      {
        text: 'nueva moto yamaha yzf r6 color azul año 2020',
        description: 'Moto completa'
      },
      {
        text: 'insertar accesorio espejo retrovisor marca x precio 15000',
        description: 'Accesorio con precio'
      },
      {
        text: 'agregar casco modelo xt-500 talla m color negro',
        description: 'Casco completo'
      }
    ]
  },
  {
    id: 'update',
    title: '✏️ Actualizar',
    icon: '✏️',
    prompts: [
      {
        text: 'actualizar precio de moto id 5 a 2500000',
        description: 'Actualizar campo específico'
      },
      {
        text: 'modificar telefono del cliente Maria Lopez a 987654321',
        description: 'Actualizar contacto'
      },
      {
        text: 'cambiar estado de moto id 3 a Vendida',
        description: 'Cambiar estado'
      }
    ]
  },
  {
    id: 'delete',
    title: '🗑️ Eliminar',
    icon: '🗑️',
    prompts: [
      {
        text: 'eliminar cliente id 10',
        description: 'Eliminar por ID'
      },
      {
        text: 'borrar moto modelo antiguo',
        description: 'Eliminar con filtro'
      },
      {
        text: 'quitar accesorio id 25',
        description: 'Eliminar accesorio'
      }
    ]
  },
  {
    id: 'tables',
    title: '📊 Gestión Tablas',
    icon: '📊',
    prompts: [
      {
        text: 'ver estructura tabla clientes',
        description: 'Ver columnas de tabla'
      },
      {
        text: 'mostrar últimas 10 ventas',
        description: 'Límite de resultados'
      },
      {
        text: 'buscar clientes con telefono no vacio',
        description: 'Filtro con condición'
      }
    ]
  }
];