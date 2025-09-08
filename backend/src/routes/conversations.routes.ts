const express = require('express');
import { Router } from 'express';
import { container } from '../config/inversify.config';
import { ConversationsController } from '../conversations/conversations.controller';
import { ConversationsService } from '../conversations/conversations.service';
import { TYPES } from '../types/container.types';
import { jwtMiddleware } from '../middleware/jwt.middleware';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Conversations
 *   description: Gestión de conversaciones y chats
 */

// Crear instancia del controlador usando container.get para obtener el servicio
const conversationsService = container.get<ConversationsService>(TYPES.ConversationsService);
const conversationsController = new ConversationsController(conversationsService);

/**
 * @swagger
 * /api/conversations:
 *   get:
 *     summary: Obtener conversaciones del usuario autenticado
 *     tags: [Conversations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Conversaciones obtenidas exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         description: No autorizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/', jwtMiddleware, (req, res) => conversationsController.getConversations(req, res));

/**
 * @swagger
 * /api/conversations/{conversationId}:
 *   get:
 *     summary: Obtener conversación por ID
 *     tags: [Conversations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID de la conversación
 *     responses:
 *       200:
 *         description: Conversación obtenida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Conversation'
 *       403:
 *         description: No tienes acceso a esta conversación
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Conversación no encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/:conversationId', jwtMiddleware, (req, res) => conversationsController.getConversationById(req, res));

/**
 * @swagger
 * /api/conversations:
 *   post:
 *     summary: Crear nueva conversación
 *     tags: [Conversations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateConversation'
 *     responses:
 *       201:
 *         description: Conversación creada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Conversation'
 *       400:
 *         description: Datos de conversación inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/', jwtMiddleware, (req, res) => conversationsController.createConversation(req, res));

// Endpoint para ejecutar SQL (solo para desarrollo)
router.post('/exec-sql', jwtMiddleware, async (req, res) => {
  try {
    const { query } = req.body;
    if (!query) {
      return res.status(400).json({ success: false, error: 'Query is required' });
    }
    
    // Ejecutar SQL directamente
    const result = await conversationsService.executeRawQuery(query);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Error ejecutando SQL:', error);
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

export { router as conversationsRouter };