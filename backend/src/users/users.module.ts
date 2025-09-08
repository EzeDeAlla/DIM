import { Container } from 'inversify';
import { TYPES } from '../types/container.types';
import { UserController } from './users.controller';
import { UserService } from './users.service';
import { UserRepository } from './users.repository';

export const usersModule = (container: Container) => {
  // No necesitamos bindear el controller ya que usamos container.get()
  container.bind(TYPES.UserService).to(UserService);
  container.bind(TYPES.UserRepository).to(UserRepository);
};