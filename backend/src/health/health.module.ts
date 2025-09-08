import { Container } from 'inversify';
import { TYPES } from '../types/container.types';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';

export const healthModule = (container: Container) => {
  container.bind(TYPES.HealthController).to(HealthController);
  container.bind(TYPES.HealthService).to(HealthService);
};