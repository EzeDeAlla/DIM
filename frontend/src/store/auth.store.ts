import { create } from 'zustand';
import { persist, PersistOptions } from 'zustand/middleware';
import { AuthState } from '../interfaces/auth.interfaces';
import { authApi } from '../api/auth.api';

type AuthPersist = {
  token: string | null;
  user: unknown;
};

type AuthStore = AuthState & {
  _hasHydrated: boolean;
};

// Generar un ID único por ventana/pestaña
const getStorageKey = () => {
  if (typeof window === 'undefined') return 'auth-storage';
  
  // Obtener o crear un ID único para esta ventana/pestaña
  let tabId = sessionStorage.getItem('tab-id');
  if (!tabId) {
    tabId = `tab-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('tab-id', tabId);
  }
  
  return `auth-storage-${tabId}`;
};

const persistOptions: PersistOptions<AuthStore, AuthPersist> = {

  name: getStorageKey(), // usar un nombre único por ventana/pestaña
  partialize: (state) => ({ token: state.token, user: state.user }), // solo persistir token y user
  onRehydrateStorage: () => (state) => {
    // Cuando se restaura el estado desde localStorage, actualizar isAuthenticated basado en el token
    if (state && state.token) {
      state.isAuthenticated = true;
    }
    // Marcar que la hidratación está completa
    if (state) {
      state._hasHydrated = true;
    }
  },
};

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      _hasHydrated: false,

      // Login action
      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authApi.login({ email, password });
          
          
          // Verificar la estructura de la respuesta
          if (!response.data || !response.data.success) {
            throw new Error('Respuesta del servidor inválida');
          }
          
          const { token, user } = response.data.data;
          
          
          // Guardar token y datos del usuario
          set({
            token,
            user,
            isAuthenticated: true,
            isLoading: false,
          });
          
          return response.data;
        } catch (error: any) {
          console.error('❌ Error en login:', error);
          console.error('📄 Respuesta de error:', error.response?.data);
          
          const errorMessage = error.response?.data?.error?.message || error.message || 'Error al iniciar sesión';
          
          set({
            isLoading: false,
            error: errorMessage,
          });
          throw error;
        }
      },

      // Logout action
      logout: async () => {
        set({ isLoading: true });
        try {
          await authApi.logout();
          set({
            token: null,
            user: null,
            isAuthenticated: false,
            isLoading: false,
          });
        } catch (error) {
          set({ isLoading: false });
          // Incluso si falla el logout en el servidor, limpiamos la sesión local
          set({
            token: null,
            user: null,
            isAuthenticated: false,
          });
        }
      },

      // Set token
      setToken: (token: string) => {
        set({ token, isAuthenticated: !!token });
      },

      // Set user
      setUser: (user) => {
        set({ user });
      },

      // Clear auth state
      clearAuth: () => {
        set({
          token: null,
          user: null,
          isAuthenticated: false,
          error: null,
        });
      },

      // Verificar token al inicializar la aplicación
      verifyToken: async () => {
        const state = useAuthStore.getState();
        if (!state.token) return;
        
        try {
          set({ isLoading: true });
          const response = await authApi.profile();
          
          if (response.data && response.data.success) {
            // Token válido, mantener autenticación
            set({ 
              isAuthenticated: true,
              isLoading: false,
              error: null 
            });
          } else {
            // Respuesta inválida, limpiar estado
            set({
              token: null,
              user: null,
              isAuthenticated: false,
              isLoading: false,
              error: null,
            });
          }
        } catch (error) {
          // Token inválido o expirado, limpiar estado
          set({
            token: null,
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });
        }
      },
    }),
    persistOptions
  )
);