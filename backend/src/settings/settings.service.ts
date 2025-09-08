import { inject, injectable } from "inversify";
import { TYPES } from "../types/container.types";
import { SettingsRepository } from "./settings.repository";
import { 
  APP_SETTINGS_KEYS, 
  AppSettingKey, 
  AppSettings, 
  DEFAULT_APP_SETTINGS, 
  AppSettingsSchema 
} from "../../../shared/schemas/settings.schema";

type Actor = { id?: string; user_type?: string };

function httpError(status: number, message: string) {
  const error = new Error(message) as any;
  error.status = status;
  return error;
}

@injectable()
export class SettingsService {
  constructor(@inject(TYPES.SettingsRepository) private readonly repo: SettingsRepository) {}

  async getAll(): Promise<AppSettings> {
    const stored = await this.repo.getAll();
    const merged = { ...DEFAULT_APP_SETTINGS, ...stored };
    const parsed = AppSettingsSchema.parse(merged);
    return parsed;
  }

  async update(key: AppSettingKey, rawValue: unknown, actor: Actor) {
    const isAdmin = actor?.user_type === "admin" || actor?.user_type === "administrador";
    if (!isAdmin) {
      throw httpError(403, "Forbidden");
    }

    // validar que la key exista
    const validator = APP_SETTINGS_KEYS[key];
    if (!validator) {
      throw httpError(400, `Unknown setting key: ${key}`);
    }

    const value = validator.parse(rawValue);
    await this.repo.upsert(key, value, actor?.id);
    
    return { key, value };
  }
}