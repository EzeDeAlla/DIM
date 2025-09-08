-- =====================================================
-- ESQUEMA POSTGRESQL PARA CHAT MÉDICO
-- =====================================================

-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "pgcrypto";  -- Para gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "citext";    -- Para email case-insensitive

-- =====================================================
-- TIPOS ENUM
-- =====================================================

CREATE TYPE user_type_enum AS ENUM ('doctor', 'admin');
CREATE TYPE participant_role_enum AS ENUM ('member', 'owner', 'admin');
CREATE TYPE message_type_enum AS ENUM ('text', 'image', 'file');

-- =====================================================
-- FUNCIÓN PARA ACTUALIZAR updated_at AUTOMÁTICAMENTE
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- =====================================================
-- TABLA: users
-- =====================================================

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email CITEXT UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    description TEXT,
    specialty VARCHAR(100),
    avatar_url VARCHAR(500),
    user_type user_type_enum NOT NULL DEFAULT 'doctor',
    is_active BOOLEAN NOT NULL DEFAULT true,
    last_online_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger para updated_at en users
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Índices para users
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_user_type ON users(user_type);
CREATE INDEX idx_users_is_active ON users(is_active);
CREATE INDEX idx_users_last_online_at ON users(last_online_at DESC);

-- =====================================================
-- TABLA: conversations
-- =====================================================

CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    is_group BOOLEAN NOT NULL DEFAULT false,
    title VARCHAR(255),
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger para updated_at en conversations
CREATE TRIGGER update_conversations_updated_at
    BEFORE UPDATE ON conversations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Índices para conversations
CREATE INDEX idx_conversations_created_by ON conversations(created_by);
CREATE INDEX idx_conversations_is_group ON conversations(is_group);
CREATE INDEX idx_conversations_created_at ON conversations(created_at DESC);

-- =====================================================
-- TABLA: conversation_participants
-- =====================================================

CREATE TABLE conversation_participants (
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role participant_role_enum NOT NULL DEFAULT 'member',
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    left_at TIMESTAMPTZ,
    PRIMARY KEY (conversation_id, user_id)
);

-- Índices para conversation_participants
CREATE INDEX idx_conversation_participants_user_id ON conversation_participants(user_id);
CREATE INDEX idx_conversation_participants_conversation_id ON conversation_participants(conversation_id);
CREATE INDEX idx_conversation_participants_joined_at ON conversation_participants(joined_at DESC);
CREATE INDEX idx_conversation_participants_active ON conversation_participants(conversation_id, user_id) WHERE left_at IS NULL;

-- =====================================================
-- TABLA: messages
-- =====================================================

CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    message_type message_type_enum NOT NULL DEFAULT 'text',
    is_edited BOOLEAN NOT NULL DEFAULT false,
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger para updated_at en messages
CREATE TRIGGER update_messages_updated_at
    BEFORE UPDATE ON messages
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Índices para messages (optimizados para consultas de chat)
CREATE INDEX idx_messages_conversation_created_at ON messages(conversation_id, created_at DESC);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX idx_messages_not_deleted ON messages(conversation_id, created_at DESC) WHERE deleted_at IS NULL;

-- =====================================================
-- TABLA: message_reads
-- =====================================================

CREATE TABLE message_reads (
    message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    read_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (message_id, user_id)
);

-- Índices para message_reads (optimizados para conteo de no leídos)
CREATE INDEX idx_message_reads_user_id ON message_reads(user_id);
CREATE INDEX idx_message_reads_message_id ON message_reads(message_id);
CREATE INDEX idx_message_reads_read_at ON message_reads(read_at DESC);

-- =====================================================
-- TABLA: app_settings
-- =====================================================

CREATE TABLE app_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger para updated_at en app_settings
CREATE TRIGGER update_app_settings_updated_at
    BEFORE UPDATE ON app_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Índices para app_settings
CREATE INDEX idx_app_settings_updated_by ON app_settings(updated_by);
CREATE INDEX idx_app_settings_updated_at ON app_settings(updated_at DESC);

-- =====================================================
-- VISTA: conversation_last_message
-- =====================================================

CREATE VIEW conversation_last_message AS
SELECT DISTINCT ON (m.conversation_id)
    m.conversation_id,
    m.id as last_message_id,
    m.content as last_message_content,
    m.sender_id as last_message_sender_id,
    u.first_name || ' ' || u.last_name as last_message_sender_name,
    m.message_type as last_message_type,
    m.created_at as last_message_at,
    m.deleted_at IS NOT NULL as last_message_deleted
FROM messages m
JOIN users u ON m.sender_id = u.id
ORDER BY m.conversation_id, m.created_at DESC;

-- =====================================================
-- VISTA: conversation_unread_counts
-- =====================================================

CREATE VIEW conversation_unread_counts AS
SELECT 
    cp.conversation_id,
    cp.user_id,
    COUNT(m.id) as unread_count
