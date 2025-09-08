// Interfaces específicas del dominio de conversaciones
import { 
  type Conversation,
  type CreateConversation,
  type UpdateConversation,
  type ConversationParticipant,
  type CreateConversationParticipant
} from '../../../shared/schemas';

// Interfaz para participante con estado online
export interface ParticipantWithOnlineStatus {
  id: string;
  name: string;
  role: string;
  avatar?: string;
  isOnline: boolean;
}

// Interfaz específica para el backend con detalles adicionales
export interface ConversationWithDetailsBackend extends Conversation {
  unread_count: number; // Campo específico del backend
  display_name?: string; // Nombre a mostrar (para conversaciones 1:1)
  display_avatar?: string; // Avatar a mostrar (para conversaciones 1:1)
  participants: ParticipantWithOnlineStatus[]; // Participantes con estado online
  last_message?: {
    id: string;
    content: string;
    sender_name: string;
    created_at: string;
  };
}

// Interfaz para respuesta de conversaciones del backend
export interface ConversationsListResponseBackend {
  conversations: ConversationWithDetailsBackend[];
  total: number;
}

export interface IConversationsRepository {
  findConversationsByUserId(userId: string): Promise<ConversationWithDetailsBackend[]>;
  findConversationById(conversationId: string): Promise<Conversation | null>;
  createConversation(data: CreateConversation): Promise<Conversation>;
  findConversationBetweenUsers(userOneId: string, userTwoId: string): Promise<Conversation | null>;
  addParticipant(data: CreateConversationParticipant): Promise<ConversationParticipant>;
  removeParticipant(conversationId: string, userId: string): Promise<boolean>;
  updateConversation(id: string, data: UpdateConversation): Promise<Conversation | null>;
  executeRawQuery(query: string): Promise<any>;
}