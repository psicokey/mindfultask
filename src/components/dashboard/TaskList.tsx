'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
// Asumimos que estas funciones existen en 'app/lib/guest-storage'
import { getGuestTasks, saveGuestTasks } from 'app/lib/guest-storage';
import { FaTrash, FaEdit, FaCheckSquare, FaSquare } from 'react-icons/fa'; // Iconos para el UI
import { Task } from '@prisma/client';

interface TaskListProps {
  refreshTrigger: number; // Un número que cambia para forzar la recarga
  onEditTask?: (task: Task) => void; // Función opcional para editar una tarea
}

export default function TaskList({ refreshTrigger, onEditTask = () => {} }: TaskListProps) {
  // --- Estados del componente ---
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estados para los filtros
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [filterDueDate, setFilterDueDate] = useState('');
  const [filterIsCompleted, setFilterIsCompleted] = useState('');

  // Estados para la ordenación
  const [sortField, setSortField] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');

  // Estados para la paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [totalTasks, setTotalTasks] = useState(0);

  // Estados para el modal de confirmación de eliminación
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [taskToDeleteId, setTaskToDeleteId] = useState<number | null>(null);

  // --- Hooks de Next.js y NextAuth ---
  const { data: session, status } = useSession();
  const userId = session?.user?.id;
  const router = useRouter();

  // --- Efectos y funciones ---

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

  // Función para obtener las tareas (con filtros, ordenación y paginación)
  const fetchTasks = useCallback(async () => {
    // Si la sesión está cargando, no hacer nada y mantener el estado de carga
    if (status === 'loading') {
      setIsLoading(true);
      return;
    }

    // Lógica para modo invitado o usuario autenticado
    if (status === 'unauthenticated' || userId?.startsWith('guest-')) {
      // Modo Invitado: Cargar tareas desde localStorage
      console.log('Modo Invitado: Cargando tareas desde localStorage.');
      const guestTasks = getGuestTasks();
      setTasks(guestTasks);
      setTotalTasks(guestTasks.length);
      setIsLoading(false);
      return;
    } else if (!userId) {
      // Si la sesión cargó y no hay usuario, redirigir
      setError('No se pudo cargar las tareas: Usuario no autenticado.');
      setIsLoading(false);
      setTasks([]);
      router.push('/login');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Construir los parámetros de la URL para filtros, ordenación y paginación
      const params = new URLSearchParams();
      if (debouncedSearchQuery) params.append('search', debouncedSearchQuery);
      if (filterPriority) params.append('priority', filterPriority);
      if (filterDueDate) params.append('dueDate', filterDueDate);
      if (filterIsCompleted) params.append('isCompleted', filterIsCompleted);
      params.append('page', currentPage.toString());
      params.append('limit', itemsPerPage.toString());
      params.append('sortField', sortField);
      params.append('sortOrder', sortOrder);

      const queryString = params.toString();
      const url = `/api/tasks${queryString ? `?${queryString}` : ''}`;
      console.log('Fetching tasks from API URL:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.status === 204) {
        setTasks([]);
        setTotalTasks(0);
        setIsLoading(false);
        return;
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al obtener las tareas.');
      }

      const result = await response.json();
      setTasks(result.tasks || []);
      setTotalTasks(result.totalTasks || 0);
    } catch (err) {
      console.error('Error al cargar las tareas:', err);
      if (err instanceof Error) {
        setError(err.message || 'Ocurrió un error al cargar las tareas.');
      } else {
        setError('Ocurrió un error al cargar las tareas.');
      }
      setTasks([]);
      setTotalTasks(0);
    } finally {
      setIsLoading(false);
    }
  }, [userId, status, debouncedSearchQuery, filterPriority, filterDueDate, filterIsCompleted, currentPage, itemsPerPage, sortField, sortOrder, router]);

  // Cargar las tareas al montar el componente o cuando se activa el refreshTrigger, filtros, paginación u ordenación
  useEffect(() => {
    fetchTasks();
  }, [fetchTasks, refreshTrigger]);

  // --- Manejadores de acciones de tareas individuales ---

  const handleDeleteTask = async () => {
    if (taskToDeleteId === null) return;
    setShowDeleteModal(false);

    // Modo Invitado
    if (status === 'unauthenticated' || session?.user?.id?.startsWith('guest-')) {
      const currentTasks = getGuestTasks();
      const updatedTasks = currentTasks.filter(t => t.id !== taskToDeleteId);
      saveGuestTasks(updatedTasks);
      return fetchTasks();
    }

    try {
      const response = await fetch(`/api/tasks/${taskToDeleteId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al eliminar la tarea.');
      }

      fetchTasks();
    } catch (err) {
      console.error('Error al eliminar tarea:', err);
      if (err instanceof Error) {
        setError(err.message || 'Ocurrió un error al eliminar la tarea.');
      } else {
        setError('Ocurrió un error al eliminar la tarea.');
      }
    }
  };

  const handleToggleComplete = async (task: Task) => {
    // Modo Invitado
    if (status === 'unauthenticated' || session?.user?.id?.startsWith('guest-')) {
      const currentTasks = getGuestTasks();
      const updatedTasks = currentTasks.map(t => {
        if (t.id === task.id) {
          return { ...t, is_completed: !t.is_completed };
        }
        return t;
      });
      saveGuestTasks(updatedTasks);
      return fetchTasks();
    }

    // Modo Autenticado
    try {
      const payload = {
        ...task,
        is_completed: !task.is_completed,
        due_date: task.due_date ? new Date(task.due_date).toISOString() : null,
      };

      const response = await fetch(`/api/tasks/${task.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al actualizar la tarea.');
      }

      fetchTasks();
    } catch (err) {
      console.error('Error al actualizar tarea:', err);
      if (err instanceof Error) {
        setError(err.message || 'Ocurrió un error al actualizar la tarea.');
      } else {
        setError('Ocurrió un error al actualizar la tarea.');
      }
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

  const getPaginationButtons = useMemo(() => {
    const buttons = [];
    const maxButtons = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxButtons / 2));
    const endPage = Math.min(totalPages, startPage + maxButtons - 1);

    if (endPage - startPage + 1 < maxButtons) {
      startPage = Math.max(1, endPage - maxButtons + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      buttons.push(
        <button
          key={i}
          onClick={() => setCurrentPage(i)}
          className={`px-3 py-1 rounded-md text-sm font-medium transition-colors duration-200 ${
            i === currentPage
              ? 'bg-blue-600 text-white dark:bg-blue-700'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500'
          }`}
          type="button"
        >
          {i}
        </button>
      );
    }
    return buttons;
  }, [currentPage, totalPages]);

  // --- Función para limpiar todos los filtros y ordenación ---
  const handleClearFilters = () => {
    setSearchQuery('');
    setFilterPriority('');
    setFilterDueDate('');
    setFilterIsCompleted('');
    setSortField('createdAt');
    setSortOrder('desc');
    setCurrentPage(1);
  };

  // --- Renderizado condicional para estados de carga y error ---
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

      {/* Sección de Filtros y Ordenación */}
      <div className="mb-6 p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-700">
        <h3 className="text-lg font-semibold mb-3 text-gray-700 dark:text-gray-300">Filtros y Ordenación</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Buscar</label>
            <input
              type="text"
              id="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 dark:text-white"
              placeholder="Buscar por título o descripción..."
            />
          </div>
          <div>
            <label htmlFor="filterPriority" className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Prioridad</label>
            <select
              id="filterPriority"
              value={filterPriority}
              onChange={(e) => { setFilterPriority(e.target.value); setCurrentPage(1); }}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 dark:text-white"
            >
              <option value="">Todas</option>
              <option value="low">Baja</option>
              <option value="medium">Media</option>
              <option value="high">Alta</option>
            </select>
          </div>
          <div>
            <label htmlFor="filterIsCompleted" className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Estado</label>
            <select
              id="filterIsCompleted"
              value={filterIsCompleted}
              onChange={(e) => { setFilterIsCompleted(e.target.value); setCurrentPage(1); }}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 dark:text-white"
            >
              <option value="">Todas</option>
              <option value="false">Pendientes</option>
              <option value="true">Completadas</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="sortField" className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Ordenar por</label>
            <select
              id="sortField"
              value={sortField}
              onChange={(e) => { setSortField(e.target.value); setCurrentPage(1); }}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 dark:text-white"
            >
              <option value="createdAt">Fecha de Creación</option>
              <option value="due_date">Fecha de Vencimiento</option>
              <option value="title">Título</option>
              <option value="priority">Prioridad</option>
            </select>
          </div>
          <div>
            <label htmlFor="sortOrder" className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Orden</label>
            <select
              id="sortOrder"
              value={sortOrder}
              onChange={(e) => { setSortOrder(e.target.value); setCurrentPage(1); }}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 dark:text-white"
            >
              <option value="asc">Ascendente</option>
              <option value="desc">Descendente</option>
            </select>
          </div>
        </div>
        <div className="mt-4 text-right">
          <button
            onClick={handleClearFilters}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500 transition-colors"
            type="button"
          >
            Limpiar Filtros
          </button>
        </div>
      </div>

      {/* Mensaje de no hay tareas */}
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
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">{task.description}</p>
              )}
              {task.due_date && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Vence: {new Date(task.due_date).toLocaleDateString()}
                </p>
              )}
              <div className="flex justify-end items-center space-x-2 mt-3">
                <button
                  onClick={() => handleToggleComplete(task)}
                  className="flex items-center space-x-1 text-sm text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300 transition-colors"
                  type="button"
                  aria-label={task.is_completed ? 'Marcar como pendiente' : 'Marcar como completada'}
                >
                  {task.is_completed ? (
                    <>
                      <FaCheckSquare className="text-lg" />
                      <span>Completada</span>
                    </>
                  ) : (
                    <>
                      <FaSquare className="text-lg" />
                      <span>Pendiente</span>
                    </>
                  )}
                </button>
                <button
                  onClick={() => onEditTask(task)}
                  className="p-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors rounded-full"
                  type="button"
                  aria-label="Editar tarea"
                >
                  <FaEdit className="text-lg" />
                </button>
                <button
                  onClick={() => {
                    setTaskToDeleteId(task.id);
                    setShowDeleteModal(true);
                  }}
                  className="p-2 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 transition-colors rounded-full"
                  type="button"
                  aria-label="Eliminar tarea"
                >
                  <FaTrash className="text-lg" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Controles de Paginación */}
      {totalPages > 1 && (
        <div className="flex flex-col md:flex-row justify-center items-center space-y-4 md:space-y-0 md:space-x-4 mt-6 p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handlePreviousPage}
            disabled={currentPage === 1}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-blue-700 dark:hover:bg-blue-800 transition-colors"
            type="button"
          >
            Anterior
          </button>
          <div className="flex space-x-1">
            {getPaginationButtons}
          </div>
          <button
            onClick={handleNextPage}
            disabled={currentPage === totalPages}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-blue-700 dark:hover:bg-blue-800 transition-colors"
            type="button"
          >
            Siguiente
          </button>
          <span className="ml-4 text-sm text-gray-700 dark:text-gray-300">
            Página {currentPage} de {totalPages} (Total: {totalTasks} tareas)
          </span>
        </div>
      )}

      {/* Modal de Confirmación de Eliminación */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl max-w-sm w-full mx-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Confirmar Eliminación</h3>
            <p className="text-gray-700 dark:text-gray-300 mb-6">¿Estás seguro de que quieres eliminar esta tarea? Esta acción no se puede deshacer.</p>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                type="button"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteTask}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                type="button"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
