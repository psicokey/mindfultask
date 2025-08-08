// app/dashboard/page.tsx
'use client'; // Esta página necesita ser un componente de cliente para usar useDashboardContext

import TaskList from 'app/components/dashboard/TaskList';
import { useDashboardContext } from 'app/components/dashboard/DashboardContext';
import TaskSummary from 'app/components/dashboard/TaskSummary';
import DashboardClient from './DashboardClient';


export default function DashboardPage() {
  const { handleOpenNewTaskModal, handleOpenEditTaskModal, taskRefreshTrigger } = useDashboardContext();

  return (
    <>
      {/* El botón "Nueva Tarea" */}
      <button
        onClick={handleOpenNewTaskModal}
        className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg shadow-md transition-transform transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 dark:bg-green-700 dark:hover:bg-green-800"
        type="button"
      >
        + Nueva Tarea
      </button>

      {/* Componente TaskSummary */}
      <TaskSummary
        userId={''} // Aquí deberías pasar el ID del usuario actual
        refreshTrigger={taskRefreshTrigger}
        onEditTask={handleOpenEditTaskModal}
        onTaskForm={false} // Si necesitas abrir el formulario desde TaskSummary
      />

      {/* Componente TaskList */}
      <TaskList
                    refreshTrigger={taskRefreshTrigger}
                    onEditTask={handleOpenEditTaskModal}
                  />
    </>
  );
}
