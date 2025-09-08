import { useAuthStore } from '../store/auth.store';

export const useAuth = () => {
  const store = useAuthStore();
  
  return {
    // Estado
    token: store.token,
    user: store.user,
    isAuthenticated: store.isAuthenticated,
    isLoading: store.isLoading,
    error: store.error,
    
    // Acciones
    login: store.login,
    logout: store.logout,
    setToken: store.setToken,
    setUser: store.setUser,
    clearAuth: store.clearAuth,
    verifyToken: store.verifyToken,
  };
};

// Hooks individuales para compatibilidad
export const useLogin = () => {
  const { login, isLoading, error } = useAuth();
  return {
    mutate: login,
    isLoading,
    error,
  };
};

export const useLogout = (options?: { onSuccess?: () => void; onError?: (error: any) => void }) => {
  const { logout, isLoading } = useAuth();
  return {
    mutate: logout,
    mutateAsync: async () => {
      try {
        await logout();
        options?.onSuccess?.();
      } catch (error) {
        options?.onError?.(error);
        throw error;
      }
    },
    isLoading,
  };
};