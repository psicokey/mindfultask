// components/dashboard/DashboardClient.tsx
'use client'; // ¡Importante! Este es un componente de cliente

import { useState } from 'react';
import TaskSummary from 'app/components/dashboard/TaskSummary';
import PomodoroTimer from 'app/components/dashboard/PomodoroTimer'; // Asegúrate de que la ruta sea correcta
import TaskForm from 'app/components/TaskForm'; // Asegúrate de que la ruta sea correcta
import Modal from 'app/components/Modal'; // Asegúrate de que la ruta sea correcta
import { Session } from 'next-auth'; // Importa el tipo Session de next-auth
import TaskList from 'app/components/dashboard/TaskList'; // Asegúrate de que la ruta sea correcta

interface DashboardClientProps {
  user: Session['user']; // Recibe el objeto user de la sesión como prop
}

export default function DashboardClient({ user }: DashboardClientProps) {
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskRefreshTrigger, setTaskRefreshTrigger] = useState(0); 

  const handleOpenTaskModal = () => setIsTaskModalOpen(true);
  const handleCloseTaskModal = () => setIsTaskModalOpen(false);

  // Función que se llamará cuando una tarea sea creada con éxito
  const handleTaskCreated = () => {
    handleCloseTaskModal(); // Cierra el modal después de crear la tarea
    // Aquí podrías, por ejemplo, recargar la lista de tareas si tuvieras una
    // fetchTasks();
  };

  if (!user) {
    // Esto no debería ocurrir si el Server Component ya redirigió,
    // pero es una salvaguarda.
    return <p>Cargando usuario...</p>;
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white p-4 sm:p-6 lg:p-8">
      <main className="container mx-auto py-8">
        <h1 className="text-4xl font-extrabold text-center mb-10 text-gray-800 dark:text-white">
          Bienvenido a MindfulTask, {user.name || user.email}!
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Columna para el Pomodoro Timer */}
          <div className="md:col-span-1 lg:col-span-1">
            <PomodoroTimer />
          </div>

          {/* Columna para la creación de tareas y otros elementos */}
          <div className="md:col-span-1 lg:col-span-2 flex flex-col space-y-8">
            {/* Botón para abrir el modal de nueva tarea */}
            <button
              onClick={handleOpenTaskModal}
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg shadow-md transition-transform transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 dark:bg-green-700 dark:hover:bg-green-800"
            >
              + Nueva Tarea
            </button>

            {/* Componente TaskSummary, ahora recibe userId como prop */}
            <TaskSummary userId={parseInt(user.id, 10)} setIsTaskModalOpen={setIsTaskModalOpen} />

            {/* Aquí podrías agregar más componentes o secciones del dashboard */}
          <TaskList refreshTrigger={taskRefreshTrigger} />
          </div>
        </div>
      </main>

      {/* Modal para Crear Tarea */}
      <Modal isOpen={isTaskModalOpen} onClose={handleCloseTaskModal} title="Crear Nueva Tarea">
        {/* TaskForm también recibe userId como prop si lo necesita, o usa useSession internamente */}
        <TaskForm onTaskCreated={handleTaskCreated} />
      </Modal>
    </div>
  );
}
