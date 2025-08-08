// src/components/dashboard/TaskSummary.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { FaTasks, FaCheckCircle, FaRunning, FaRegClock, FaRegCalendarAlt, FaRegLightbulb } from 'react-icons/fa';
import { Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { motion } from 'framer-motion';
import { getGuestTasks } from 'app/lib/guest-storage'; // Importar la función para invitados

ChartJS.register(
  ArcElement,
  Title,
  Tooltip,
  Legend
);

interface Task {
  id: number;
  title: string;
  description: string | null;
  due_date: Date | null;
  priority: 'low' | 'medium' | 'high';
  is_completed: boolean;
  userId: string; // userId es String
  createdAt: Date;
  updatedAt: Date;
}

// Tipo para tareas con fechas como strings (desde API o localStorage)
type RawTask = Omit<Task, "due_date" | "createdAt" | "updatedAt"> & {
  due_date: string | null;
  createdAt: string;
  updatedAt: string;
};


interface TaskSummaryProps {
  tasks: Task[];
  isLoading: boolean;
  error: string | null;
  onEditTask: (task: Task) => void; // Callback para editar tarea
}

const TaskSummary: React.FC<TaskSummaryProps> = () => {
  
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'productivity' | 'wellbeing'>('productivity');

  const { data: session, status } = useSession();
  const userId = session?.user?.id; // userId es String

  const fetchTasksData = useCallback(async () => {
    if (status === 'loading') {
      setIsLoading(true);
      return;
    }

    // Modo Invitado
    if (status === 'unauthenticated' || session?.user?.id?.startsWith('guest-')) {
      console.log('TaskSummary (Guest): fetching tasks from localStorage');
      const guestTasks = getGuestTasks();
      if (guestTasks) {
        const fetchedTasks: Task[] = guestTasks.map((task) => ({
          ...task,
          priority: (task.priority as 'low' | 'medium' | 'high'),
          due_date: task.due_date ? new Date(task.due_date) : null,
          createdAt: new Date(task.createdAt),
          updatedAt: new Date(task.updatedAt),
        }));
        setTasks(fetchedTasks);
      } else {
        setTasks([]);
      }
      setIsLoading(false);
      return;
    }

    if (!userId) { // Usuario autenticado pero sin ID (caso anómalo)
      setError('No se pudieron cargar las tareas: Usuario no autenticado.');
      setIsLoading(false);
      setTasks([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try { // Modo Autenticado
      const response = await fetch(`/api/tasks?userId=${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 204) {
        setTasks([]);
        setIsLoading(false);
        return;
      }

      if (!response.ok) {
        let errorData = { message: 'Error al obtener las tareas.' };
        try {
          errorData = await response.json();
        } catch (parseError) {
          console.error("Error al parsear la respuesta de error JSON:", parseError);
        }
        throw new Error(errorData.message);
      }

      const result: { tasks: RawTask[] } = await response.json();
      const fetchedTasks: Task[] = result.tasks.map((task: RawTask) => ({
        ...task,
        due_date: task.due_date ? new Date(task.due_date) : null,
        createdAt: new Date(task.createdAt),
        updatedAt: new Date(task.updatedAt),
      }));
      setTasks(fetchedTasks);
    } catch (err: unknown) {
      console.error('Error fetching tasks:', err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Ocurrió un error inesperado al cargar las tareas.');
      }
      setTasks([]);
    } finally {
      setIsLoading(false);
    }
  }, [userId, status, session]);

  useEffect(() => {
    fetchTasksData();
  }, [fetchTasksData]);


  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(task => task.is_completed).length;
  const pendingTasks = tasks.filter(task => !task.is_completed).length;
  const overdueTasks = tasks.filter(task =>
    !task.is_completed &&
    task.due_date &&
    new Date(task.due_date) < new Date()
  ).length;

  const priorityData = {
    labels: ['Baja', 'Media', 'Alta'],
    datasets: [
      {
        data: [
          tasks.filter(t => t.priority === 'low').length,
          tasks.filter(t => t.priority === 'medium').length,
          tasks.filter(t => t.priority === 'high').length,
        ],
        backgroundColor: [
          'rgba(20, 184, 166, 0.7)',
          'rgba(59, 130, 246, 0.7)',
          'rgba(239, 68, 68, 0.7)',
        ],
        borderColor: [
          'rgba(20, 184, 166, 1)',
          'rgba(59, 130, 246, 1)',
          'rgba(239, 68, 68, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const getWellbeingTips = () => {
    const highPriorityPending = tasks.filter(t => t.priority === 'high' && !t.is_completed).length;
    const completionRate = totalTasks > 0 ? completedTasks / totalTasks : 0;
    
    const tips = [];
    
    if (overdueTasks > 0) {
      tips.push(`Tienes ${overdueTasks} tareas atrasadas. Revisa si aún son relevantes o renegocia los plazos.`);
    }
    
    if (highPriorityPending > 0) {
      tips.push(`Tienes ${highPriorityPending} tareas de alta prioridad pendientes. ¡Enfócate en ellas primero!`);
    }

    if (totalTasks > 0 && completionRate < 0.5) {
      tips.push('Considera dividir las tareas grandes en pasos más pequeños para facilitar su inicio y seguimiento.');
    } else if (totalTasks > 0 && completionRate > 0.8) {
      tips.push('¡Excelente tasa de completación! Recuerda tomar descansos regulares para evitar el agotamiento.');
    }
    
    if (tips.length === 0) {
      tips.push('Tu gestión de tareas parece equilibrada. ¡Sigue así!');
      tips.push('No olvides programar tiempo para actividades de ocio y bienestar.');
    }
    
    return tips;
  };

  const wellbeingTips = getWellbeingTips();

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
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
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex">
          <button
            onClick={() => setActiveTab('productivity')}
            className={`px-4 py-3 text-sm font-medium ${activeTab === 'productivity' ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
            type="button"
          >
            Productividad
          </button>
          <button
            onClick={() => setActiveTab('wellbeing')}
            className={`px-4 py-3 text-sm font-medium ${activeTab === 'wellbeing' ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
            type="button"
          >
            Bienestar
          </button>
        </nav>
      </div>

      <div className="p-6">
        {activeTab === 'productivity' ? (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg"
              >
                <div className="flex items-center">
                  <FaTasks className="text-blue-600 dark:text-blue-400 mr-2" />
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total tareas</h3>
                </div>
                <p className="text-2xl font-bold mt-1">{totalTasks}</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg"
              >
                <div className="flex items-center">
                  <FaCheckCircle className="text-green-600 dark:text-green-400 mr-2" />
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Completadas</h3>
                </div>
                <p className="text-2xl font-bold mt-1">{completedTasks}</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg"
              >
                <div className="flex items-center">
                  <FaRunning className="text-yellow-600 dark:text-yellow-400 mr-2" />
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Pendientes</h3>
                </div>
                <p className="text-2xl font-bold mt-1">{pendingTasks}</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg"
              >
                <div className="flex items-center">
                  <FaRegClock className="text-red-600 dark:text-red-400 mr-2" />
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Atrasadas</h3>
                </div>
                <p className="text-2xl font-bold mt-1">{overdueTasks}</p>
              </motion.div>
            </div>

            <div className="mb-8">
              <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-4 text-center">Distribución por prioridad</h3>
              <div className="h-64 flex justify-center items-center">
                {totalTasks > 0 ? (
                  <Pie
                    data={priorityData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'bottom',
                          labels: {
                            color: 'rgb(107 114 128)',
                          },
                        },
                        title: {
                          display: false,
                        },
                        tooltip: {
                          backgroundColor: 'rgba(0,0,0,0.7)',
                          bodyColor: '#fff',
                          titleColor: '#fff',
                        }
                      },
                    }}
                  />
                ) : (
                  <p className="text-gray-600 dark:text-gray-400">No hay tareas para mostrar la distribución por prioridad.</p>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="space-y-6 text-gray-800 dark:text-white">
            <h3 className="text-lg font-medium">Perspectiva de bienestar</h3>
            
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <div className="flex items-start">
                <FaRegLightbulb className="text-blue-600 dark:text-blue-400 mt-1 mr-3 flex-shrink-0" />
                <div>
                  <h4 className="font-medium mb-2">Consejos basados en tu actividad</h4>
                  <ul className="space-y-2 text-sm">
                    {wellbeingTips.map((tip, index) => (
                      <li key={index} className="flex items-start">
                        <span className="inline-block h-2 w-2 rounded-full bg-blue-600 dark:bg-blue-400 mt-2 mr-2 flex-shrink-0"></span>
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
              <div className="flex items-start">
                <FaRegCalendarAlt className="text-purple-600 dark:text-purple-400 mt-1 mr-3 flex-shrink-0" />
                <div>
                  <h4 className="font-medium mb-2">Ritmo de trabajo</h4>
                  <p className="text-sm">
                    {totalTasks === 0
                      ? "Aún no tienes tareas. ¡Es un buen momento para añadir algunas y empezar a organizar!"
                      : `Has completado ${completedTasks} tareas (${Math.round((completedTasks / totalTasks) * 100)}% de tu lista).`}
                  </p>
                  {totalTasks > 0 && (
                    <div className="mt-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                      <div
                        className="bg-purple-600 dark:bg-purple-400 h-2.5 rounded-full"
                        style={{ width: `${(completedTasks / totalTasks) * 100}%` }}
                      ></div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
              <div className="flex items-start">
                <svg className="text-green-600 dark:text-green-400 mt-1 mr-3 flex-shrink-0 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <div>
                  <h4 className="font-medium mb-2">Recomendación del día</h4>
                  <p className="text-sm">
                    {new Date().getHours() < 12
                      ? "Empieza tu día con la tarea más importante antes de revisar correos o mensajes."
                      : "Toma un descanso de 5 minutos cada hora para estirarte y respirar profundamente."}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskSummary;
