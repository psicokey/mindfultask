// components/dashboard/DashboardClient.tsx
'use client';

import { useSession } from 'next-auth/react';
import { useState } from 'react';
import TaskSummary from 'app/components/dashboard/TaskSummary'; // Asegúrate de que las rutas son correctas
import PomodoroTimer from 'app/components/dashboard/PomodoroTimer';
import TaskForm from 'app/components/TaskForm';
import Modal from 'app/components/Modal';
import TaskList from 'app/components/dashboard/TaskList';
import { Session } from 'next-auth';
import { Task } from '@prisma/client';

interface DashboardClientProps {
  user: Session['user'];
}

export default function DashboardClient({ user }: DashboardClientProps) {
  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);
  const [isEditTaskModalOpen, setIsEditTaskModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [taskRefreshTrigger, setTaskRefreshTrigger] = useState(0);
  const { data: session, status } = useSession();
  const userId = user?.id || session?.user?.id;
  if (!userId) {
    return <p>Cargando usuario...</p>;
  } 
  const handleOpenNewTaskModal = () => {
    setSelectedTask(null);
    setIsNewTaskModalOpen(true);
  };
  const handleCloseNewTaskModal = () => setIsNewTaskModalOpen(false);

  // Asegúrate de que el parámetro 'task' sea del tipo 'Task' de Prisma
  const handleOpenEditTaskModal = (task: Task) => {
    setSelectedTask(task);
    setIsEditTaskModalOpen(true);
  };
  const handleCloseEditTaskModal = () => {
    setSelectedTask(null);
    setIsEditTaskModalOpen(false);
  };

  const handleTaskFormSuccess = () => {
    handleCloseNewTaskModal();
    handleCloseEditTaskModal();
    setTaskRefreshTrigger(prev => prev + 1);
  };

  if (!user) {
    return <p>Cargando usuario...</p>;
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white p-4 sm:p-6 lg:p-8">
      <main className="container mx-auto py-8">
        <h1 className="text-4xl font-extrabold text-center mb-10 text-gray-800 dark:text-white">
          Bienvenido a MindfulTask, {user.name || user.email}!
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div className="md:col-span-1 lg:col-span-1">
            <PomodoroTimer />
          </div>

          <div className="md:col-span-1 lg:col-span-2 flex flex-col space-y-8">
            <button
              onClick={handleOpenNewTaskModal}
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg shadow-md transition-transform transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 dark:bg-green-700 dark:hover:bg-green-800"
            >
              + Nueva Tarea
            </button>

            {/* Asegúrate de que TaskSummary reciba las props necesarias */}
            <TaskSummary userId={userId}
              refreshTrigger={taskRefreshTrigger}
              onEditTask={handleOpenEditTaskModal}
              onTaskForm={false}
            />

            <TaskList
              refreshTrigger={taskRefreshTrigger}
              onEditTask={handleOpenEditTaskModal}
            />
          </div>
        </div>
      </main>

      <Modal isOpen={isNewTaskModalOpen} onClose={handleCloseNewTaskModal} title="Crear Nueva Tarea">
        <TaskForm onTaskCreated={handleTaskFormSuccess} />
      </Modal>

      <Modal isOpen={isEditTaskModalOpen} onClose={handleCloseEditTaskModal} title="Editar Tarea">
        {/* Aquí pasamos la tarea seleccionada al TaskForm para que pueda editarla */}
        <TaskForm initialTask={selectedTask} onTaskUpdated={handleTaskFormSuccess} />
      </Modal>
    </div>
  );
}
