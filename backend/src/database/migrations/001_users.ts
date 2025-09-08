import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Crear enum para tipos de usuario
  await knex.raw("CREATE TYPE user_type_enum AS ENUM ('doctor', 'admin', 'administrador')");

  // Crear función para actualizar updated_at automáticamente
  await knex.raw(`
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
    END;
    $$ language 'plpgsql';
  `);

  // Crear tabla users
  await knex.schema.createTable('users', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.specificType('email', 'CITEXT').unique().notNullable();
    table.string('password_hash', 255).notNullable();
    table.string('first_name', 100).notNullable();
    table.string('last_name', 100).notNullable();
    table.text('description');
    table.string('specialty', 100);
    table.string('avatar_url', 500);
    table.specificType('user_type', 'user_type_enum').notNullable().defaultTo('doctor');
    table.boolean('is_active').notNullable().defaultTo(true);
    table.timestamp('last_online_at', { useTz: true });
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
  });

  // Crear trigger para updated_at en users
  await knex.raw(`
    CREATE TRIGGER update_users_updated_at
        BEFORE UPDATE ON users
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
  `);

  // Crear índices para users
  await knex.schema.alterTable('users', (table) => {
    table.index('email', 'idx_users_email');
    table.index('user_type', 'idx_users_user_type');
    table.index('is_active', 'idx_users_is_active');
    table.index(['last_online_at'], 'idx_users_last_online_at');
  });
}

export async function down(knex: Knex): Promise<void> {
  // Eliminar índices
  await knex.schema.alterTable('users', (table) => {
    table.dropIndex('email', 'idx_users_email');
    table.dropIndex('user_type', 'idx_users_user_type');
    table.dropIndex('is_active', 'idx_users_is_active');
    table.dropIndex(['last_online_at'], 'idx_users_last_online_at');
  });

  // Eliminar trigger
  await knex.raw('DROP TRIGGER IF EXISTS update_users_updated_at ON users');

  // Eliminar tabla
  await knex.schema.dropTableIfExists('users');

  // Eliminar función y enum
  await knex.raw('DROP FUNCTION IF EXISTS update_updated_at_column()');
  await knex.raw('DROP TYPE IF EXISTS user_type_enum');
}