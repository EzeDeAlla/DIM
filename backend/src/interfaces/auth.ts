// Interfaces para el dominio de Auth

// Tipos base del usuario (coherente con tabla users)
export interface User {
  id: string;
  email: string;
  password_hash: string;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
  description: string | null;
  user_type: 'doctor' | 'admin' | 'administrador';
  specialty: string | null;
  is_active: boolean;
  is_online: boolean;
  last_online_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserProfile extends Omit<User, 'password_hash'> {}

export interface UserWithPassword extends User {}

export interface UserWithoutPassword extends Omit<User, 'password_hash'> {}

// Datos para crear usuario (backend)
export interface CreateUserData {
  email: string;
  password_hash: string;
  first_name: string;
  last_name: string;
  avatar_url?: string;
  description?: string;
  user_type: 'doctor' | 'admin' | 'administrador';
  specialty?: string;
}

// Schemas de request/response
export interface Login {
  email: string;
  password: string;
}

export interface Register {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  user_type: 'doctor' | 'admin' | 'administrador';
  specialty?: string;
  description?: string;
}

export interface AuthResponse {
  user: UserProfile;
  token: string;
  refresh_token: string;
  expires_in: number;
}

// Repository interface
export interface IAuthRepository {
  findUserByEmail(email: string): Promise<UserWithPassword | undefined>;
  findUserById(id: string): Promise<UserWithPassword | undefined>;
  createUser(userData: CreateUserData): Promise<UserWithPassword>;
  updateLastOnline(userId: string): Promise<void>;
  setUserOffline(userId: string): Promise<void>;
}