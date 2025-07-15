// components/TaskForm.tsx
'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react'; // Para obtener el ID del usuario autenticado

export default function TaskForm({ onTaskCreated }: { onTaskCreated?: () => void }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState(''); // Formato YYYY-MM-DD para input type="date"
  const [priority, setPriority] = useState('medium'); // Valores: low, medium, high
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const { data: session } = useSession();
  const userId = session?.user?.id; // Obtener el ID del usuario de la sesión

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!userId) {
      setError('Debes iniciar sesión para crear una tarea.');
      return;
    }

    if (!title.trim()) {
      setError('El título de la tarea es obligatorio.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          description: description || null, // Enviar null si está vacío para campos opcionales
          dueDate: dueDate ? new Date(dueDate).toISOString() : null, // Convertir a ISO string si hay fecha
          priority,
          userId: parseInt(userId), // Asegúrate de que el userId sea un número si tu DB lo espera así
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al crear la tarea.');
      }

      const result = await response.json();
      setSuccess('Tarea creada con éxito!');
      setTitle(''); // Limpiar formulario
      setDescription('');
      setDueDate('');
      setPriority('medium');
      if (onTaskCreated) {
        onTaskCreated(); // Llamar callback si se proporciona
      }
      console.log('Tarea creada:', result.task);
    } catch (err: any) {
      console.error('Error al crear tarea:', err);
      setError(err.message || 'Ocurrió un error inesperado.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl max-w-lg mx-auto font-sans text-gray-900 dark:text-white">
      <h2 className="text-2xl font-bold text-center text-gray-800 dark:text-white mb-6">Crear Nueva Tarea</h2>

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
            onChange={(e) => setPriority(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-gray-50 dark:bg-gray-700 dark:text-white"
          >
            <option value="low">Baja</option>
            <option value="medium">Media</option>
            <option value="high">Alta</option>
          </select>
        </div>

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
          {isLoading ? 'Creando Tarea...' : 'Crear Tarea'}
        </button>
      </form>
    </div>
  );
}
