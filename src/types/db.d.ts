// src/types/database.d.ts
import { User } from 'app/lib/db'

declare global {
  namespace DB {
    type User = {
      user_id: number
      name: string
      email: string
      password?: string;
      created_at: Date
      updated_at: Date
    }

    type PomodoroSession = {
      session_id: number // Clave primaria, usualmente un número autoincremental
      user_id: number
      duration: number
      cycles_completed: number
      completed_at: Date // Fecha de finalización
    }
  }
}

export type { User } from 'app/lib/db'
export type { PomodoroSession } from 'app/lib/db'