import { ReactNode } from 'react';
import { UserResponse } from '../../../shared/schemas';

// Tipo para el usuario autenticado
export type AuthUser = UserResponse;

// Props para el componente ProtectedRoute
export interface ProtectedRouteProps {
  children?: ReactNode;
}

// Estado de autenticación
export interface AuthState {
  token: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  _hasHydrated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setToken: (token: string) => void;
  setUser: (user: AuthUser) => void;
  clearAuth: () => void;
  verifyToken: () => Promise<void>;
}