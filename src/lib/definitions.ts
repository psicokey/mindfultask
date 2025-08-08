// src/app/lib/definitions.ts

// Este tipo idealmente debería ser generado por Prisma y ser la única fuente de verdad.
export interface Task {
  id: string; // En la base de datos, esto es un string (ej. CUID o UUID)
  title: string;
  description?: string | null;
  due_date?: Date | null;
  priority: "low" | "medium" | "high";
  is_completed: boolean;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
}
