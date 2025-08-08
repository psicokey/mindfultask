// components/dashboard/DashboardLayoutClient.tsx
'use client';

import TaskForm from 'app/components/TaskForm';
import Modal from 'app/components/Modal';
import PomodoroTimer from 'app/components/dashboard/PomodoroTimer';
import { Session } from 'next-auth';
import { DashboardProvider, useDashboardContext } from 'app/components/dashboard/DashboardContext';
import Link from 'next/link'; // Importar Link para la navegación
import { signOut } from 'next-auth/react'; // Importar signOut para cerrar sesión
import ThemeSwitcher from '../ThemeSwitcher';

interface DashboardLayoutClientProps {
  user: Session['user'];
  children: React.ReactNode;
}

export default function DashboardLayoutClient({ user, children }: DashboardLayoutClientProps) {
  return (

    <DashboardProvider>
      <DashboardLayoutContent user={user}>
        {children}
      </DashboardLayoutContent>
    </DashboardProvider>

  );
}

function DashboardLayoutContent({ user, children }: DashboardLayoutClientProps) {
  const { isFormModalOpen, selectedTask, handleCloseFormModal, handleTaskFormSuccess } = useDashboardContext();

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/login' }); // Redirige al login después de cerrar sesión
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white">
      {/* Navbar del Dashboard */}
      <nav className="bg-white dark:bg-gray-800 shadow-md p-4 flex justify-between items-center sticky top-0 z-10">
        <div className="flex items-center space-x-4">
          <Link href="/dashboard" className="text-xl font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors">
            MindfulTask
          </Link>
          <div className="hidden md:flex space-x-4"> {/* Menú para desktop */}
            <Link href="/dashboard" className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              Dashboard
            </Link>
            <Link href="/dashboard/stats" className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              Estadísticas
            </Link>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <span className="text-gray-600 dark:text-gray-400 text-sm hidden sm:inline">
            Hola, {user.name || user.email}!
          </span>
          
          <ThemeSwitcher />

          <button
            onClick={handleSignOut}
            className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
            type="button"
          >
            Cerrar Sesión
          </button>
        </div>
      </nav>

      <main className="container mx-auto py-8 p-4 sm:p-6 lg:p-8">
        <h1 className="text-4xl font-extrabold text-center mb-10 text-gray-800 dark:text-white">
          Bienvenido a MindfulTask, {user.name || user.email}!
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Primera Columna: Temporizador Pomodoro y Estadísticas de Productividad */}
          <div className="md:col-span-1 lg:col-span-1 flex flex-col space-y-8">
            <PomodoroTimer />
            {/* ProductivityStats NO va aquí si es la página principal de /dashboard/stats */}
            {/* Si quieres que ProductivityStats aparezca en el dashboard principal, descoméntalo aquí:
            <ProductivityStats />
            */}
          </div>

          {/* Columnas restantes para el contenido específico de la página */}
          <div className="md:col-span-1 lg:col-span-2 flex flex-col space-y-8">
            {children} {/* Aquí se renderizará el contenido específico de la página */}
          </div>
        </div>
      </main>

      <Modal
        isOpen={isFormModalOpen}
        onClose={handleCloseFormModal}
        title={selectedTask ? 'Editar Tarea' : 'Crear Nueva Tarea'}
      >
          <TaskForm
          initialTask={
            selectedTask
              ? {
                  ...selectedTask,
                  id: String(selectedTask.id),
                  priority:
                    selectedTask.priority === 'low' ||
                    selectedTask.priority === 'medium' ||
                    selectedTask.priority === 'high'
                      ? selectedTask.priority
                      : 'low', // fallback to 'low' if not valid
                }
              : null
          }
          onTaskCreated={handleTaskFormSuccess}
          onTaskUpdated={handleTaskFormSuccess}
        />
      </Modal>
    </div>
  );
}
