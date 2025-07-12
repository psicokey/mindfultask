'use client';

import { useState, useEffect } from 'react';

const reminders = [
  "Tómate un momento para respirar profundamente antes de comenzar una nueva tarea",
  "¿Has bebido agua hoy? Mantenerse hidratado mejora la concentración",
  "Recuerda que es mejor completar una tarea bien que varias a medias",
  "Divide las tareas grandes en pasos más pequeños y manejables",
  "Celebra tus pequeños logros a lo largo del día",
  "Programa descansos cortos cada 60-90 minutos para mantener la concentración",
  "¿Estás trabajando en tus tareas más importantes o solo en las urgentes?",
  "Revisa tus logros al final del día, no solo lo que te falta por hacer"
];

export default function MindfulReminders() {
  const [currentReminder, setCurrentReminder] = useState('');
  
  useEffect(() => {
    // Mostrar un recordatorio aleatorio al cargar
    const randomIndex = Math.floor(Math.random() * reminders.length);
    setCurrentReminder(reminders[randomIndex]);
    
    // Cambiar el recordatorio cada 2 minutos
    const interval = setInterval(() => {
      const newIndex = Math.floor(Math.random() * reminders.length);
      setCurrentReminder(reminders[newIndex]);
    }, 120000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white p-4 rounded-lg shadow-md">
      <div className="flex items-start">
        <div className="flex-shrink-0 mt-1 mr-3">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <div>
          <h3 className="font-bold mb-1">Recordatorio Mindful</h3>
          <p>{currentReminder}</p>
        </div>
      </div>
    </div>
  );
}