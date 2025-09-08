import { Container } from 'inversify';
import { TYPES } from '../types/container.types';
import { createKnex } from './database';

export const databaseModule = (container: Container) => {
  // Crear instancia de Knex y bindearla al contenedor
  const knexInstance = createKnex();
  container.bind(TYPES.knexType).toConstantValue(knexInstance);
};