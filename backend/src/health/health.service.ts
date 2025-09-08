import { injectable, inject } from 'inversify';
import { Knex } from 'knex';
import { HealthCheck } from '../../../shared/schemas';
import { TYPES } from '../types/container.types';

@injectable()
export class HealthService {
  constructor(
    @inject(TYPES.knexType) private readonly knex: Knex
  ) {}

  async getHealthStatus(): Promise<HealthCheck> {
    try {
      // Verificar conexión a la base de datos con una consulta simple
      await this.knex.raw('SELECT 1');
      
      return {
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: process.env.npm_package_version || '1.0.0'
      };
    } catch (error) {
      // Si falla la conexión a la DB, lanzar error para que el controller maneje el 500
      throw new Error(`Database connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}