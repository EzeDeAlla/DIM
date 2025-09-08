import { Container } from 'inversify';
import { TYPES } from '../types/container.types';
import { FileService } from './file.service';

export const fileModule = (container: Container) => {
  container.bind(TYPES.FileService).to(FileService);
};