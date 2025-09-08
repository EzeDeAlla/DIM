import { Container } from 'inversify';
import { TYPES } from '../types/container.types';
import { MessagesController } from './messages.controller';
import { MessagesService } from './messages.service';
import { MessagesRepository } from './messages.repository';
import { MessageEventsPublisher } from './message-events.publisher';

export const messagesModule = (container: Container) => {
  // No necesitamos bindear el controller ya que usamos container.get()
  container.bind(TYPES.MessagesService).to(MessagesService);
  container.bind(TYPES.MessagesRepository).to(MessagesRepository);
  container.bind(TYPES.MessageEventsPublisher).to(MessageEventsPublisher);
};