// components/dashboard/ProductivityStats.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface ProductivityStatsData {
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  completionRate: number;
  totalPomodoroSessions: number;
  totalPomodoroDurationMinutes: number;
  totalPomodoroCycles: number;
  weeklyTrend: number[]; // Datos de tareas completadas por día de la semana
}

export default function ProductivityStats() {
  const [stats, setStats] = useState<ProductivityStatsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { data: session, status } = useSession();
  const userId = session?.user?.id;

  const fetchProductivityStats = useCallback(async () => {
    if (status === 'loading') {
      setIsLoading(true);
      return;
    }
    if (!userId) {
      setError('No se pudieron cargar las estadísticas: Usuario no autenticado.');
      setIsLoading(false);
      setStats(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/productivity', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        let errorData = { message: 'Error al obtener las estadísticas de productividad.' };
        try {
          errorData = await response.json();
        } catch (parseError) {
          console.error("Error al parsear la respuesta de error JSON:", parseError);
        }
        throw new Error(errorData.message);
      }

      const result: ProductivityStatsData = await response.json();
      setStats(result);
    } catch (err: any) {
      console.error('Error al obtener estadísticas de productividad:', err);
      setError(err.message || 'Ocurrió un error inesperado al cargar las estadísticas.');
      setStats(null);
    } finally {
      setIsLoading(false);
    }
  }, [userId, status]);

  useEffect(() => {
    fetchProductivityStats();
  }, [fetchProductivityStats]);

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl font-sans text-gray-900 dark:text-white text-center">
        <p>Cargando estadísticas de productividad...</p>
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

  if (!stats) {
    return (
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl font-sans text-gray-900 dark:text-white text-center">
        <p>No hay estadísticas disponibles.</p>
      </div>
    );
  }

  // Configuración del gráfico de barras
  const labels = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
  const todayDayOfWeek = (new Date().getDay() === 0) ? 6 : new Date().getDay() - 1; // 0=Lun, 6=Dom

  // Reordenar weeklyTrend para que coincida con las etiquetas Lun-Dom
  // La API devuelve weeklyTrend[0] como hoy, weeklyTrend[1] como ayer, etc.
  const orderedWeeklyTrend = new Array(7).fill(0);
  for (let i = 0; i < 7; i++) {
    const dayIndexInLabels = (todayDayOfWeek - i + 7) % 7; // Calcula el índice del día de la semana para la etiqueta
    orderedWeeklyTrend[dayIndexInLabels] = stats.weeklyTrend[i] || 0; // Asigna el valor de la API al día correcto
  }

  const data = {
    labels: labels, // Usar etiquetas fijas Lun-Dom
    datasets: [
      {
        label: 'Tareas completadas',
        data: orderedWeeklyTrend, // Usar los datos reordenados
        backgroundColor: 'rgba(79, 70, 229, 0.8)', // blue-600
        borderColor: 'rgba(79, 70, 229, 1)',
        borderWidth: 1,
        borderRadius: 4,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false, // Permite que el gráfico se ajuste al contenedor
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: 'rgb(107 114 128)' // Tailwind gray-500
        }
      },
      title: {
        display: true,
        text: 'Productividad semanal',
        color: 'rgb(17 24 39)' // Tailwind gray-900
      },
      tooltip: {
        backgroundColor: 'rgba(0,0,0,0.7)',
        bodyColor: '#fff',
        titleColor: '#fff',
      }
    },
    scales: {
      x: {
        ticks: {
          color: 'rgb(107 114 128)' // Tailwind gray-500
        },
        grid: {
          color: 'rgba(209, 213, 219, 0.1)' // gray-300 con opacidad para dark mode
        }
      },
      y: {
        ticks: {
          color: 'rgb(107 114 128)', // Tailwind gray-500
          stepSize: 1, // Para asegurar que los ticks sean enteros
          beginAtZero: true, // Asegura que el eje Y comience en 0
        },
        grid: {
          color: 'rgba(209, 213, 219, 0.1)' // gray-300 con opacidad para dark mode
        }
      }
    }
  };


  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl font-sans text-gray-900 dark:text-white">
      <h2 className="text-2xl font-bold text-center text-gray-800 dark:text-white mb-6">Estadísticas de Productividad</h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
          <h3 className="font-bold text-gray-800 dark:text-white">Tareas Totales</h3>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.totalTasks}</p>
        </div>
        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
          <h3 className="font-bold text-gray-800 dark:text-white">Tareas Completadas</h3>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.completedTasks}</p>
        </div>
        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
          <h3 className="font-bold text-gray-800 dark:text-white">Tareas Pendientes</h3>
          <p className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.pendingTasks}</p>
        </div>
        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
          <h3 className="font-bold text-gray-800 dark:text-white">Tasa de Completación</h3>
          <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{stats.completionRate.toFixed(1)}%</p>
        </div>
      </div>
      
      {/* Sección del Gráfico de Productividad Semanal */}
      <div className="mb-6 h-64"> {/* Altura fija para el gráfico */}
        <Bar data={data} options={options} />
      </div>
      
      <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-6">
        <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4 text-center">Estadísticas Pomodoro</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg shadow-sm">
            <p className="text-sm text-gray-600 dark:text-gray-400">Sesiones Pomodoro</p>
            <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">{stats.totalPomodoroSessions}</p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg shadow-sm">
            <p className="text-sm text-gray-600 dark:text-gray-400">Tiempo Enfocado (min)</p>
            <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">{stats.totalPomodoroDurationMinutes}</p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg shadow-sm sm:col-span-2">
            <p className="text-sm text-gray-600 dark:text-gray-400">Ciclos Pomodoro Completados</p>
            <p className="text-3xl font-bold text-teal-600 dark:text-teal-400">{stats.totalPomodoroCycles}</p>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <h3 className="font-bold text-gray-800 dark:text-white mb-2">Consejos basados en tus estadísticas:</h3>
        <ul className="list-disc pl-5 space-y-1 text-gray-700 dark:text-gray-300">
          {stats.pendingTasks > 0 && stats.completedTasks / stats.totalTasks < 0.5 && (
            <li>Tienes muchas tareas pendientes. Intenta priorizar con la matriz de Eisenhower.</li>
          )}
          {stats.totalPomodoroSessions === 0 && (
            <li>¡Anímate a usar el temporizador Pomodoro para mejorar tu enfoque!</li>
          )}
          {stats.totalTasks > 0 && stats.completionRate === 100 && (
            <li>¡Excelente trabajo! Mantén el ritmo y sigue completando tus tareas.</li>
          )}
          {stats.totalTasks === 0 && (
            <li>Parece que no tienes tareas. ¡Es un buen momento para añadir algunas y empezar a organizar!</li>
          )}
          <li>Recuerda tomar descansos regulares para mantener la concentración.</li>
        </ul>
      </div>
    </div>
  );
}
