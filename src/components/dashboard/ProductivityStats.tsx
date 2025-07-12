'use client';

import { useState, useEffect } from 'react';
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

interface ProductivityStatsProps {
  userId: number;
}

export default function ProductivityStats({ userId }: ProductivityStatsProps) {
  const [stats, setStats] = useState({
    completed: 0,
    pending: 0,
    overdue: 0,
    weeklyTrend: [0, 0, 0, 0, 0, 0, 0],
  });

  useEffect(() => {
    // Datos simulados mientras implementamos la API
    setStats({
      completed: 12,
      pending: 5,
      overdue: 2,
      weeklyTrend: [3, 5, 2, 7, 4, 6, 8],
    });
  }, [userId]);

  const data = {
    labels: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
    datasets: [
      {
        label: 'Tareas completadas',
        data: stats.weeklyTrend,
        backgroundColor: 'rgba(79, 70, 229, 0.8)',
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Productividad semanal',
      },
    },
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4">Estadísticas de Productividad</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <h3 className="font-bold text-green-800">Completadas</h3>
          <p className="text-2xl font-bold">{stats.completed}</p>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
          <h3 className="font-bold text-yellow-800">Pendientes</h3>
          <p className="text-2xl font-bold">{stats.pending}</p>
        </div>
        <div className="bg-red-50 p-4 rounded-lg border border-red-200">
          <h3 className="font-bold text-red-800">Atrasadas</h3>
          <p className="text-2xl font-bold">{stats.overdue}</p>
        </div>
      </div>
      
      <div>
        <Bar data={data} options={options} />
      </div>
      
      <div className="mt-6">
        <h3 className="font-bold mb-2">Consejos basados en tus estadísticas:</h3>
        <ul className="list-disc pl-5 space-y-1 text-gray-700">
          {stats.overdue > 2 && (
            <li>Considera delegar o replantear las tareas recurrentemente atrasadas</li>
          )}
          {stats.pending > 8 && (
            <li>Revisa tu lista de tareas y elimina las que ya no son relevantes</li>
          )}
          {stats.weeklyTrend[6] > 0 && (
            <li>Intenta equilibrar tu carga de trabajo durante la semana</li>
          )}
          <li>Programa tiempo para tareas importantes pero no urgentes</li>
        </ul>
      </div>
    </div>
  );
}