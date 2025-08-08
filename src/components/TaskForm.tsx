// components/TaskForm.tsx
'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useSession } from 'next-auth/react';
import { addGuestTask, updateGuestTask } from 'app/lib/guest-storage';
import { Task } from 'app/lib/definitions';

// El tipo Task de las props puede tener fechas como string debido a la serialización.
type InitialTask = Omit<Task, 'due_date' | 'createdAt' | 'updatedAt' | 'priority'> & {
  due_date?: Date | string | null;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  priority: 'low' | 'medium' | 'high';
};

interface TaskFormProps {
  onTaskCreated?: () => void;
  onTaskUpdated?: () => void;
  initialTask?: InitialTask | null;
}

export default function TaskForm({ onTaskCreated, onTaskUpdated, initialTask }: TaskFormProps) {
  const [title, setTitle] = useState(initialTask?.title || '');
  const [description, setDescription] = useState(initialTask?.description || '');
  const [dueDate, setDueDate] = useState(
    initialTask?.due_date ? new Date(initialTask.due_date).toISOString().split('T')[0] : ''
  );
  const [priority, setPriority] = useState(initialTask?.priority || 'medium');
  const [isCompleted, setIsCompleted] = useState(initialTask?.is_completed || false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const { data: session, status } = useSession();
  const userId = session?.user?.id;

  useEffect(() => {
    setTitle(initialTask?.title || '');
    setDescription(initialTask?.description || '');
    setDueDate(initialTask?.due_date ? new Date(initialTask.due_date).toISOString().split('T')[0] : '');
    setPriority(initialTask?.priority || 'medium');
    setIsCompleted(initialTask?.is_completed || false);
    setError(null);
    setSuccess(null);
  }, [initialTask]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => { 
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // No hacer nada si la sesión aún está cargando
    if (status === 'loading') {
      setError('Esperando autenticación...');
      return;
    }

    if (!title.trim()) {
      setError('El título de la tarea es obligatorio.');
      return;
    }

    setIsLoading(true);

    // --- Lógica para el modo invitado ---
    if (status === 'unauthenticated' || session?.user?.id?.startsWith('guest-')) {
      try {
        if (initialTask?.id) {
          // Editando una tarea de invitado.
          // Se reconstruye el objeto para asegurar la consistencia de tipos y evitar errores.
          // El error principal era `parseInt(initialTask.id)`, que fallaría si el ID es un UUID.
          const updatedTaskData: Task = {
            id: initialTask.id,
            title: title.trim(),
            description: description ? description.trim() : null,
            due_date: dueDate ? new Date(dueDate) : null,
            priority: priority as 'low' | 'medium' | 'high',
            is_completed: isCompleted,
            updatedAt: new Date(),
            // Aseguramos que createdAt y userId existan, como lo requiere el tipo Task.
            createdAt: initialTask.createdAt ? new Date(initialTask.createdAt) : new Date(),
            userId: initialTask.userId || 'guest-user',
          };
          updateGuestTask(updatedTaskData);
          setSuccess('Tarea actualizada con éxito en modo invitado.');
          if (onTaskUpdated) onTaskUpdated();
        } else {
          // Creando una nueva tarea de invitado
          const taskData = {
            title: title.trim(),
            description: description ? description.trim() : null,
            due_date: dueDate ? new Date(dueDate) : null,
            priority: priority as 'low' | 'medium' | 'high',
            is_completed: isCompleted,
          };
          addGuestTask(taskData);
          setSuccess('Tarea creada con éxito en modo invitado.');
          // Limpiar el formulario para una nueva tarea
          setTitle('');
          setDescription('');
          setDueDate('');
          setPriority('medium');
          setIsCompleted(false);
          if (onTaskCreated) onTaskCreated();
        }
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('Ocurrió un error en modo invitado.');
        }
      } finally {
        setIsLoading(false);
      }
      return; // Detener la ejecución para el modo invitado
    }

    // --- Lógica para el usuario autenticado ---
    if (!userId) {
      setError('Debes iniciar sesión para crear/editar una tarea.');
      setIsLoading(false);
      return;
    }

    try {
      const method = initialTask ? 'PUT' : 'POST';
      const url = initialTask ? `/api/tasks/${initialTask.id}` : '/api/tasks';

      const taskData = {
        title: title.trim(),
        description: description ? description.trim() : null,
        due_date: dueDate ? new Date(dueDate).toISOString() : null,
        priority,
        is_completed: isCompleted,
        userId: userId,
      };

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(taskData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Error al ${initialTask ? 'actualizar' : 'crear'} la tarea.`);
      }

      const result = await response.json();
      setSuccess(`Tarea ${initialTask ? 'actualizada' : 'creada'} con éxito!`);

      if (!initialTask) {
        setTitle('');
        setDescription('');
        setDueDate('');
        setPriority('medium');
        setIsCompleted(false);
        if (onTaskCreated) {
          onTaskCreated();
        }
      } else {
        if (onTaskUpdated) {
          onTaskUpdated();
        }
      }
      console.log(`Tarea ${initialTask ? 'actualizada' : 'creada'}:`, result.task);
    } catch (err: unknown) {
      console.error(`Error al ${initialTask ? 'actualizar' : 'crear'} tarea:`, err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Ocurrió un error inesperado.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl max-w-lg mx-auto font-sans text-gray-900 dark:text-white">
      <h2 className="text-2xl font-bold text-center text-gray-800 dark:text-white mb-6">
        {initialTask ? 'Editar Tarea' : 'Crear Nueva Tarea'}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Título de la Tarea <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-gray-50 dark:bg-gray-700 dark:text-white"
            placeholder="Ej. Terminar informe mensual"
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Descripción
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-gray-50 dark:bg-gray-700 dark:text-white"
            placeholder="Detalles adicionales de la tarea..."
          ></textarea>
        </div>

        <div>
          <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Fecha de Vencimiento
          </label>
          <input
            type="date"
            id="dueDate"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-gray-50 dark:bg-gray-700 dark:text-white"
          />
        </div>

        <div>
          <label htmlFor="priority" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Prioridad
          </label>
          <select
            id="priority"
            value={priority}
            onChange={(e) => setPriority(e.target.value as 'low' | 'medium' | 'high')}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-gray-50 dark:bg-gray-700 dark:text-white"
          >
            <option value="low">Baja</option>
            <option value="medium">Media</option>
            <option value="high">Alta</option>
          </select>
        </div>

        {initialTask && (
          <div>
            <label htmlFor="isCompleted" className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 cursor-pointer">
              <input
                type="checkbox"
                id="isCompleted"
                checked={isCompleted}
                onChange={(e) => setIsCompleted(e.target.checked)}
                className="mr-2 h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded dark:bg-gray-700 dark:border-gray-600"
              />
              Tarea Completada
            </label>
          </div>
        )}

        {error && (
          <div className="bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-3 rounded relative text-sm" role="alert">
            <strong className="font-bold">Error:</strong>
            <span className="block sm:inline"> {error}</span>
          </div>
        )}

        {success && (
          <div className="bg-green-100 dark:bg-green-900 border border-green-400 dark:border-green-700 text-green-700 dark:text-green-300 px-4 py-3 rounded relative text-sm" role="alert">
            <strong className="font-bold">Éxito:</strong>
            <span className="block sm:inline"> {success}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-lg font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200 dark:bg-blue-700 dark:hover:bg-blue-800"
        >
          {isLoading ? (initialTask ? 'Actualizando...' : 'Creando Tarea...') : (initialTask ? 'Guardar Cambios' : 'Crear Tarea')}
        </button>
      </form>
    </div>
  );
}
