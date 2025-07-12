export interface User {
  id: number;
  name: string;
  email: string;
  password: string;
  created_at: Date | string;
  updated_at: Date | string;
}