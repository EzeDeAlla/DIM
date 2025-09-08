import { Request, Response } from "express";
import { container } from "../config/inversify.config";
import { TYPES } from "../types/container.types";
import { SettingsService } from "./settings.service";
import { AppSettingKey } from "../../../shared/schemas/settings.schema";

export class SettingsController {
  private service: SettingsService;

  constructor() {
    this.service = container.get<SettingsService>(TYPES.SettingsService);
  }

  getAll = async (_req: Request, res: Response) => {
    const data = await this.service.getAll();
    res.json({ success: true, data });
  };

  update = async (req: Request, res: Response) => {
    const key = req.params.key as AppSettingKey;
    const value = req.body?.value;
    const actor = (req as any).user || {}; // asumimos middleware de auth
    const data = await this.service.update(key, value, actor);
    res.json({ success: true, data });
  };
}