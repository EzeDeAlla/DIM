import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Crear tabla conversations
  await knex.schema.createTable('conversations', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.boolean('is_group').notNullable().defaultTo(false);
    table.string('title', 255);
    table.uuid('created_by').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
  });

  // Crear trigger para updated_at en conversations
  await knex.raw(`
    CREATE TRIGGER update_conversations_updated_at
        BEFORE UPDATE ON conversations
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
  `);

  // Crear índices para conversations
  await knex.schema.alterTable('conversations', (table) => {
    table.index('created_by', 'idx_conversations_created_by');
    table.index('is_group', 'idx_conversations_is_group');
    table.index(['created_at'], 'idx_conversations_created_at');
  });
}

export async function down(knex: Knex): Promise<void> {
  // Eliminar índices
  await knex.schema.alterTable('conversations', (table) => {
    table.dropIndex('created_by', 'idx_conversations_created_by');
    table.dropIndex('is_group', 'idx_conversations_is_group');
    table.dropIndex(['created_at'], 'idx_conversations_created_at');
  });

  // Eliminar trigger
  await knex.raw('DROP TRIGGER IF EXISTS update_conversations_updated_at ON conversations');

  // Eliminar tabla
  await knex.schema.dropTableIfExists('conversations');
}