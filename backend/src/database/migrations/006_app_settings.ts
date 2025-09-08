import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Crear tabla app_settings
  await knex.schema.createTable('app_settings', (table) => {
    table.text('key').primary();
    table.jsonb('value').notNullable();
    table.text('description');
    table.uuid('updated_by').references('id').inTable('users').onDelete('SET NULL');
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
  });

  // Crear trigger para updated_at en app_settings
  await knex.raw(`
    CREATE TRIGGER update_app_settings_updated_at
        BEFORE UPDATE ON app_settings
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
  `);

  // Crear índices para app_settings
  await knex.schema.alterTable('app_settings', (table) => {
    table.index('updated_by', 'idx_app_settings_updated_by');
    table.index(['updated_at'], 'idx_app_settings_updated_at');
  });

  // Insertar configuraciones por defecto
  await knex('app_settings').insert([
    {
      key: 'max_file_size_mb',
      value: JSON.stringify(10),
      description: 'Tamaño máximo de archivo en MB'
    },
    {
      key: 'allowed_file_types',
      value: JSON.stringify(["jpg", "jpeg", "png", "pdf", "doc", "docx"]),
      description: 'Tipos de archivo permitidos'
    },
    {
      key: 'chat_retention_days',
      value: JSON.stringify(365),
      description: 'Días de retención de mensajes'
    },
    {
      key: 'max_group_participants',
      value: JSON.stringify(50),
      description: 'Máximo de participantes en grupos'
    }
  ]).onConflict('key').ignore();
}

export async function down(knex: Knex): Promise<void> {
  // Eliminar índices
  await knex.schema.alterTable('app_settings', (table) => {
    table.dropIndex('updated_by', 'idx_app_settings_updated_by');
    table.dropIndex(['updated_at'], 'idx_app_settings_updated_at');
  });

  // Eliminar trigger
  await knex.raw('DROP TRIGGER IF EXISTS update_app_settings_updated_at ON app_settings');

  // Eliminar tabla
  await knex.schema.dropTableIfExists('app_settings');
}