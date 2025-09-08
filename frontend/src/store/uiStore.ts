import { create } from 'zustand';
import { toast } from 'react-hot-toast';

type UIState = {
  isGlobalLoading: boolean;
  globalLoadingMessage: string;
  setGlobalLoading: (loading: boolean, message?: string) => void;
  showError: (message: string) => void;
  showSuccess: (message: string) => void;
};

export const useUIStore = create<UIState>()((set) => ({
  isGlobalLoading: false,
  globalLoadingMessage: '',
  setGlobalLoading: (loading: boolean, message = '') => 
    set({ isGlobalLoading: loading, globalLoadingMessage: message }),
  showError: (message: string) => {
    console.error('Error:', message);
    toast.error(message);
  },
  showSuccess: (message: string) => {
    console.log('Success:', message);
    toast.success(message);
  },
}));