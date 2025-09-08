import axios, { AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '../store/auth.store';
import { useUIStore } from '../store/uiStore';

// Extend AxiosRequestConfig to include custom metadata
interface CustomAxiosRequestConfig extends AxiosRequestConfig {
  metadata?: {
    background?: boolean;
  };
}

// Extend InternalAxiosRequestConfig for interceptors
interface CustomInternalAxiosRequestConfig extends InternalAxiosRequestConfig {
  metadata?: {
    background?: boolean;
  };
}

// Función para determinar la URL base de la API
const getApiBaseURL = () => {
  // Si hay una variable de entorno definida, usarla
  const envUrl = (import.meta as any).env?.VITE_API_URL;
  if (envUrl) {
    return envUrl;
  }
  
  // En Docker, nginx hace proxy de /api/ a api-service:3000
  // En desarrollo local, usar localhost directamente
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    // Si estamos en desarrollo local (no en Docker), usar localhost
    return 'http://localhost:3001/api';
  }
  
  // En Docker, usar /api/ que nginx redirige a api-service:3000
  return '/api';
};

// Create axios instance with base configuration
const apiClient = axios.create({
  baseURL: getApiBaseURL(),
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token and handle loading
apiClient.interceptors.request.use(
  (config: CustomInternalAxiosRequestConfig) => {
    // Get token from Zustand auth store
    const token = useAuthStore.getState().token;
    
    // Si hay token en auth.store -> headers.Authorization = `Bearer ${token}`
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Set global loading state for non-background requests
    if (!config.metadata?.background) {
      useUIStore.getState().setGlobalLoading(true, 'Cargando...');
    }
    
    // Log request for debugging (only in development)
    
    return config;
  },
  (error) => {
    // Clear loading state on request error
    useUIStore.getState().setGlobalLoading(false);
    
    console.error('❌ Request Error:', error);
    useUIStore.getState().showError('Error al preparar la solicitud');
    
    return Promise.reject(error);
  }
);

// Response interceptor for error handling and state management
apiClient.interceptors.response.use(
  (response) => {
    // Clear loading state on successful response
    if (!(response.config as CustomInternalAxiosRequestConfig).metadata?.background) {
      useUIStore.getState().setGlobalLoading(false);
    }
    
    
    return response;
  },
  async (error) => {
    // Clear loading state on error
    useUIStore.getState().setGlobalLoading(false);
    
    console.error('❌ Response Error:', error);
    
    // Handle different error scenarios
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;
      const errorMessage = data?.error?.message || data?.message || 'Error desconocido';
      
      switch (status) {
        case 401:
          // Si 401 -> clearAuth() y redirigir a /login
          useAuthStore.getState().clearAuth();
          
          // Solo mostrar toast de sesión expirada si NO estamos en la página de login
          if (window.location.pathname !== '/login') {
           
            window.location.href = '/login';
          }
          // Si estamos en login, no mostrar toast - el componente LoginPage manejará el error
          break;
          
        case 403:
          // Forbidden
          useUIStore.getState().showError('No tienes permisos para realizar esta acción.');
          break;
          
        case 404:
          // Not found
          useUIStore.getState().showError('Recurso no encontrado.');
          break;
          
        case 422:
          // Validation error
          useUIStore.getState().showError(`Error de validación: ${errorMessage}`);
          break;
          
        case 413:
          // Request entity too large
          useUIStore.getState().showError('La imagen es demasiado grande. Por favor, selecciona una imagen menor a 5MB.');
          break;
          
        case 429:
          // Too many requests
          useUIStore.getState().showError('Demasiadas solicitudes. Intenta nuevamente en unos momentos.');
          break;
          
        case 500:
          // Server error
          useUIStore.getState().showError('Error interno del servidor. Intenta nuevamente.');
          break;
          
        default:
          useUIStore.getState().showError(`Error ${status}: ${errorMessage}`);
      }
    } else if (error.request) {
      // Network error
      useUIStore.getState().showError('Error de conexión. Verifica tu conexión a internet.');
    } else {
      // Request setup error
      useUIStore.getState().showError(`Error de configuración: ${error.message}`);
    }
    
    return Promise.reject(error);
  }
);

// Utility functions for API calls with Zustand integration
export const apiUtils = {
  // Make a request without showing global loading
  backgroundRequest: (config: CustomAxiosRequestConfig) => {
    const requestConfig = {
      ...config,
      metadata: { background: true }
    } as CustomInternalAxiosRequestConfig;
    return apiClient(requestConfig);
  },
  
  // Make a request with custom loading message
  requestWithMessage: (config: CustomAxiosRequestConfig, message = 'Procesando...') => {
    useUIStore.getState().setGlobalLoading(true, message);
    return apiClient(config);
  },
  
  // Upload file with progress
  uploadFile: (url: string, file: File, onProgress?: (progress: number) => void) => {
    const formData = new FormData();
    formData.append('file', file);
    
    return apiClient.post(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        }
      },
      metadata: { background: true } // Don't show global loading for uploads
    } as CustomInternalAxiosRequestConfig);
  },
  
  // Download file
  downloadFile: async (url: string, filename: string) => {
    try {
      const response = await apiClient.get(url, {
        responseType: 'blob',
        metadata: { background: true }
      } as CustomInternalAxiosRequestConfig);
      
      const blob = new Blob([response.data]);
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
      
      useUIStore.getState().showSuccess('Archivo descargado correctamente');
    } catch (error) {
      useUIStore.getState().showError('Error al descargar el archivo');
      throw error;
    }
  }
};

// Hook for using API client with Zustand stores
export const useApiClient = () => {
  const showSuccess = useUIStore(state => state.showSuccess);
  const showError = useUIStore(state => state.showError);
  const setGlobalLoading = useUIStore(state => state.setGlobalLoading);
  
  return {
    apiClient,
    apiUtils,
    showSuccess,
    showError,
    setGlobalLoading
  };
};

export { apiClient };
export default apiClient;