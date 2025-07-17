// components/dashboard/DashboardContext.tsx
'use client';

import React, { createContext, useContext, useState } from 'react';
import { Task } from '@prisma/client'; // Assuming Task type is available

interface DashboardContextType {
  isFormModalOpen: boolean;
  selectedTask: Task | null;
  taskRefreshTrigger: number;
  handleOpenNewTaskModal: () => void;
  handleOpenEditTaskModal: (task: Task) => void;
  handleCloseFormModal: () => void;
  handleTaskFormSuccess: () => void;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export function useDashboardContext() {
  const context = useContext(DashboardContext);
  if (context === undefined) {
    throw new Error('useDashboardContext must be used within a DashboardProvider');
  }
  return context;
}

interface DashboardProviderProps {
  children: React.ReactNode;
}

export function DashboardProvider({ children }: DashboardProviderProps) {
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [taskRefreshTrigger, setTaskRefreshTrigger] = useState(0);

  const handleOpenNewTaskModal = () => {
    setSelectedTask(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEditTaskModal = (task: Task) => {
    setSelectedTask(task);
    setIsFormModalOpen(true);
  };

  const handleCloseFormModal = () => {
    setIsFormModalOpen(false);
    setSelectedTask(null);
  };

  const handleTaskFormSuccess = () => {
    handleCloseFormModal();
    setTaskRefreshTrigger(prev => prev + 1);
  };

  const value = {
    isFormModalOpen,
    selectedTask,
    taskRefreshTrigger,
    handleOpenNewTaskModal,
    handleOpenEditTaskModal,
    handleCloseFormModal,
    handleTaskFormSuccess,
  };

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
}
