export interface User {
  id: string;
  email: string;
  profileCompleted: boolean;
}

export interface Profile {
  id: string;
  email: string;
  name: string | null;
  mobileNumber: string | null;
  address: string | null;
  businessName: string | null;
  profileCompleted: boolean;
}

export interface Task {
  id: string;
  name: string;
  description: string;
}

export interface Category {
  id: string;
  name: string;
  tasks: Task[];
}

export interface SelectedTask {
  id: string;
  name: string;
  description: string;
  category: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    code: string;
    message: string;
  };
}

export interface LoginResponse {
  token: string;
  user: User;
}
