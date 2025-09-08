import { create } from 'zustand';

type ConfigState = {
  isDevelopment: () => boolean;
};

export const useConfigStore = create<ConfigState>()(() => ({
  isDevelopment: () => true, // Simplificado para desarrollo
}));