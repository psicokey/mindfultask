export interface Task {
  id: number;
  user_id: number;
  title: string;
  description?: string;
  due_date?: Date | string;
  priority: 'urgent-important' | 'notUrgent-important' | 'urgent-notImportant' | 'notUrgent-notImportant';
  completed: boolean;
  created_at: Date | string;
  updated_at: Date | string;
}