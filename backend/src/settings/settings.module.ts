import { ContainerModule } from "inversify";
import { TYPES } from "../types/container.types";
import { SettingsRepository } from "./settings.repository";
import { SettingsService } from "./settings.service";

export const settingsModule = new ContainerModule((bind) => {
  bind(TYPES.SettingsRepository).to(SettingsRepository);
  bind(TYPES.SettingsService).to(SettingsService);
});