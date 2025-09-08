import { Container } from 'inversify';
import { TYPES } from '../types/container.types';
import { ConversationsController } from './conversations.controller';
import { ConversationsService } from './conversations.service';
import { ConversationsRepository } from './conversations.repository';

export const conversationsModule = (container: Container) => {
  // No necesitamos bindear el controller ya que usamos container.get()
  container.bind(TYPES.ConversationsService).to(ConversationsService);
  container.bind(TYPES.ConversationsRepository).to(ConversationsRepository);
};