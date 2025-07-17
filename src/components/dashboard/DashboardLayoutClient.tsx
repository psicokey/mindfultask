// components/dashboard/DashboardLayoutClient.tsx
'use client';

import { useState } from 'react'; // Keep useState for internal layout state if any
import TaskForm from 'app/components/TaskForm';
import Modal from 'app/components/Modal';
import PomodoroTimer from 'app/components/dashboard/PomodoroTimer';
import { Session } from 'next-auth';
import { Task } from '@prisma/client';
// Importa el proveedor de contexto y el hook
import { DashboardProvider, useDashboardContext } from 'app/components/dashboard/DashboardContext';

interface DashboardLayoutClientProps {
  user: Session['user'];
  children: React.ReactNode;
}

export default function DashboardLayoutClient({ user, children }: DashboardLayoutClientProps) {
  // Envuelve todo el contenido del layout con el proveedor
  return (
    <DashboardProvider>
      <DashboardLayoutContent user={user}>
        {children}
      </DashboardLayoutContent>
    </DashboardProvider>
  );
}

// Crea un sub-componente para consumir el contexto y renderizar el layout
function DashboardLayoutContent({ user, children }: DashboardLayoutClientProps) {
  const { isFormModalOpen, selectedTask, handleCloseFormModal, handleTaskFormSuccess } = useDashboardContext();

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white p-4 sm:p-6 lg:p-8">
      <main className="container mx-auto py-8">
        <h1 className="text-4xl font-extrabold text-center mb-10 text-gray-800 dark:text-white">
          Bienvenido a MindfulTask, {user.name || user.email}!
        </h1>

        {/* La estructura de cuadrícula principal para el dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Primera Columna: Temporizador Pomodoro (persistente) */}
          <div className="md:col-span-1 lg:col-span-1 flex flex-col space-y-8">
            <PomodoroTimer />
            {/* ProductivityStats NO va aquí si es la página principal de /dashboard/stats */}
          </div>

          {/* Columnas restantes para el contenido específico de la página */}
          <div className="md:col-span-1 lg:col-span-2 flex flex-col space-y-8">
            {children} {/* Aquí se renderizará el contenido específico de la página */}
          </div>
        </div>
      </main>

      {/* El Modal en sí, que forma parte del layout persistente */}
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
