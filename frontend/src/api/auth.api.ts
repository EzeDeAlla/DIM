import apiClient from './axios.config';
import { LoginCredentials, RegisterData } from '../../../shared/schemas';

// Tipos ya exportados desde los schemas

// API de autenticación
export const authApi = {
  login: async (credentials: LoginCredentials) => {
    return apiClient.post('/auth/login', credentials);
  },
  
  logout: async () => {
    return apiClient.post('/auth/logout');
  },
  
  profile: async () => {
    return apiClient.get('/users/profile');
  },
  
  register: async (userData: RegisterData) => {
    return apiClient.post('/auth/register', userData);
  }
};