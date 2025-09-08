import { Request, Response } from 'express';
import { MessagesService } from './messages.service';
import { AuthenticatedRequest } from '../interfaces/common';
import { MessagesListResponse, SendMessageData, MessagesPaginationParams } from '../interfaces/messages';
import { container } from '../config/inversify.config';
import { TYPES } from '../types/container.types';
import { ConversationsService } from '../conversations/conversations.service';
import { SendMessageSchema } from '../../../shared/schemas';

export class MessagesController {
  private messagesService: MessagesService;
  private conversationsService: ConversationsService;
  
  constructor(messagesService: MessagesService) {
    this.messagesService = messagesService;
    this.conversationsService = container.get<ConversationsService>(TYPES.ConversationsService);
  }

  async getMessagesByConversation(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.userId) {
        res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'User not authenticated'
          }
        });
        return;
      }

      const { id: conversationId } = req.params;
      
      if (!conversationId) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_DATA',
            message: 'Conversation ID is required'
          }
        });
        return;
      }

      const params: MessagesPaginationParams = {
        conversation_id: conversationId,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
        offset: req.query.offset ? parseInt(req.query.offset as string) : undefined,
        before_message_id: req.query.before_message_id as string
      };

      const result = await this.messagesService.getMessagesByConversation(params, req.userId);
      
      if (result.success) {
        res.status(200).json(result);
      } else {
        const statusCode = result.error?.code === 'NOT_FOUND' ? 404 : 
                          result.error?.code === 'FORBIDDEN' ? 403 : 500;
        res.status(statusCode).json(result);
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Internal server error',
          details: error instanceof Error ? error.message : 'Unknown error'
        }
      });
    }
  }

  async sendMessage(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.userId) {
        res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'User not authenticated'
          }
        });
        return;
      }

      // Validar datos con SendMessageSchema
      const validationResult = SendMessageSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Datos de mensaje inválidos',
            details: validationResult.error.issues.map((err: any) => ({
              field: err.path.join('.'),
              message: err.message
            }))
          }
        });
        return;
      }

      const messageData: SendMessageData = {
        ...validationResult.data,
        conversation_id: validationResult.data.conversation_id || ''
      };
      const result = await this.messagesService.sendMessage(messageData, req.userId);
      
      if (result.success) {
        res.status(201).json(result);
      } else {
        const statusCode = result.error?.code === 'NOT_FOUND' ? 404 : 
                          result.error?.code === 'FORBIDDEN' ? 403 :
                          result.error?.code === 'INVALID_DATA' ? 400 : 500;
        res.status(statusCode).json(result);
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Internal server error',
          details: error instanceof Error ? error.message : 'Unknown error'
        }
      });
    }
  }

  async markMessageAsRead(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.userId) {
        res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'User not authenticated'
          }
        });
        return;
      }

      const { id: messageId } = req.params;
      
      if (!messageId) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_DATA',
            message: 'Message ID is required'
          }
        });
        return;
      }

      const result = await this.messagesService.markMessageAsRead(messageId, req.userId);
      
      if (result.success) {
        res.status(200).json(result);
      } else {
        const statusCode = result.error?.code === 'NOT_FOUND' ? 404 : 
                          result.error?.code === 'FORBIDDEN' ? 403 : 500;
        res.status(statusCode).json(result);
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Internal server error',
          details: error instanceof Error ? error.message : 'Unknown error'
        }
      });
    }
  }

  async markConversationAsRead(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.userId) {
        res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'User not authenticated'
          }
        });
        return;
      }

      const { conversationId } = req.params;
      
      if (!conversationId) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_DATA',
            message: 'Conversation ID is required'
          }
        });
        return;
      }

      const result = await this.messagesService.markConversationAsRead(conversationId, req.userId);
      
      if (result.success) {
        res.status(200).json(result);
      } else {
        const statusCode = result.error?.code === 'NOT_FOUND' ? 404 : 
                          result.error?.code === 'FORBIDDEN' ? 403 : 500;
        res.status(statusCode).json(result);
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Internal server error',
          details: error instanceof Error ? error.message : 'Unknown error'
        }
      });
    }
  }

  async deleteMessage(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.userId) {
        res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'User not authenticated'
          }
        });
        return;
      }

      const { messageId } = req.params;
      
      if (!messageId) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_DATA',
            message: 'Message ID is required'
          }
        });
        return;
      }

      const result = await this.messagesService.deleteMessage(messageId, req.userId);
      
      if (result.success) {
        res.status(200).json(result);
      } else {
        const statusCode = result.error?.code === 'NOT_FOUND' ? 404 : 
                          result.error?.code === 'FORBIDDEN' ? 403 : 500;
        res.status(statusCode).json(result);
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Internal server error',
          details: error instanceof Error ? error.message : 'Unknown error'
        }
      });
    }
  }

  async getConversations(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.userId) {
        res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'User not authenticated'
          }
        });
        return;
      }

      const result = await this.conversationsService.getConversationsByUserId(req.userId);
      
      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(500).json(result);
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Internal server error',
          details: error instanceof Error ? error.message : 'Unknown error'
        }
      });
    }
  }
}