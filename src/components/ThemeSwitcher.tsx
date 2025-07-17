// components/ThemeSwitcher.tsx
'use client';

import { useState, useEffect } from 'react';
import { FaSun, FaMoon } from 'react-icons/fa'; // Iconos para sol y luna

export default function ThemeSwitcher() {
  // Estado para el tema, inicializado en null para manejar la primera carga del cliente
  const [isDarkMode, setIsDarkMode] = useState<boolean | null>(null);

  // Efecto para leer la preferencia del usuario desde localStorage al montar el componente
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      setIsDarkMode(savedTheme === 'dark');
    } else {
      // Si no hay preferencia guardada, usar la preferencia del sistema
      setIsDarkMode(window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
  }, []);

  // Efecto para aplicar la clase 'dark' al html y guardar la preferencia
  useEffect(() => {
    if (isDarkMode === null) return; // No hacer nada hasta que el estado se inicialice

    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode(prevMode => !prevMode);
  };

  // No renderizar nada hasta que el tema se haya inicializado para evitar FOUC
  if (isDarkMode === null) {
    return null;
  }

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white shadow-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors duration-200"
      aria-label={isDarkMode ? 'Activar modo claro' : 'Activar modo oscuro'}
    >
      {isDarkMode ? <FaSun className="w-5 h-5" /> : <FaMoon className="w-5 h-5" />}
    </button>
  );
}
