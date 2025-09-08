import { Request, Response } from 'express';
import { inject } from 'inversify';
import { type CreateConversation } from '../../../shared/schemas';
import { ConversationsService } from './conversations.service';
import { TYPES } from '../types/container.types';
import { AuthenticatedRequest } from '../interfaces/common';
import { ConversationsListResponseBackend } from '../interfaces/conversations';

export class ConversationsController {
  private conversationsService: ConversationsService;
  
  constructor(conversationsService: ConversationsService) {
    this.conversationsService = conversationsService;
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

  async getConversationById(req: AuthenticatedRequest, res: Response): Promise<void> {
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

      const result = await this.conversationsService.getConversationById(conversationId, req.userId);
      
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

  async createConversation(req: AuthenticatedRequest, res: Response): Promise<void> {
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

      const conversationData: CreateConversation = req.body;
      
      if (!conversationData.created_by || typeof conversationData.is_group !== 'boolean') {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_DATA',
            message: 'created_by and is_group are required'
          }
        });
        return;
      }

      // Crear objeto con participant_ids vacío por defecto
      const conversationWithParticipants = {
        ...conversationData,
        participant_ids: []
      };

      const result = await this.conversationsService.createConversation(conversationWithParticipants);
      
      if (result.success) {
        res.status(201).json(result);
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