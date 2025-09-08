import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Habilitar extensiones necesarias
  await knex.raw('CREATE EXTENSION IF NOT EXISTS "pgcrypto"'); // Para gen_random_uuid()
  await knex.raw('CREATE EXTENSION IF NOT EXISTS "citext"');   // Para email case-insensitive
}

export async function down(knex: Knex): Promise<void> {
  // Eliminar extensiones (cuidado: puede afectar otras tablas)
  await knex.raw('DROP EXTENSION IF EXISTS "citext"');
  await knex.raw('DROP EXTENSION IF EXISTS "pgcrypto"');
}