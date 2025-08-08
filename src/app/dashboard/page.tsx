// app/dashboard/page.tsx
'use client'; // Esta página necesita ser un componente de cliente para usar useDashboardContext

import TaskSummary from 'app/components/dashboard/TaskSummary';
import TaskList from 'app/components/dashboard/TaskList';
import { useDashboardContext } from 'app/components/dashboard/DashboardContext';


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
      {/* TaskSummary ahora obtiene onEditTask del contexto */}
      <TaskSummary />

      {/* Componente TaskList */}
      <TaskList
        refreshTrigger={taskRefreshTrigger}
        onEditTask={handleOpenEditTaskModal} // Pasa la función para editar tareas
      />
    </>
  );
}
