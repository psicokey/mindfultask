'use client';

import { useState, useEffect } from 'react';
import { Task } from 'app/types/task';

interface EisenhowerMatrixProps {
  tasks: Task[];
}

export default function EisenhowerMatrix({ tasks }: EisenhowerMatrixProps) {
  const [matrix, setMatrix] = useState<{
    urgentImportant: Task[];
    notUrgentImportant: Task[];
    urgentNotImportant: Task[];
    notUrgentNotImportant: Task[];
  }>({
    urgentImportant: [],
    notUrgentImportant: [],
    urgentNotImportant: [],
    notUrgentNotImportant: [],
  });

  useEffect(() => {
    const categorizeTasks = () => {
      const urgentImportant = tasks.filter(
        task => task.priority === 'urgent-important'
      );
      
      const notUrgentImportant = tasks.filter(
        task => task.priority === 'notUrgent-important'
      );
      
      const urgentNotImportant = tasks.filter(
        task => task.priority === 'urgent-notImportant'
      );
      
      const notUrgentNotImportant = tasks.filter(
        task => task.priority === 'notUrgent-notImportant'
      );

      setMatrix({
        urgentImportant,
        notUrgentImportant,
        urgentNotImportant,
        notUrgentNotImportant,
      });
    };

    categorizeTasks();
  }, [tasks]);

  const Quadrant = ({ title, tasks, color }: { 
    title: string; 
    tasks: Task[]; 
    color: string; 
  }) => (
    <div className={`p-4 rounded-lg border ${color}`}>
      <h3 className="font-bold mb-2">{title}</h3>
      <ul className="space-y-2">
        {tasks.map(task => (
          <li key={task.id} className="flex items-start">
            <input
              type="checkbox"
              className="mt-1 mr-2"
              checked={task.completed}
              onChange={() => {}}
            />
            <span className={task.completed ? 'line-through text-gray-500' : ''}>
              {task.title}
            </span>
          </li>
        ))}
        {tasks.length === 0 && <li className="text-gray-500">No hay tareas</li>}
      </ul>
    </div>
  );

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4">Matriz de Eisenhower</h2>
      <div className="grid grid-cols-2 gap-4">
        <Quadrant 
          title="Urgente e Importante" 
          tasks={matrix.urgentImportant} 
          color="bg-red-50 border-red-200" 
        />
        <Quadrant 
          title="No Urgente pero Importante" 
          tasks={matrix.notUrgentImportant} 
          color="bg-blue-50 border-blue-200" 
        />
        <Quadrant 
          title="Urgente pero No Importante" 
          tasks={matrix.urgentNotImportant} 
          color="bg-yellow-50 border-yellow-200" 
        />
        <Quadrant 
          title="No Urgente y No Importante" 
          tasks={matrix.notUrgentNotImportant} 
          color="bg-green-50 border-green-200" 
        />
      </div>
    </div>
  );
}