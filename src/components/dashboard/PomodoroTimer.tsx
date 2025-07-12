'use client';

import { useState, useEffect, useRef } from 'react';

export default function PomodoroTimer() {
  const [minutes, setMinutes] = useState(25);
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState('work'); // 'work' or 'break'
  const [completedWork, setCompletedWork] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isActive) {
      intervalRef.current = setInterval(() => {
        setSeconds(prevSeconds => {
          if (prevSeconds === 0) {
            if (minutes === 0) {
              // Timer completed
              clearInterval(intervalRef.current as NodeJS.Timeout);
              setIsActive(false);
              
              if (mode === 'work') {
                setCompletedWork(prev => prev + 1);
                // Switch to break after work
                setMode('break');
                setMinutes(5);
                setSeconds(0);
              } else {
                // Switch to work after break
                setMode('work');
                setMinutes(25);
                setSeconds(0);
              }
              
              return 0;
            } else {
              setMinutes(prevMinutes => prevMinutes - 1);
              return 59;
            }
          } else {
            return prevSeconds - 1;
          }
        });
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isActive, minutes, mode]);

  const toggleTimer = () => {
    setIsActive(!isActive);
  };

  const resetTimer = () => {
    setIsActive(false);
    setMinutes(mode === 'work' ? 25 : 5);
    setSeconds(0);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4">Pomodoro Timer</h2>
      <div className="text-center mb-4">
        <div className="text-4xl font-mono mb-4">
          {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
        </div>
        <p className="text-lg">
          {mode === 'work' ? 'Tiempo de trabajo' : 'Descanso'}
        </p>
      </div>
      <div className="flex justify-center space-x-4">
        <button
          onClick={toggleTimer}
          className={`px-4 py-2 rounded-md ${
            isActive 
              ? 'bg-red-500 hover:bg-red-600 text-white' 
              : 'bg-green-500 hover:bg-green-600 text-white'
          }`}
        >
          {isActive ? 'Pausa' : 'Inicio'}
        </button>
        <button
          onClick={resetTimer}
          className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
        >
          Reiniciar
        </button>
      </div>
      <div className="mt-4">
        <p>Sesiones completadas: {completedWork}</p>
        <p className="text-sm text-gray-600 mt-2">
          Consejo: Toma un descanso de 5 minutos después de cada sesión.
        </p>
      </div>
    </div>
  );
}