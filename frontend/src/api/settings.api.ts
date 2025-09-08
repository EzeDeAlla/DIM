import { apiClient } from "./axios.config";

export const getSettings = () => apiClient.get("/settings");

export const updateSetting = (key: string, value: unknown) => 
  apiClient.put(`/settings/${encodeURIComponent(key)}`, { value });
