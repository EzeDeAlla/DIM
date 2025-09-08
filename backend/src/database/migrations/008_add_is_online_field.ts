import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Agregar campo is_online para manejar el estado de conexión
  await knex.schema.alterTable('users', (table) => {
    table.boolean('is_online').notNullable().defaultTo(false);
  });

  // Crear índice para is_online
  await knex.schema.alterTable('users', (table) => {
    table.index('is_online', 'idx_users_is_online');
  });
}

export async function down(knex: Knex): Promise<void> {
  // Eliminar índice y campo
  await knex.schema.alterTable('users', (table) => {
    table.dropIndex(['is_online'], 'idx_users_is_online');
    table.dropColumn('is_online');
  });
}
