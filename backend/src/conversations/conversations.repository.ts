import { injectable, inject } from 'inversify';
import { Knex } from 'knex';
import { TYPES } from '../types/container.types';
import { 
  type Conversation, 
  type CreateConversation,
  type UpdateConversation,
  type CreateConversationParticipant,
  type ConversationParticipant
} from '../../../shared/schemas';
import { 
  ConversationWithDetailsBackend, 
  IConversationsRepository
} from '../interfaces/conversations';

@injectable()
export class ConversationsRepository implements IConversationsRepository {
  constructor(
    @inject(TYPES.knexType) private knex: Knex
  ) {}

  async findConversationsByUserId(userId: string): Promise<ConversationWithDetailsBackend[]> {
    const conversations = await this.knex('conversations as c')
      .select(
        'c.id',
        'c.title',
        'c.is_group',
        'c.created_at',
        'c.updated_at',
        'm.content as last_message',
        'm.created_at as last_message_at',
        // Para conversaciones 1-1, obtener datos del otro participante
        this.knex.raw(`
          CASE 
            WHEN c.is_group = false THEN (
              SELECT u.first_name || ' ' || u.last_name
              FROM conversation_participants cp2
              JOIN users u ON cp2.user_id = u.id
              WHERE cp2.conversation_id = c.id 
                AND cp2.user_id != ?
                AND cp2.left_at IS NULL
              LIMIT 1
            )
            ELSE c.title
          END as display_name
        `, [userId]),
        this.knex.raw(`
          CASE 
            WHEN c.is_group = false THEN (
              SELECT u.avatar_url
              FROM conversation_participants cp2
              JOIN users u ON cp2.user_id = u.id
              WHERE cp2.conversation_id = c.id 
                AND cp2.user_id != ?
                AND cp2.left_at IS NULL
              LIMIT 1
            )
            ELSE NULL
          END as participant_avatar
        `, [userId])
      )
      .join('conversation_participants as cp', 'c.id', 'cp.conversation_id')
      .leftJoin(
        this.knex('messages')
          .select('conversation_id', 'content', 'created_at')
          .whereRaw('(conversation_id, created_at) IN (SELECT conversation_id, MAX(created_at) FROM messages GROUP BY conversation_id)')
          .as('m'),
        'c.id', 'm.conversation_id'
      )
      .where('cp.user_id', userId)
      .whereNull('cp.left_at')
      .orderBy('last_message_at', 'desc')
      .orderBy('c.created_at', 'desc');

    // Obtener conteo de mensajes no leídos para cada conversación
    const conversationIds = conversations.map(c => c.id);
    const unreadCounts = await this.knex('messages as m')
      .select('m.conversation_id')
      .count('* as unread_count')
      .leftJoin('message_reads as mr', function() {
        this.on('m.id', 'mr.message_id')
            .andOnVal('mr.user_id', userId);
      })
      .whereIn('m.conversation_id', conversationIds)
      .whereNot('m.sender_id', userId)
      .whereNull('mr.message_id')
      .groupBy('m.conversation_id');

    const unreadMap = new Map(unreadCounts.map(uc => [uc.conversation_id, parseInt(uc.unread_count as string)]));

    // Obtener participantes de cada conversación con su estado online
    const participantsData = await this.knex('conversation_participants as cp')
      .select(
        'cp.conversation_id',
        'u.id',
        'u.first_name',
        'u.last_name',
        'u.user_type',
        'u.avatar_url',
        'u.is_active',
        'u.is_online'
      )
      .join('users as u', 'cp.user_id', 'u.id')
      .whereIn('cp.conversation_id', conversationIds)
      .whereNull('cp.left_at');

    // Agrupar participantes por conversación
    const participantsMap = new Map<string, any[]>();
    participantsData.forEach(participant => {
      if (!participantsMap.has(participant.conversation_id)) {
        participantsMap.set(participant.conversation_id, []);
      }
      participantsMap.get(participant.conversation_id)!.push({
        id: participant.id,
        name: `${participant.first_name} ${participant.last_name}`.trim(),
        role: participant.user_type,
        avatar: participant.avatar_url,
        isOnline: participant.is_online || false
      });
    });

    return conversations.map(conv => ({
      ...conv,
      unread_count: unreadMap.get(conv.id) || 0,
      participants: participantsMap.get(conv.id) || []
    }));
  }

  async findConversationById(conversationId: string): Promise<Conversation | null> {
    const conversation = await this.knex('conversations')
      .where('id', conversationId)
      .first();

    return conversation || null;
  }

  async createConversation(data: CreateConversation): Promise<Conversation> {
    const [conversation] = await this.knex('conversations')
      .insert({
        created_by: data.created_by,
        is_group: data.is_group,
        title: data.title || null,
        created_at: new Date(),
        updated_at: new Date()
      })
      .returning('*');

    return conversation;
  }

  async findConversationBetweenUsers(userOneId: string, userTwoId: string): Promise<Conversation | null> {
    const conversation = await this.knex('conversations')
      .where(function() {
        this.where({
          participant_one_id: userOneId,
          participant_two_id: userTwoId
        }).orWhere({
          participant_one_id: userTwoId,
          participant_two_id: userOneId
        });
      })
      .first();

    return conversation || null;
  }

  async addParticipant(data: CreateConversationParticipant): Promise<ConversationParticipant> {
    const [participant] = await this.knex('conversation_participants')
      .insert({
        conversation_id: data.conversation_id,
        user_id: data.user_id,
        joined_at: new Date()
      })
      .returning('*');
    
    return participant;
  }

  async removeParticipant(conversationId: string, userId: string): Promise<boolean> {
    const result = await this.knex('conversation_participants')
      .where({
        conversation_id: conversationId,
        user_id: userId
      })
      .update({
        left_at: new Date()
      });
    
    return result > 0;
  }

  async updateConversation(id: string, data: UpdateConversation): Promise<Conversation | null> {
    const [conversation] = await this.knex('conversations')
      .where({ id })
      .update({
        ...data,
        updated_at: new Date()
      })
      .returning('*');
    
    return conversation || null;
  }

  async executeRawQuery(query: string): Promise<any> {
    return await this.knex.raw(query);
  }
}