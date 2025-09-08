import { apiClient } from './axios.config';

// Tipo temporal para CreateUserByAdmin
interface CreateUserByAdmin {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  user_type: 'doctor' | 'admin' | 'administrador';
  specialty?: string;
  description?: string;
  is_active?: boolean;
}

// Tipo temporal para UsersListResponse
interface UsersListResponse {
  users: any[];
  total: number;
  page?: number;
  limit?: number;
}

export const usersApi = {
  // Crear usuario (solo administradores)
  createUser: async (userData: CreateUserByAdmin) => {
    // console.log('🚀 Enviando petición a /api/users/create');
    // console.log('📦 Datos del usuario:', userData);
    
    const response = await apiClient.post('/users/create', userData);
    return response.data;
  },

  // Obtener lista de usuarios
  getUsers: async (params?: {
    search?: string;
    user_type?: 'doctor' | 'admin' | 'administrador';
    limit?: number;
    offset?: number;
  }): Promise<UsersListResponse> => {
    const searchParams = new URLSearchParams();
    
    if (params?.search) searchParams.append('search', params.search);
    if (params?.user_type) searchParams.append('user_type', params.user_type);
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.offset) searchParams.append('offset', params.offset.toString());

    const response = await fetch(`/api/users?${searchParams.toString()}`);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Error al obtener usuarios');
    }

    return response.json();
  },

  // Obtener usuario por ID
  getUserById: async (id: string) => {
    const response = await fetch(`/api/users/${id}`);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Error al obtener usuario');
    }

    return response.json();
  },

  // Actualizar usuario
  updateUser: async (id: string, userData: Partial<CreateUserByAdmin>) => {
    const response = await fetch(`/api/users/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Error al actualizar usuario');
    }

    return response.json();
  },

  // Eliminar usuario
  deleteUser: async (id: string) => {
    const response = await fetch(`/api/users/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Error al eliminar usuario');
    }

    return response.json();
  },
};