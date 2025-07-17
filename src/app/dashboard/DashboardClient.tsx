// components/dashboard/DashboardClient.tsx
'use client'; // ¡Importante! Este es un componente de cliente

import { useState } from 'react';
import TaskSummary from 'app/components/dashboard/TaskSummary';
import PomodoroTimer from 'app/components/dashboard/PomodoroTimer';
import TaskForm from 'app/components/TaskForm';
import { Task } from '@prisma/client';
import Modal from 'app/components/Modal';
import { Session } from 'next-auth';
import TaskList from 'app/components/dashboard/TaskList';

interface DashboardClientProps {
  user: Session['user'];
}

export default function DashboardClient({ user }: DashboardClientProps) {
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [taskRefreshTrigger, setTaskRefreshTrigger] = useState(0);

  const handleOpenNewTaskModal = () => {
    setSelectedTask(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEditTaskModal = (task: Task) => {
    setSelectedTask(task);
    setIsFormModalOpen(true);
  };

  const handleCloseFormModal = () => {
    setIsFormModalOpen(false);
    setSelectedTask(null);
  };

  const handleTaskFormSuccess = () => {
    handleCloseFormModal();
    setTaskRefreshTrigger(prev => prev + 1);
  };

  if (!user) {
    return <p>Cargando usuario...</p>;
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white p-4 sm:p-6 lg:p-8">
      <main className="container mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-extrabold text-center mb-10 text-gray-800 dark:text-white">
          Bienvenido a MindfulTask, {user.name || user.email}!
        </h1>

        {/* Ajuste del diseño de la cuadrícula a 3 columnas en pantallas grandes */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"> {/* Cambiado a lg:grid-cols-3 */}
          {/* Columna para el Pomodoro Timer */}
          <div className="md:col-span-1 lg:col-span-1"> {/* Ahora ocupa 1 de 3 columnas */}
            <PomodoroTimer />
          </div>

          {/* Columna para la creación de tareas y TaskSummary */}
          <div className="md:col-span-1 lg:col-span-1 flex flex-col space-y-8"> {/* Ahora ocupa 1 de 3 columnas */}
            <button
              onClick={handleOpenNewTaskModal}
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg shadow-md transition-transform transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 dark:bg-green-700 dark:hover:bg-green-800"
              type="button"
            >
              + Nueva Tarea
            </button>

            <TaskSummary
              userId={parseInt(user.id, 10)}
              onEditTask={handleOpenEditTaskModal}
            />
          </div>

          {/* Columna para la TaskList */}
          <div className="md:col-span-2 lg:col-span-1 flex flex-col space-y-8"> {/* Ahora ocupa 1 de 3 columnas */}
            <TaskList
              refreshTrigger={taskRefreshTrigger}
              onEditTask={handleOpenEditTaskModal}
            />
          </div>
        </div>
      </main>

      <Modal
        isOpen={isFormModalOpen}
        onClose={handleCloseFormModal}
        title={selectedTask ? 'Editar Tarea' : 'Crear Nueva Tarea'}
      >
        <TaskForm
          initialTask={selectedTask}
          onTaskCreated={handleTaskFormSuccess}
          onTaskUpdated={handleTaskFormSuccess}
        />
      </Modal>
    </div>
  );
}