FROM conversation_participants cp
JOIN messages m ON m.conversation_id = cp.conversation_id
LEFT JOIN message_reads mr ON mr.message_id = m.id AND mr.user_id = cp.user_id
WHERE 
    cp.left_at IS NULL  -- Usuario activo en la conversación
    AND m.sender_id != cp.user_id  -- No contar mensajes propios
    AND m.deleted_at IS NULL  -- No contar mensajes eliminados
    AND mr.message_id IS NULL  -- Mensaje no leído
GROUP BY cp.conversation_id, cp.user_id;

-- =====================================================
-- VISTA: user_conversations (conversaciones con metadata)
-- =====================================================

CREATE VIEW user_conversations AS
SELECT 
    c.id as conversation_id,
    c.is_group,
    c.title,
    c.created_by,
    c.created_at as conversation_created_at,
    cp.user_id,
    cp.role as user_role,
    cp.joined_at,
    clm.last_message_content,
    clm.last_message_sender_name,
    clm.last_message_at,
    clm.last_message_deleted,
    COALESCE(cuc.unread_count, 0) as unread_count,
    -- Para conversaciones 1:1, obtener info del otro participante
    CASE 
        WHEN NOT c.is_group THEN (
            SELECT u.first_name || ' ' || u.last_name
            FROM conversation_participants cp2
            JOIN users u ON u.id = cp2.user_id
            WHERE cp2.conversation_id = c.id 
            AND cp2.user_id != cp.user_id 
            AND cp2.left_at IS NULL
            LIMIT 1
        )
        ELSE c.title
    END as display_name,
    CASE 
        WHEN NOT c.is_group THEN (
            SELECT u.avatar_url
            FROM conversation_participants cp2
            JOIN users u ON u.id = cp2.user_id
            WHERE cp2.conversation_id = c.id 
            AND cp2.user_id != cp.user_id 
            AND cp2.left_at IS NULL
            LIMIT 1
        )
        ELSE NULL
    END as display_avatar
FROM conversations c
JOIN conversation_participants cp ON cp.conversation_id = c.id
LEFT JOIN conversation_last_message clm ON clm.conversation_id = c.id
LEFT JOIN conversation_unread_counts cuc ON cuc.conversation_id = c.id AND cuc.user_id = cp.user_id
WHERE cp.left_at IS NULL;  -- Solo participantes activos

-- =====================================================
-- ÍNDICES ADICIONALES PARA OPTIMIZACIÓN
-- =====================================================

-- Índice compuesto para búsqueda rápida de mensajes no leídos por usuario
CREATE INDEX idx_unread_messages_by_user ON messages(sender_id, created_at DESC) 
WHERE deleted_at IS NULL;

-- Índice para búsqueda de conversaciones por participante
CREATE INDEX idx_active_participants ON conversation_participants(user_id, joined_at DESC) 
WHERE left_at IS NULL;

-- Índice GIN para búsqueda en contenido de mensajes (opcional, para búsqueda de texto)
CREATE INDEX idx_messages_content_search ON messages USING gin(to_tsvector('spanish', content))
WHERE deleted_at IS NULL;

-- =====================================================
-- DATOS DE EJEMPLO (OPCIONAL)
-- =====================================================

-- Insertar configuraciones por defecto
INSERT INTO app_settings (key, value, description) VALUES 
('max_file_size_mb', '10', 'Tamaño máximo de archivo en MB'),
('allowed_file_types', '["jpg", "jpeg", "png", "pdf", "doc", "docx"]', 'Tipos de archivo permitidos'),
('chat_retention_days', '365', 'Días de retención de mensajes'),
('max_group_participants', '50', 'Máximo de participantes en grupos')
ON CONFLICT (key) DO NOTHING;

-- =====================================================
-- COMENTARIOS SOBRE DECISIONES DE MODELADO
-- =====================================================

/*
DECISIONES DE MODELADO:

1. UUID como PK: Mejor para sistemas distribuidos y seguridad
2. CITEXT para email: Búsquedas case-insensitive automáticas
3. Soft delete en messages: Permite recuperación y auditoría
4. Composite PK en message_reads: Evita duplicados y optimiza espacio
5. Índices especializados: Optimizados para consultas típicas de chat
6. Vistas materializadas: Para consultas complejas frecuentes
7. Triggers automáticos: Mantienen updated_at sin lógica de aplicación
8. ON DELETE CASCADE: Limpieza automática de datos relacionados
9. Campos TIMESTAMPTZ: Soporte para múltiples zonas horarias
10. JSONB en settings: Flexibilidad para configuraciones complejas

ÍNDICES CLAVE:
- Conversaciones por usuario (frecuente)
- Mensajes por conversación ordenados por fecha (paginación)
- Mensajes no leídos por usuario (notificaciones)
- Búsqueda de texto en mensajes (opcional)
- Participantes activos por conversación

VISTAS ÚTILES:
- conversation_last_message: Último mensaje por conversación
- conversation_unread_counts: Conteo de no leídos por usuario
- user_conversations: Vista completa para listado de chats
*/