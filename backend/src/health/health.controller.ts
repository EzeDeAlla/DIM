import { Request, Response } from 'express';
import { injectable, inject } from 'inversify';
import { TYPES } from '../types/container.types';
import { HealthService } from './health.service';
import { HealthCheckSchema } from '../../../shared/schemas';

@injectable()
export class HealthController {
  constructor(
    @inject(TYPES.HealthService) private healthService: HealthService
  ) {}

  async getHealth(req: Request, res: Response): Promise<void> {
    try {
      const healthStatus = await this.healthService.getHealthStatus();
      // Si la verificación es exitosa, devolver el resultado usando el schema de Zod
      const validatedStatus = HealthCheckSchema.parse(healthStatus);
      res.status(200).json(validatedStatus);
    } catch (error) {
      // Si falla la conexión a la DB, devolver 500 con {status: "ERROR"} usando el schema de Zod
      const errorStatus = HealthCheckSchema.parse({
        status: 'ERROR',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: process.env.npm_package_version || '1.0.0'
      });
      res.status(500).json(errorStatus);
    }
  }
}