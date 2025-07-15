// components/dashboard/TaskList.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Task } from '@prisma/client'; // Importa el tipo Task generado por Prisma

interface TaskListProps {
  refreshTrigger?: number;
  onEditTask?: (task: Task) => void;
}

export default function TaskList({ refreshTrigger, onEditTask = () => {} }: TaskListProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estados para los filtros
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [filterDueDate, setFilterDueDate] = useState('');

  // Estados para la paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10); // Puedes hacer esto configurable
  const [totalTasks, setTotalTasks] = useState(0); // Total de tareas que coinciden con los filtros

  const { data: session, status } = useSession();
  const userId = session?.user?.id;

  // Efecto para implementar el debounce en la búsqueda
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
      setCurrentPage(1); // Resetear a la primera página al cambiar la búsqueda
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, [searchQuery]);

  // Función para obtener las tareas (ahora con filtros y paginación)
  const fetchTasks = useCallback(async () => {
    if (status === 'loading') return;
    if (!userId) {
      setError('No se pudo cargar las tareas: Usuario no autenticado.');
      setIsLoading(false);
      setTasks([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Construir los parámetros de la URL para los filtros y paginación
      const params = new URLSearchParams();
      if (debouncedSearchQuery) params.append('search', debouncedSearchQuery);
      if (filterPriority) params.append('priority', filterPriority);
      if (filterDueDate) params.append('dueDate', filterDueDate);
      params.append('page', currentPage.toString());
      params.append('limit', itemsPerPage.toString());

      const queryString = params.toString();
      const url = `/api/tasks${queryString ? `?${queryString}` : ''}`;

      console.log('Fetching tasks from URL:', url); // Log para depuración

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 204) {
        setTasks([]);
        setTotalTasks(0);
        setIsLoading(false);
        return;
      }

      if (!response.ok) {
        let errorData = { message: 'Error al obtener las tareas.' };
        try {
          errorData = await response.json();
        } catch (parseError) {
          console.error("Error al parsear la respuesta de error JSON:", parseError);
        }
        throw new Error(errorData.message);
      }

      const result = await response.json();
      setTasks(result.tasks || []);
      setTotalTasks(result.totalTasks || 0); // Actualizar el total de tareas
    } catch (err: any) {
      console.error('Error al obtener tareas:', err);
      if (err instanceof SyntaxError && err.message.includes('JSON')) {
        setError('Error de formato de datos del servidor. Intente de nuevo o contacte al soporte.');
      } else {
        setError(err.message || 'Ocurrió un error inesperado al cargar las tareas.');
      }
      setTasks([]);
      setTotalTasks(0);
    } finally {
      setIsLoading(false);
    }
  }, [userId, status, debouncedSearchQuery, filterPriority, filterDueDate, currentPage, itemsPerPage]); // Dependencias de filtros y paginación

  // Efecto para cargar las tareas al montar el componente o cuando se activa el refreshTrigger o filtros/paginación
  useEffect(() => {
    fetchTasks();
  }, [fetchTasks, refreshTrigger]);

  // --- Manejadores de acciones de tareas individuales ---

  const handleDeleteTask = async (taskId: number) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta tarea?')) {
      return;
    }
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al eliminar la tarea.');
      }

      // Si la eliminación fue exitosa, refrescar la lista de tareas
      fetchTasks();
    } catch (err: any) {
      console.error('Error al eliminar tarea:', err);
      setError(err.message || 'Ocurrió un error al eliminar la tarea.');
    }
  };

  const handleToggleComplete = async (task: Task) => {
    try {
      const payload = {
        ...task,
        is_completed: !task.is_completed,
        due_date: task.due_date ? new Date(task.due_date).toISOString() : null,
      };

      const response = await fetch(`/api/tasks/${task.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al actualizar la tarea.');
      }

      fetchTasks();
    } catch (err: any) {
      console.error('Error al actualizar tarea:', err);
      setError(err.message || 'Ocurrió un error al actualizar la tarea.');
    }
  };

  // --- Manejadores de Paginación ---
  const totalPages = Math.ceil(totalTasks / itemsPerPage);

  const handlePreviousPage = () => {
    setCurrentPage(prev => Math.max(1, prev - 1));
  };

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(totalPages, prev + 1));
  };

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  const getPaginationButtons = () => {
    const buttons = [];
    const maxButtons = 5; // Número máximo de botones de página a mostrar
    let startPage = Math.max(1, currentPage - Math.floor(maxButtons / 2));
    let endPage = Math.min(totalPages, startPage + maxButtons - 1);

    if (endPage - startPage + 1 < maxButtons) {
      startPage = Math.max(1, endPage - maxButtons + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      buttons.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          className={`px-3 py-1 rounded-md text-sm font-medium transition-colors duration-200 ${
            i === currentPage
              ? 'bg-blue-600 text-white dark:bg-blue-700'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500'
          }`}
        >
          {i}
        </button>
      );
    }
    return buttons;
  };

  // --- Función para limpiar todos los filtros ---
  const handleClearFilters = () => {
    setSearchQuery('');
    setFilterPriority('');
    setFilterDueDate('');
    setCurrentPage(1); // Siempre volver a la primera página al limpiar filtros
  };


  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl font-sans text-gray-900 dark:text-white text-center">
        <p>Cargando tareas...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-3 rounded relative text-sm max-w-lg mx-auto shadow-xl">
        <strong className="font-bold">Error:</strong>
        <span className="block sm:inline"> {error}</span>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl font-sans text-gray-900 dark:text-white">
      <h2 className="text-2xl font-bold text-center text-gray-800 dark:text-white mb-6">Mis Tareas</h2>

      {/* Sección de Filtros */}
      <div className="mb-6 p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-700">
        <h3 className="text-lg font-semibold mb-3 text-gray-700 dark:text-gray-300">Filtros</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Buscar por Título/Descripción</label>
            <input
              type="text"
              id="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 dark:text-white"
              placeholder="Buscar tarea..."
            />
          </div>
          <div>
            <label htmlFor="filterPriority" className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Prioridad</label>
            <select
              id="filterPriority"
              value={filterPriority}
              onChange={(e) => { setFilterPriority(e.target.value); setCurrentPage(1); }} // Resetear página
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 dark:text-white"
            >
              <option value="">Todas</option>
              <option value="low">Baja</option>
              <option value="medium">Media</option>
              <option value="high">Alta</option>
            </select>
          </div>
          <div>
            <label htmlFor="filterDueDate" className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Fecha de Vencimiento</label>
            <input
              type="date"
              id="filterDueDate"
              value={filterDueDate}
              onChange={(e) => { setFilterDueDate(e.target.value); setCurrentPage(1); }} // Resetear página
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 dark:text-white"
            />
          </div>
        </div>
        <div className="mt-4 text-right">
          <button
            onClick={handleClearFilters}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500 transition-colors"
          >
            Limpiar Filtros
          </button>
        </div>
      </div>

      {tasks.length === 0 && !isLoading && !error ? (
        <p className="text-center text-gray-600 dark:text-gray-400">No tienes tareas que coincidan con los filtros.</p>
      ) : (
        <ul className="space-y-4">
          {tasks.map((task) => (
            <li
              key={task.id}
              className={`p-4 rounded-md shadow-sm border transition-colors duration-200 ${
                task.is_completed
                  ? 'bg-green-50 dark:bg-green-900 border-green-200 dark:border-green-700 opacity-70'
                  : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <h3
                  className={`text-lg font-semibold ${
                    task.is_completed ? 'line-through text-gray-500 dark:text-gray-400' : 'text-gray-800 dark:text-white'
                  }`}
                >
                  {task.title}
                </h3>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    task.priority === 'high'
                      ? 'bg-red-200 text-red-800 dark:bg-red-800 dark:text-red-200'
                      : task.priority === 'medium'
                      ? 'bg-yellow-200 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-200'
                      : 'bg-blue-200 text-blue-800 dark:bg-blue-800 dark:text-blue-200'
                  }`}
                >
                  {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                </span>
              </div>
              {task.description && (
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                  {task.description}
                </p>
              )}
              {task.due_date && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Vence: {new Date(task.due_date).toLocaleDateString()}
                </p>
              )}
              <div className="flex justify-end space-x-2 mt-3">
                <label className="flex items-center text-sm text-gray-600 dark:text-gray-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={task.is_completed}
                    onChange={() => handleToggleComplete(task)}
                    className="mr-1 h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded dark:bg-gray-700 dark:border-gray-600"
                  />
                  Completada
                </label>
                <button
                  onClick={() => onEditTask(task)}
                  className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium"
                >
                  Editar
                </button>
                <button
                  onClick={() => handleDeleteTask(task.id)}
                  className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 text-sm font-medium"
                >
                  Eliminar
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Controles de Paginación */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center space-x-2 mt-6 p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handlePreviousPage}
            disabled={currentPage === 1}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-blue-700 dark:hover:bg-blue-800"
          >
            Anterior
          </button>
          <div className="flex space-x-1">
            {getPaginationButtons()}
          </div>
          <button
            onClick={handleNextPage}
            disabled={currentPage === totalPages}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-blue-700 dark:hover:bg-blue-800"
          >
            Siguiente
          </button>
          <span className="ml-4 text-sm text-gray-700 dark:text-gray-300">
            Página {currentPage} de {totalPages} (Total: {totalTasks} tareas)
          </span>
        </div>
      )}
    </div>
  );
}
