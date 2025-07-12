export interface PomodoroSession {
  id: number;
  user_id: number;
  task_id?: number;
  duration: number;
  completed: boolean;
  created_at: Date | string;
  updated_at: Date | string;
}