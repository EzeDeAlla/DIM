import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Actualizar configuraciones existentes y agregar las nuevas
  await knex('app_settings').insert([
    {
      key: 'read_receipts_enabled',
      value: JSON.stringify(true),
      description: 'Habilitar recibos de lectura'
    },
    {
      key: 'avatar_max_size_mb',
      value: JSON.stringify(5),
      description: 'Tamaño máximo de avatar en MB'
    },
    {
      key: 'allowed_avatar_mime_types',
      value: JSON.stringify(["image/jpeg", "image/png", "image/webp"]),
      description: 'Tipos MIME permitidos para avatares'
    }
  ]).onConflict('key').merge(['value', 'description', 'updated_at']);
}

export async function down(knex: Knex): Promise<void> {
  // Eliminar las configuraciones específicas que agregamos
  await knex('app_settings').whereIn('key', [
    'read_receipts_enabled',
    'avatar_max_size_mb',
    'allowed_avatar_mime_types'
  ]).del();
}
