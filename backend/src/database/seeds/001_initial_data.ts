import { Knex } from 'knex';
import bcrypt from 'bcryptjs';

export async function seed(knex: Knex): Promise<void> {
  // Limpiar datos existentes en orden correcto (respetando foreign keys)
  await knex('message_reads').del();
  await knex('messages').del();
  await knex('conversation_participants').del();
  await knex('conversations').del();
  await knex('users').del();
  
  // Limpiar configuraciones específicas (mantener las por defecto)
  await knex('app_settings').where('key', 'max_attachment_size_mb').del();

  // Hash de la contraseña 'Password123!'
  const passwordHash = await bcrypt.hash('Password123!', 10);

  // Insertar usuarios
  const [doctorUser, adminUser, adminUser2, administradorUser] = await knex('users')
    .insert([
      {
        id: '550e8400-e29b-41d4-a716-446655440001',
        email: 'doctor@medichat.com',
        password_hash: passwordHash,
        first_name: 'Dr. María',
        last_name: 'González',
        description: 'Médica especialista en medicina interna con 10 años de experiencia.',
        specialty: 'Medicina Interna',
        avatar_url: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400',
        user_type: 'doctor',
        is_active: true,
        last_online_at: knex.fn.now()
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440002',
        email: 'admin@medichat.com',
        password_hash: passwordHash,
        first_name: 'Carlos',
        last_name: 'Rodríguez',
        description: 'Administrador del sistema de chat médico.',
        specialty: null,
        avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400',
        user_type: 'admin',
        is_active: true,
        last_online_at: knex.fn.now()
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440003',
        email: 'administrador@medichat.com',
        password_hash: passwordHash,
        first_name: 'Ana',
        last_name: 'Martínez',
        description: 'Administrador principal del sistema con permisos completos.',
        specialty: null,
        avatar_url: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400',
        user_type: 'admin',
        is_active: true,
        last_online_at: knex.fn.now()
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440004',
        email: 'superadmin@medichat.com',
        password_hash: passwordHash,
        first_name: 'Luis',
        last_name: 'Fernández',
        description: 'Super administrador del sistema con permisos completos para crear usuarios.',
        specialty: null,
        avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
        user_type: 'administrador',
        is_active: true,
        last_online_at: knex.fn.now()
      }
    ])
    .returning('*');

  // Insertar conversación 1-1
  const [conversation] = await knex('conversations')
    .insert({
      id: '660e8400-e29b-41d4-a716-446655440001',
      is_group: false,
      title: null, // Las conversaciones 1-1 no tienen título
      created_by: doctorUser.id
    })
    .returning('*');

  // Insertar participantes de la conversación
  await knex('conversation_participants').insert([
    {
      conversation_id: conversation.id,
      user_id: doctorUser.id,
      joined_at: knex.fn.now()
    },
    {
      conversation_id: conversation.id,
      user_id: adminUser.id,
      joined_at: knex.fn.now()
    }
  ]);

  // Insertar mensajes
  const messages = await knex('messages')
    .insert([
      {
        id: '770e8400-e29b-41d4-a716-446655440001',
        conversation_id: conversation.id,
        sender_id: doctorUser.id,
        content: '¡Hola Carlos! ¿Cómo está funcionando el nuevo sistema de chat médico?',
        message_type: 'text',
        is_edited: false,
        created_at: knex.raw("NOW() - INTERVAL '5 minutes'")
      },
      {
        id: '770e8400-e29b-41d4-a716-446655440002',
        conversation_id: conversation.id,
        sender_id: adminUser.id,
        content: '¡Hola Dra. González! El sistema está funcionando perfectamente. Los médicos están muy contentos con la nueva interfaz.',
        message_type: 'text',
        is_edited: false,
        created_at: knex.raw("NOW() - INTERVAL '2 minutes'")
      }
    ])
    .returning('*');

  // Marcar mensajes como leídos por ambos usuarios
  await knex('message_reads').insert([
    {
      message_id: messages[0].id,
      user_id: adminUser.id,
      read_at: knex.fn.now()
    },
    {
      message_id: messages[1].id,
      user_id: doctorUser.id,
      read_at: knex.fn.now()
    }
  ]);

  // Insertar configuración adicional
  await knex('app_settings')
    .insert({
      key: 'max_attachment_size_mb',
      value: JSON.stringify(16),
      description: 'Tamaño máximo de archivos adjuntos en MB'
    })
    .onConflict('key')
    .merge();

  console.log('✅ Seeds ejecutados correctamente:');
  console.log('   - 4 usuarios creados (1 doctor, 2 admin, 1 administrador)');
  console.log('   - 1 conversación 1-1 con 2 mensajes');
  console.log('   - 1 configuración adicional');
}