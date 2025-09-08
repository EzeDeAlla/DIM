// Interfaces específicas del dominio de mensajes
import { 
  type Message,
  type CreateMessage,
  type MessageRead,
  type CreateMessageRead
} from '../../../shared/schemas';

// Reutilizamos el tipo Message del schema compartido

export interface MessageWithSender extends Message {
  sender_name: string;
  sender_avatar?: string;
  is_read?: boolean;
  read_at?: string;
  status?: 'sent' | 'delivered' | 'read';
  delivered_at?: string;
  deliveredBy?: Record<string, boolean>;
  readBy?: Record<string, string>; // userId -> timestamp
}

// Reutilizamos CreateMessage del schema compartido
export type CreateMessageData = CreateMessage;

export interface MessageListParams {
  conversation_id: string;
  limit?: number;
  offset?: number;
  before_message_id?: string;
}

export interface MessagesListResponse {
  messages: MessageWithSender[];
  participants: Array<{
    id: string;
    name: string;
    role: string;
    avatar?: string;
    isOnline: boolean;
  }>;
  total: number;
  has_more: boolean;
}

export interface SendMessageData {
  conversation_id: string;
  content: string;
  message_type?: 'text' | 'image' | 'file';
}

export interface MessagesPaginationParams {
  conversation_id: string;
  limit?: number;
  offset?: number;
  before_message_id?: string;
}

export interface IMessagesRepository {
  findMessagesByConversation(params: MessageListParams): Promise<MessageWithSender[]>;
  findMessageById(messageId: string): Promise<Message | null>;
  createMessage(data: CreateMessageData): Promise<Message>;
  markMessageAsRead(messageId: string, userId: string): Promise<MessageRead>;
  markConversationAsRead(conversationId: string, userId: string): Promise<number>;
  deleteMessage(messageId: string, userId: string): Promise<boolean>;
  getMessagesCount(conversationId: string): Promise<number>;
}