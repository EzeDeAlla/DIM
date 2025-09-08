// Exportar todos los stores desde un punto central
export { useAuthStore } from './auth.store';
export { useConfigStore } from './configStore';
export { useUIStore } from './uiStore';

// Exportar useNotifications como función separada para evitar importación circular
import { useUIStore } from './uiStore';

export const useNotifications = () => {
  const { showSuccess, showError } = useUIStore();
  return { showSuccess, showError };
};
