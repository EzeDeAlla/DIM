import { Container } from 'inversify';
import { TYPES } from '../types/container.types';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthRepository } from './auth.repository';

export const authModule = (container: Container) => {
  // No necesitamos bindear el controller ya que usamos container.get()
  container.bind(TYPES.AuthService).to(AuthService);
  container.bind(TYPES.AuthRepository).to(AuthRepository);
};