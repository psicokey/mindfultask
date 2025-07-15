// src/components/dashboard/TaskSummary.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FaTasks, FaCheckCircle, FaRunning, FaRegClock, FaRegCalendarAlt, FaRegLightbulb } from 'react-icons/fa';
import { Bar, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { motion } from 'framer-motion';

// Registrar componentes de Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

interface Task {
  id: number;
  title: string;
  priority: 'urgent-important' | 'notUrgent-important' | 'urgent-notImportant' | 'notUrgent-notImportant';
  due_date: string | null;
  completed: boolean;
}

interface TaskSummaryProps {
  userId: number;
}

const TaskSummary: React.FC<TaskSummaryProps> = ({ userId }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'productivity' | 'wellbeing'>('productivity');

  // Datos de ejemplo mientras implementas la API
  useEffect(() => {
    const fetchTasks = async () => {
      setIsLoading(true);
      try {
        // Simular llamada a la API
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Datos de ejemplo
        const exampleTasks: Task[] = [
          { id: 1, title: 'Revisar informe mensual', priority: 'urgent-important', due_date: new Date(Date.now() + 86400000).toISOString(), completed: false },
          { id: 2, title: 'Ejercicio de mindfulness', priority: 'notUrgent-important', due_date: null, completed: true },
          { id: 3, title: 'Reunión con equipo', priority: 'urgent-important', due_date: new Date(Date.now() + 3600000).toISOString(), completed: false },
          { id: 4, title: 'Actualizar perfil', priority: 'notUrgent-notImportant', due_date: null, completed: false },
          { id: 5, title: 'Planificar semana', priority: 'notUrgent-important', due_date: new Date(Date.now() + 259200000).toISOString(), completed: true },
          { id: 6, title: 'Responder correos', priority: 'urgent-notImportant', due_date: null, completed: false },
        ];
        
        setTasks(exampleTasks);
      } catch (error) {
        console.error('Error fetching tasks:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTasks();
  }, [userId]);

  // Estadísticas calculadas
  const completedTasks = tasks.filter(task => task.completed).length;
  const pendingTasks = tasks.filter(task => !task.completed).length;
  const overdueTasks = tasks.filter(task => 
    !task.completed && 
    task.due_date && 
    new Date(task.due_date) < new Date()
  ).length;

  // Datos para gráfico de prioridades
  const priorityData = {
    labels: ['Urgente/Importante', 'No urgente/Importante', 'Urgente/No importante', 'No urgente/No importante'],
    datasets: [
      {
        data: [
          tasks.filter(t => t.priority === 'urgent-important').length,
          tasks.filter(t => t.priority === 'notUrgent-important').length,
          tasks.filter(t => t.priority === 'urgent-notImportant').length,
          tasks.filter(t => t.priority === 'notUrgent-notImportant').length,
        ],
        backgroundColor: [
          'rgba(239, 68, 68, 0.7)',  // rojo
          'rgba(59, 130, 246, 0.7)',  // azul
          'rgba(234, 179, 8, 0.7)',   // amarillo
          'rgba(20, 184, 166, 0.7)',  // teal
        ],
        borderColor: [
          'rgba(239, 68, 68, 1)',
          'rgba(59, 130, 246, 1)',
          'rgba(234, 179, 8, 1)',
          'rgba(20, 184, 166, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  // Datos para gráfico de productividad semanal (ejemplo)
  const productivityData = {
    labels: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
    datasets: [
      {
        label: 'Tareas completadas',
        data: [3, 5, 2, 7, 4, 1, 0], // Datos de ejemplo
        backgroundColor: 'rgba(79, 70, 229, 0.7)',
        borderColor: 'rgba(79, 70, 229, 1)',
        borderWidth: 1,
      },
    ],
  };

  // Consejos basados en estadísticas
  const getWellbeingTips = () => {
    const urgentImportantCount = tasks.filter(t => t.priority === 'urgent-important').length;
    const completedRatio = tasks.length > 0 ? completedTasks / tasks.length : 0;
    
    const tips = [];
    
    if (urgentImportantCount > 3) {
      tips.push('Tienes muchas tareas urgentes e importantes. Considera delegar algunas o replantear plazos.');
    }
    
    if (completedRatio < 0.3) {
      tips.push('Intenta dividir tus tareas en pasos más pequeños para sentir más logros durante el día.');
    } else if (completedRatio > 0.8) {
      tips.push('¡Gran trabajo completando tareas! Recuerda tomar descansos para mantener tu energía.');
    }
    
    if (overdueTasks > 0) {
      tips.push(`Tienes ${overdueTasks} tareas atrasadas. Revisa si aún son relevantes o renegocia los plazos.`);
    }
    
    if (tips.length === 0) {
      tips.push('Tu carga de trabajo parece equilibrada. ¡Sigue así y recuerda tomar pausas activas!');
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


  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
      {/* Pestañas */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex">
          <button
            onClick={() => setActiveTab('productivity')}
            className={`px-4 py-3 text-sm font-medium ${activeTab === 'productivity' ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
          >
            Productividad
          </button>
          <button
            onClick={() => setActiveTab('wellbeing')}
            className={`px-4 py-3 text-sm font-medium ${activeTab === 'wellbeing' ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
          >
            Bienestar
          </button>
        </nav>
      </div>

      {/* Contenido de las pestañas */}
      <div className="p-6">
        {activeTab === 'productivity' ? (
          <>
            {/* Resumen rápido */}
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
                <p className="text-2xl font-bold mt-1">{tasks.length}</p>
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

            {/* Gráficos */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-medium mb-4">Distribución por prioridad</h3>
                <div className="h-64">
                  <Pie 
                    data={priorityData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'bottom',
                          labels: {
                            color: '#6B7280',
                          },
                        },
                      },
                    }}
                  />
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-4">Productividad semanal</h3>
                <div className="h-64">
                  <Bar
                    data={productivityData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      scales: {
                        y: {
                          beginAtZero: true,
                          ticks: {
                            precision: 0,
                          },
                        },
                      },
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Acción rápida */}
            <div className="mt-8">
            
            </div>
          </>
        ) : (
          <div className="space-y-6">
            <h3 className="text-lg font-medium">Perspectiva de bienestar</h3>
            
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <div className="flex items-start">
                <FaRegLightbulb className="text-blue-600 dark:text-blue-400 mt-1 mr-3 flex-shrink-0" />
                <div>
                  <h4 className="font-medium mb-2">Consejos basados en tu actividad</h4>
                  <ul className="space-y-2">
                    {wellbeingTips.map((tip, index) => (
                      <li key={index} className="flex items-start">
                        <span className="inline-block h-2 w-2 rounded-full bg-blue-600 mt-2 mr-2"></span>
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
                    {completedTasks === 0 
                      ? "Aún no has completado tareas. Empieza con algo pequeño para ganar impulso." 
                      : `Has completado ${completedTasks} tareas (${Math.round((completedTasks / tasks.length) * 100)}% de tu lista).`}
                  </p>
                  <div className="mt-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                    <div 
                      className="bg-purple-600 h-2.5 rounded-full" 
                      style={{ width: `${(completedTasks / tasks.length) * 100}%` }}
                    ></div>
                  </div>
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