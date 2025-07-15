// components/Modal.tsx
'use client';

import React, { useEffect, useRef } from 'react';

interface ModalProps {
  isOpen: boolean; // Controla si el modal está abierto o cerrado
  onClose: () => void; // Función para cerrar el modal
  children: React.ReactNode; // Contenido del modal
  title?: string; // Título opcional del modal
}

export default function Modal({ isOpen, onClose, children, title }: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  // Efecto para manejar el cierre del modal al presionar 'Escape'
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  // Si el modal no está abierto, no renderizar nada
  if (!isOpen) return null;

  return (
    // Overlay del modal
    <div
      className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 p-4"
      onClick={(e) => {
        // Cierra el modal si se hace clic fuera del contenido del modal
        if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
          onClose();
        }
      }}
    >
      {/* Contenido del modal */}
      <div
        ref={modalRef}
        className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-6 w-full max-w-md md:max-w-lg lg:max-w-xl max-h-[90vh] overflow-y-auto transform transition-all duration-300 ease-out scale-95 opacity-0 animate-modal-in"
        // Animación de entrada del modal
        style={{ animationFillMode: 'forwards' }}
      >
        <div className="flex justify-between items-center mb-4 border-b pb-3 border-gray-200 dark:border-gray-700">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            {title || 'Modal'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            aria-label="Cerrar modal"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              ></path>
            </svg>
          </button>
        </div>
        <div className="text-gray-800 dark:text-gray-200">
          {children}
        </div>
      </div>
    </div>
  );
}
