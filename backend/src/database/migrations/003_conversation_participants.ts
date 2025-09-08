import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Crear enum para roles de participantes
  await knex.raw("CREATE TYPE participant_role_enum AS ENUM ('member', 'owner', 'admin')");

  // Crear tabla conversation_participants
  await knex.schema.createTable('conversation_participants', (table) => {
    table.uuid('conversation_id').notNullable().references('id').inTable('conversations').onDelete('CASCADE');
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.specificType('role', 'participant_role_enum').notNullable().defaultTo('member');
    table.timestamp('joined_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp('left_at', { useTz: true });
    table.primary(['conversation_id', 'user_id']);
  });

  // Crear índices para conversation_participants
  await knex.schema.alterTable('conversation_participants', (table) => {
    table.index('user_id', 'idx_conversation_participants_user_id');
    table.index('conversation_id', 'idx_conversation_participants_conversation_id');
    table.index(['joined_at'], 'idx_conversation_participants_joined_at');
  });

  // Crear índice parcial para participantes activos
  await knex.raw(`
    CREATE INDEX idx_conversation_participants_active 
    ON conversation_participants(conversation_id, user_id) 
    WHERE left_at IS NULL
  `);
}

export async function down(knex: Knex): Promise<void> {
  // Eliminar índices
  await knex.raw('DROP INDEX IF EXISTS idx_conversation_participants_active');
  
  await knex.schema.alterTable('conversation_participants', (table) => {
    table.dropIndex('user_id', 'idx_conversation_participants_user_id');
    table.dropIndex('conversation_id', 'idx_conversation_participants_conversation_id');
    table.dropIndex(['joined_at'], 'idx_conversation_participants_joined_at');
  });

  // Eliminar tabla
  await knex.schema.dropTableIfExists('conversation_participants');

  // Eliminar enum
  await knex.raw('DROP TYPE IF EXISTS participant_role_enum');
}