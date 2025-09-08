import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Crear enum para tipos de mensaje
  await knex.raw("CREATE TYPE message_type_enum AS ENUM ('text', 'image', 'file')");

  // Crear tabla messages
  await knex.schema.createTable('messages', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('conversation_id').notNullable().references('id').inTable('conversations').onDelete('CASCADE');
    table.uuid('sender_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.text('content').notNullable();
    table.specificType('message_type', 'message_type_enum').notNullable().defaultTo('text');
    table.boolean('is_edited').notNullable().defaultTo(false);
    table.timestamp('deleted_at', { useTz: true });
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
  });

  // Crear trigger para updated_at en messages
  await knex.raw(`
    CREATE TRIGGER update_messages_updated_at
        BEFORE UPDATE ON messages
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
  `);

  // Crear índices para messages (optimizados para consultas de chat)
  await knex.schema.alterTable('messages', (table) => {
    table.index(['conversation_id', 'created_at'], 'idx_messages_conversation_created_at');
    table.index('sender_id', 'idx_messages_sender_id');
    table.index(['created_at'], 'idx_messages_created_at');
  });

  // Crear índice parcial para mensajes no eliminados
  await knex.raw(`
    CREATE INDEX idx_messages_not_deleted 
    ON messages(conversation_id, created_at DESC) 
    WHERE deleted_at IS NULL
  `);

  // Crear índice para búsqueda rápida de mensajes no leídos por usuario
  await knex.raw(`
    CREATE INDEX idx_unread_messages_by_user 
    ON messages(sender_id, created_at DESC) 
    WHERE deleted_at IS NULL
  `);

  // Crear índice GIN para búsqueda en contenido de mensajes
  await knex.raw(`
    CREATE INDEX idx_messages_content_search 
    ON messages USING gin(to_tsvector('spanish', content))
    WHERE deleted_at IS NULL
  `);
}

export async function down(knex: Knex): Promise<void> {
  // Eliminar índices
  await knex.raw('DROP INDEX IF EXISTS idx_messages_content_search');
  await knex.raw('DROP INDEX IF EXISTS idx_unread_messages_by_user');
  await knex.raw('DROP INDEX IF EXISTS idx_messages_not_deleted');
  
  await knex.schema.alterTable('messages', (table) => {
    table.dropIndex(['conversation_id', 'created_at'], 'idx_messages_conversation_created_at');
    table.dropIndex('sender_id', 'idx_messages_sender_id');
    table.dropIndex(['created_at'], 'idx_messages_created_at');
  });

  // Eliminar trigger
  await knex.raw('DROP TRIGGER IF EXISTS update_messages_updated_at ON messages');

  // Eliminar tabla
  await knex.schema.dropTableIfExists('messages');

  // Eliminar enum
  await knex.raw('DROP TYPE IF EXISTS message_type_enum');
}