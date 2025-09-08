import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Crear tabla message_reads
  await knex.schema.createTable('message_reads', (table) => {
    table.uuid('message_id').notNullable().references('id').inTable('messages').onDelete('CASCADE');
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.timestamp('read_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.primary(['message_id', 'user_id']);
  });

  // Crear índices para message_reads (optimizados para conteo de no leídos)
  await knex.schema.alterTable('message_reads', (table) => {
    table.index('user_id', 'idx_message_reads_user_id');
    table.index('message_id', 'idx_message_reads_message_id');
    table.index(['read_at'], 'idx_message_reads_read_at');
  });
}

export async function down(knex: Knex): Promise<void> {
  // Eliminar índices
  await knex.schema.alterTable('message_reads', (table) => {
    table.dropIndex('user_id', 'idx_message_reads_user_id');
    table.dropIndex('message_id', 'idx_message_reads_message_id');
    table.dropIndex(['read_at'], 'idx_message_reads_read_at');
  });

  // Eliminar tabla
  await knex.schema.dropTableIfExists('message_reads');
}