// Interfaces para el dominio de Settings
import { ApiResponse } from './common';

// Tipo base de configuración (coherente con tabla app_settings)
export interface AppSetting {
  id: string;
  key: string;
  value: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

// Datos para crear configuración
export interface CreateAppSetting {
  key: string;
  value: string;
  description?: string;
}

// Datos para actualizar configuración
export interface UpdateAppSetting {
  value: string;
  description?: string;
}

// Respuesta de configuraciones
export interface SettingsResponse {
  settings: Record<string, string>;
}

// Respuesta de configuración individual
export interface SettingResponse {
  key: string;
  value: string;
  description: string | null;
}

// Request para actualizar configuración
export interface UpdateSettingRequest {
  value: string;
  description?: string;
}

// Parámetros de búsqueda de configuraciones
export interface SettingSearchParams {
  search?: string;
  limit?: number;
  offset?: number;
}

// Repository interface
export interface ISettingsRepository {
  findSettingByKey(key: string): Promise<AppSetting | null>;
  findAllSettings(): Promise<AppSetting[]>;
  createSetting(data: CreateAppSetting): Promise<AppSetting>;
  updateSetting(key: string, data: UpdateAppSetting): Promise<AppSetting | null>;
  deleteSetting(key: string): Promise<boolean>;
}