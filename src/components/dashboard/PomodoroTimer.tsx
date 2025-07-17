// components/PomodoroTimer.tsx
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';

// Interfaz para los datos de la sesión Pomodoro a enviar a la API
interface PomodoroSessionData {
  duration: number; // Duración total en segundos
  cycles_completed: number;
  userId: string; // ID del usuario autenticado
}

// Clave para almacenar el estado en localStorage
const STORAGE_KEY = 'pomodoroTimerState';

export default function PomodoroTimer() {
  // Estados para la configuración del temporizador
  const [workTime, setWorkTime] = useState(25); // Tiempo de trabajo en minutos
  const [breakTime, setBreakTime] = useState(5); // Tiempo de descanso corto en minutos
  const [longBreakTime, setLongBreakTime] = useState(15); // Tiempo de descanso largo en minutos
  const [totalCycles, setTotalCycles] = useState(4); // Número de ciclos antes de un descanso largo
  const [isLongBreakEnabled, setIsLongBreakEnabled] = useState(true); // Habilitar/deshabilitar descanso largo

  // Estados para el temporizador actual
  const [minutes, setMinutes] = useState(workTime);
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false); // Si el temporizador está corriendo
  const [mode, setMode] = useState<'work' | 'break' | 'long-break'>('work'); // Modo actual del temporizador
  const [currentCycle, setCurrentCycle] = useState(0); // Ciclos de trabajo completados

  // Estados para las estadísticas de la sesión
  const [sessionDuration, setSessionDuration] = useState(0); // Duración total de la sesión en segundos

  // Referencia para el intervalo del temporizador
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Refs para mantener los valores más recientes de minutes y seconds dentro del setInterval
  const currentMinutesRef = useRef(minutes);
  const currentSecondsRef = useRef(seconds);

  // Estado para el mensaje de alerta personalizado
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState<'success' | 'info' | 'error'>('info');

  // Obtener la sesión del usuario autenticado
  const { data: session } = useSession();
  const userId = session?.user?.id;

  // --- Funciones de Utilidad ---

  // Función para reproducir un sonido
  const playSound = () => {
    try {
      const audio = new Audio('sounds/mixkit-alert-quick-chime-766.mp3'); // Asegúrate de tener este archivo en /public/sounds/
      audio.play().catch(e => console.error("Error al reproducir sonido:", e));
    } catch (e) {
      console.error("No se pudo crear el objeto Audio:", e);
    }
  };

  // Función para mostrar la alerta personalizada
  const showCustomAlert = (message: string, type: 'success' | 'info' | 'error' = 'info') => {
    setAlertMessage(message);
    setAlertType(type);
    setShowAlert(true);
    setTimeout(() => {
      setShowAlert(false);
      setAlertMessage('');
    }, 3000); // La alerta desaparece después de 3 segundos
  };

  // Función para guardar la sesión Pomodoro en la base de datos
  const savePomodoroSession = useCallback(async (data: PomodoroSessionData) => {
    if (typeof data.duration !== 'number' || typeof data.cycles_completed !== 'number' || data.duration <= 0 || data.cycles_completed <= 0) {
      showCustomAlert('Datos de sesión inválidos. Por favor, revise la duración y los ciclos completados.', 'error');
      console.error("Datos de sesión inválidos:", data);
      return;
    }

    if (!userId) {
      showCustomAlert('No se pudo guardar la sesión: Usuario no autenticado.', 'error');
      console.error("No se pudo guardar la sesión: userId no disponible.");
      return;
    }

    console.log("Enviando datos de sesión a la API:", data);
    try {
      const response = await fetch('/api/pomodoro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error del servidor');
      }

      const result = await response.json();
      console.log("Sesión guardada con éxito:", result);
      showCustomAlert(`¡Sesión completada y guardada!\nCiclos: ${data.cycles_completed}\nDuración: ${Math.floor(data.duration / 60)} minutos.`, 'success');

    } catch (error) {
      console.error("Fallo al guardar la sesión:", error);
      showCustomAlert(`Hubo un error al guardar la sesión: ${(error as Error).message}`, 'error');
    }
  }, [userId]);

  // --- Efectos para Sincronizar Refs con el Estado ---
  useEffect(() => {
    currentMinutesRef.current = minutes;
  }, [minutes]);

  useEffect(() => {
    currentSecondsRef.current = seconds;
  }, [seconds]);

  // --- Efectos del Temporizador ---

  // Efecto para manejar la cuenta regresiva del temporizador
  useEffect(() => {
    console.log('PomodoroTimer: useEffect del contador activo. isActive:', isActive);
    if (isActive) {
      intervalRef.current = setInterval(() => {
        if (currentSecondsRef.current > 0) {
          setSeconds(prevSeconds => prevSeconds - 1);
        } else {
          if (currentMinutesRef.current > 0) {
            setMinutes(prevMinutes => prevMinutes - 1);
            setSeconds(59);
          } else {
            setSeconds(0);
          }
        }
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    return () => {
      console.log('PomodoroTimer: Limpiando intervalo.');
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isActive]);

  // Efecto para gestionar el cambio de modo (trabajo, descanso, descanso largo) y el fin de la sesión
  useEffect(() => {
    if (minutes === 0 && seconds === 0 && isActive) {
      console.log('PomodoroTimer: Temporizador llegó a 0. Modo actual:', mode);
      playSound();

      let completedTimeForCurrentMode = 0;
      if (mode === 'work') {
        completedTimeForCurrentMode = workTime * 60;
      } else if (mode === 'break') {
        completedTimeForCurrentMode = breakTime * 60;
      } else if (mode === 'long-break') {
        completedTimeForCurrentMode = longBreakTime * 60;
      }
      setSessionDuration(prevDuration => prevDuration + completedTimeForCurrentMode);

      if (mode === 'work') {
        const newCurrentCycle = currentCycle + 1;
        setCurrentCycle(newCurrentCycle);

        if (newCurrentCycle === totalCycles) {
          if (isLongBreakEnabled) {
            setMode('long-break');
            setMinutes(longBreakTime);
            showCustomAlert('¡Tiempo de Descanso Largo!', 'info');
          } else {
            setIsActive(false);
            savePomodoroSession({
              duration: sessionDuration + completedTimeForCurrentMode,
              cycles_completed: newCurrentCycle,
              userId: userId || 'unknown',
            });
            setCurrentCycle(0);
            setSessionDuration(0);
            setMode('work');
            setMinutes(workTime);
            setSeconds(0);
            showCustomAlert('¡Sesión Pomodoro Finalizada!', 'success');
          }
        } else {
          setMode('break');
          setMinutes(breakTime);
          setSeconds(0);
          showCustomAlert('¡Tiempo de Descanso Corto!', 'info');
        }
      } else if (mode === 'break') {
        setMode('work');
        setMinutes(workTime);
        setSeconds(0);
        showCustomAlert('¡Tiempo de Trabajo!', 'info');
      } else if (mode === 'long-break') {
        setIsActive(false);
        savePomodoroSession({
          duration: sessionDuration + completedTimeForCurrentMode,
          cycles_completed: currentCycle,
          userId: userId || 'unknown',
        });
        setCurrentCycle(0);
        setSessionDuration(0);
        setMode('work');
        setMinutes(workTime);
        setSeconds(0);
        showCustomAlert('¡Sesión Pomodoro Finalizada!', 'success');
      }
    }
  }, [minutes, seconds, isActive, mode, currentCycle, totalCycles, workTime, breakTime, longBreakTime, sessionDuration, isLongBreakEnabled, savePomodoroSession, userId]);


  // Efecto para inicializar o actualizar el temporizador desde localStorage
  useEffect(() => {
    console.log('PomodoroTimer: useEffect de carga de estado (montaje inicial).');
    if (typeof window !== 'undefined') {
      const savedState = localStorage.getItem(STORAGE_KEY);
      console.log('PomodoroTimer: Estado guardado en localStorage:', savedState);
      if (savedState) {
        try {
          const parsedState = JSON.parse(savedState);
          console.log('PomodoroTimer: Estado parseado:', parsedState);
          setWorkTime(parsedState.workTime || 25);
          setBreakTime(parsedState.breakTime || 5);
          setLongBreakTime(parsedState.longBreakTime || 15);
          setTotalCycles(parsedState.totalCycles || 4);
          setIsLongBreakEnabled(parsedState.isLongBreakEnabled !== undefined ? parsedState.isLongBreakEnabled : true);

          setMinutes(parsedState.minutes !== undefined ? parsedState.minutes : parsedState.workTime || 25);
          setSeconds(parsedState.seconds !== undefined ? parsedState.seconds : 0);
          setMode(parsedState.mode || 'work');
          setCurrentCycle(parsedState.currentCycle || 0);
          setSessionDuration(parsedState.sessionDuration || 0);

          if (parsedState.isActive) {
            console.log('PomodoroTimer: Re-activando temporizador desde estado guardado.');
            setIsActive(true);
          } else {
            console.log('PomodoroTimer: Temporizador inactivo en estado guardado.');
            setIsActive(false);
          }
        } catch (e) {
          console.error("PomodoroTimer: Error al parsear el estado guardado de localStorage:", e);
          localStorage.removeItem(STORAGE_KEY); // Limpiar estado corrupto
          console.log('PomodoroTimer: Reseteando a valores por defecto por error de parseo.');
          setMinutes(workTime);
          setSeconds(0);
          setIsActive(false);
          setMode('work');
          setCurrentCycle(0);
          setSessionDuration(0);
        }
      } else {
        console.log('PomodoroTimer: No se encontró estado guardado. Inicializando con valores por defecto.');
        setMinutes(workTime);
        setSeconds(0);
        setIsActive(false);
        setMode('work');
        setCurrentCycle(0);
        setSessionDuration(0);
      }
    }
  }, []); // Se ejecuta solo una vez al montar el componente

  // Efecto para guardar el estado en localStorage cada vez que cambian los estados relevantes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stateToSave = {
        workTime, breakTime, longBreakTime, totalCycles, isLongBreakEnabled,
        minutes, seconds, isActive, mode, currentCycle, sessionDuration
      };
      console.log('PomodoroTimer: Guardando estado en localStorage:', stateToSave);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
    }
  }, [workTime, breakTime, longBreakTime, totalCycles, isLongBreakEnabled, minutes, seconds, isActive, mode, currentCycle, sessionDuration]);


  // --- Funciones de Control del Temporizador ---

  const toggleTimer = () => {
    console.log('PomodoroTimer: toggleTimer llamado. isActive antes:', isActive);
    setIsActive(prev => !prev);
  };

  const resetSession = () => {
    console.log('PomodoroTimer: resetSession llamado.');
    setIsActive(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setMode('work');
    setCurrentCycle(0);
    setSessionDuration(0);
    setMinutes(workTime);
    setSeconds(0);
    showCustomAlert('Sesión Reiniciada.', 'info');
    if (typeof window !== 'undefined') {
      console.log('PomodoroTimer: Limpiando localStorage al reiniciar sesión.');
      localStorage.removeItem(STORAGE_KEY); // Limpiar el estado guardado en localStorage al reiniciar
    }
  };

  // --- Manejadores de Cambio para Inputs (con validación) ---

  const handleWorkTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value);
    const newValue = value < 1 ? 1 : value;
    setWorkTime(newValue);
    if (!isActive && mode === 'work') {
      setMinutes(newValue);
      setSeconds(0);
    }
  };

  const handleBreakTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value);
    const newValue = value < 1 ? 1 : value;
    setBreakTime(newValue);
    if (!isActive && mode === 'break') {
      setMinutes(newValue);
      setSeconds(0);
    }
  };

  const handleLongBreakTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value);
    const newValue = value < 1 ? 1 : value;
    setLongBreakTime(newValue);
    if (!isActive && mode === 'long-break') {
      setMinutes(newValue);
      setSeconds(0);
    }
  };

  const handleTotalCyclesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value);
    setTotalCycles(value < 1 ? 1 : value);
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-xl max-w-sm mx-auto font-sans text-gray-900 dark:text-white">
      {/* Alerta Personalizada */}
      {showAlert && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-md shadow-lg transition-all duration-300 ease-out transform ${
          alertType === 'success' ? 'bg-green-500' : alertType === 'error' ? 'bg-red-500' : 'bg-blue-500'
        } text-white font-semibold`}>
          {alertMessage}
        </div>
      )}

      <h2 className="text-2xl font-bold text-center mb-2">
        {mode === 'work' ? '☕ Tiempo de Trabajo' : mode === 'break' ? '🧘‍♀️ Descanso Corto' : '😴 Descanso Largo'}
      </h2>
      <div className="text-center my-6">
        <div className="text-8xl font-mono text-gray-900 dark:text-white">
          {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
        </div>
      </div>
      <div className="flex justify-center space-x-4 mb-6">
        <button
          onClick={toggleTimer}
          className={`px-8 py-3 rounded-md text-lg font-semibold transition-transform transform hover:scale-105
            ${isActive ? 'bg-orange-500 hover:bg-orange-600' : 'bg-blue-500 hover:bg-blue-600'}
            text-white shadow-md`}
          type="button"
        >
          {isActive ? 'Pausa' : 'Inicio'}
        </button>
        <button
          onClick={resetSession}
          className="px-8 py-3 bg-gray-500 text-white rounded-md font-semibold hover:bg-gray-600 transition-transform transform hover:scale-105 shadow-md"
          type="button"
        >
          Reiniciar Sesión
        </button>
      </div>

      <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4 space-y-4">
        <h3 className="font-bold text-gray-700 dark:text-gray-300 text-center text-lg mb-4">Configuración</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="workTime" className="block text-sm font-medium text-gray-600 dark:text-gray-400">Trabajo (min)</label>
            <input
              id="workTime"
              type="number"
              value={workTime}
              onChange={handleWorkTimeChange}
              className="mt-1 w-full p-2 text-center border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-gray-50 dark:bg-gray-700 dark:text-white"
              disabled={isActive}
              min="1"
            />
          </div>
          <div>
            <label htmlFor="breakTime" className="block text-sm font-medium text-gray-600 dark:text-gray-400">Descanso (min)</label>
            <input
              id="breakTime"
              type="number"
              value={breakTime}
              onChange={handleBreakTimeChange}
              className="mt-1 w-full p-2 text-center border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-gray-50 dark:bg-gray-700 dark:text-white"
              disabled={isActive}
              min="1"
            />
          </div>
        </div>

        <div className="flex items-center justify-between mt-4">
          <label htmlFor="longBreakEnabled" className="text-sm font-medium text-gray-600 dark:text-gray-400 cursor-pointer">
            <input
              id="longBreakEnabled"
              type="checkbox"
              checked={isLongBreakEnabled}
              onChange={(e) => setIsLongBreakEnabled(e.target.checked)}
              className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded dark:bg-gray-700 dark:border-gray-600"
              disabled={isActive}
            />
            Habilitar Descanso Largo
          </label>
          {isLongBreakEnabled && (
            <div className="ml-4">
              <label htmlFor="longBreakTime" className="block text-sm font-medium text-gray-600 dark:text-gray-400">Descanso Largo (min)</label>
              <input
                id="longBreakTime"
                type="number"
                value={longBreakTime}
                onChange={handleLongBreakTimeChange}
                className="mt-1 w-24 p-2 text-center border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-gray-50 dark:bg-gray-700 dark:text-white"
                disabled={isActive}
                min="1"
              />
            </div>
          )}
        </div>

        <div className="text-center mt-4">
          <label htmlFor="totalCycles" className="block text-sm font-medium text-gray-600 dark:text-gray-400">Ciclos por Sesión</label>
          <input
            id="totalCycles"
            type="number"
            value={totalCycles}
            onChange={handleTotalCyclesChange}
            className="mt-1 w-24 p-2 text-center border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-gray-50 dark:bg-gray-700 dark:text-white"
            disabled={isActive}
            min="1"
          />
        </div>

        <div className="text-center bg-gray-50 dark:bg-gray-700 p-3 rounded-lg mt-6 shadow-sm">
          <h3 className="font-bold text-gray-700 dark:text-gray-300">Estadísticas de la Sesión Actual</h3>
          <p className="text-gray-600 dark:text-gray-400">Ciclos Completados: <span className="font-mono font-bold">{currentCycle} / {totalCycles}</span></p>
          <p className="text-gray-600 dark:text-gray-400">Tiempo Total: <span className="font-mono font-bold">{Math.floor(sessionDuration / 60)} minutos</span></p>
        </div>
      </div>
    </div>
  );
}
