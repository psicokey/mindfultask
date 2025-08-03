// src/lib/guest-storage.ts
import { Task } from "@prisma/client";

const GUEST_TASKS_KEY = "mindful-guest-tasks";

/**
 * Obtiene las tareas del localStorage.
 */
export const getGuestTasks = (): Task[] => {
  if (typeof window === "undefined") return [];
  try {
    const tasksJson = localStorage.getItem(GUEST_TASKS_KEY);
    return tasksJson ? JSON.parse(tasksJson) : [];
  } catch (error) {
    console.error("Error reading guest tasks from localStorage:", error);
    return [];
  }
};

/**
 * Guarda un array completo de tareas en el localStorage.
 */
export const saveGuestTasks = (tasks: Task[]): void => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(GUEST_TASKS_KEY, JSON.stringify(tasks));
  } catch (error) {
    console.error("Error saving guest tasks to localStorage:", error);
  }
};

/**
 * Añade una nueva tarea para el invitado.
 * Genera un ID temporal basado en la fecha.
 */
export const addGuestTask = (
  taskData: Omit<Task, "id" | "userId" | "createdAt" | "updatedAt">
): Task => {
  const tasks = getGuestTasks();
  const newTask: Task = {
    ...taskData,
    id: Date.now(), // ID simple y único para el cliente
    userId: "guest",
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  const updatedTasks = [...tasks, newTask];
  saveGuestTasks(updatedTasks);
  return newTask;
};

/**
 * Actualiza una tarea existente para el invitado.
 */
export const updateGuestTask = (updatedTask: Task): Task | null => {
  if (typeof window === "undefined") return null;
  const tasks = getGuestTasks();
  const taskIndex = tasks.findIndex((t) => t.id === updatedTask.id);

  if (taskIndex === -1) {
    console.error("Error updating guest task: Task not found");
    return null;
  }

  const newTasks = [...tasks];
  newTasks[taskIndex] = {
    ...updatedTask,
    updatedAt: new Date(), // Ensure updatedAt is fresh
  };

  saveGuestTasks(newTasks);
  return newTasks[taskIndex];
};
