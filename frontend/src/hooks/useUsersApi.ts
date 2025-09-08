import { useAxiosQuery, useAxiosMutation } from './useAxiosQuery';
import { useQueryClient } from '@tanstack/react-query';
import apiClient from '../api/axios.config';
import { User, ContactSearchParams } from '../../../shared/schemas';

// Tipos específicos para la API
export interface ContactsResponse {
  users: User[];
  total: number;
  page: number;
  limit: number;
}

export interface UpdateProfileData {
  first_name?: string;
  last_name?: string;
  description?: string;
  specialty?: string;
}

export interface UpdateAvatarData {
  avatar_url: string;
}

export interface CreateUserData {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  user_type: 'doctor' | 'admin' | 'administrador';
  specialty?: string;
  description?: string;
}

// Query Keys
export const USERS_QUERY_KEYS = {
  all: ['users'] as const,
  contacts: (params?: ContactSearchParams) => [...USERS_QUERY_KEYS.all, 'contacts', params] as const,
  online: () => [...USERS_QUERY_KEYS.all, 'online'] as const,
  profile: (id: string) => [...USERS_QUERY_KEYS.all, 'profile', id] as const,
};

// Servicios API
const usersService = {
  getContacts: async (params?: ContactSearchParams): Promise<ContactsResponse> => {
    const { data } = await apiClient.get('/users/contacts', { params });
    return data.data; // Extraer data del ApiResponse
  },

  getOnlineUsers: async (): Promise<User[]> => {
    const { data } = await apiClient.get('/users/online');
    return data.data; // Extraer data del ApiResponse
  },

  updateProfile: async (profileData: UpdateProfileData): Promise<User> => {
    const { data } = await apiClient.put('/users/profile', profileData);
    return data.data; // Extraer data del ApiResponse
  },

  updateAvatar: async (avatarData: UpdateAvatarData): Promise<User> => {
    const { data } = await apiClient.put('/users/avatar', avatarData);
    return data.data; // Extraer data del ApiResponse
  },

  createUser: async (userData: CreateUserData): Promise<User> => {
    const { data } = await apiClient.post('/users/create', userData);
    return data.data; // Extraer data del ApiResponse
  },
};

// Hooks
export const useContacts = (params?: ContactSearchParams) => {
  return useAxiosQuery({
    queryKey: USERS_QUERY_KEYS.contacts(params),
    queryFn: () => usersService.getContacts(params),
    staleTime: 60000, // 1 minuto
  });
};

export const useOnlineUsers = () => {
  return useAxiosQuery({
    queryKey: USERS_QUERY_KEYS.online(),
    queryFn: () => usersService.getOnlineUsers(),
    staleTime: 30000, // 30 segundos
  });
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  
  return useAxiosMutation({
    mutationFn: (data: UpdateProfileData) => 
      usersService.updateProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEYS.all });
    },
  });
};

export const useUpdateAvatar = () => {
  const queryClient = useQueryClient();
  
  return useAxiosMutation({
    mutationFn: (data: UpdateAvatarData) => usersService.updateAvatar(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEYS.all });
    },
  });
};

export const useCreateUser = () => {
  const queryClient = useQueryClient();
  
  return useAxiosMutation({
    mutationFn: (data: CreateUserData) => usersService.createUser(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEYS.contacts() });
      queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEYS.all });
    },
  });
};

// Exportar el servicio para compatibilidad
export { usersService };

// Re-exportar tipos
export type { User, ContactSearchParams };