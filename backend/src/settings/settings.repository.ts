import { inject, injectable } from "inversify";
import type { Knex } from "knex";
import { TYPES } from "../types/container.types";

@injectable()
export class SettingsRepository {
  constructor(@inject(TYPES.knexType) private readonly knex: Knex) {}

  async getAll(): Promise<Record<string, unknown>> {
    const rows = await this.knex("app_settings").select("key", "value");
    const out: Record<string, unknown> = {};
    rows.forEach((r) => {
      // Si el valor es un string que parece JSON, parsearlo
      if (typeof r.value === 'string' && (r.value.startsWith('{') || r.value.startsWith('[') || r.value === 'true' || r.value === 'false' || !isNaN(Number(r.value)))) {
        try {
          out[r.key] = JSON.parse(r.value);
        } catch {
          out[r.key] = r.value;
        }
      } else {
        out[r.key] = r.value;
      }
    });
    return out;
  }

  async upsert(key: string, value: unknown, userId?: string) {
    // Serializar el valor como JSON para consistencia
    const serializedValue = JSON.stringify(value);
    await this.knex("app_settings")
      .insert({ key, value: serializedValue, updated_by: userId })
      .onConflict("key")
      .merge({ value: serializedValue, updated_by: userId, updated_at: this.knex.fn.now() });
  }
}