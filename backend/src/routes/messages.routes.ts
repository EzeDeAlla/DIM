const express = require('express');
import { Router } from 'express';
import { container } from '../config/inversify.config';
import { MessagesController } from '../messages/messages.controller';
import { MessagesService } from '../messages/messages.service';
import { TYPES } from '../types/container.types';
import { jwtMiddleware } from '../middleware/jwt.middleware';
import { validateContentType } from '../middleware/content-type.middleware';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Messages
 *   description: Gestión de mensajes y chat en tiempo real
 */

// Crear instancia del controlador usando container.get para obtener el servicio
const messagesService = container.get<MessagesService>(TYPES.MessagesService);
const messagesController = new MessagesController(messagesService);

/**
 * @swagger
 * /api/messages/conversations:
 *   get:
 *     summary: Obtener conversaciones del usuario autenticado
 *     tags: [Messages]
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
router.get('/conversations', jwtMiddleware, (req, res) => messagesController.getConversations(req, res));

/**
 * @swagger
 * /api/messages/conversation/{id}:
 *   get:
 *     summary: Obtener mensajes de una conversación
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID de la conversación
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Límite de mensajes a obtener
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           minimum: 0
 *           default: 0
 *         description: Offset para paginación
 *       - in: query
 *         name: before_message_id
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID del mensaje anterior para paginación
 *     responses:
 *       200:
 *         description: Mensajes obtenidos exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     messages:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Message'
 *                     total:
 *                       type: integer
 *                       example: 50
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
router.get('/conversation/:id', jwtMiddleware, (req, res) => messagesController.getMessagesByConversation(req, res));

/**
 * @swagger
 * /api/messages/send:
 *   post:
 *     summary: Enviar mensaje
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SendMessage'
 *     responses:
 *       201:
 *         description: Mensaje enviado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Message'
 *       400:
 *         description: Datos de mensaje inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
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
router.post('/send', jwtMiddleware, validateContentType, (req, res) => messagesController.sendMessage(req, res));

/**
 * @swagger
 * /api/messages/read/{id}:
 *   put:
 *     summary: Marcar mensaje como leído
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID del mensaje
 *     responses:
 *       200:
 *         description: Mensaje marcado como leído exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       403:
 *         description: No tienes acceso a este mensaje
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Mensaje no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.put('/read/:id', jwtMiddleware, validateContentType, (req, res) => messagesController.markMessageAsRead(req, res));

/**
 * @swagger
 * /api/messages/conversation/{conversationId}/read:
 *   put:
 *     summary: Marcar conversación como leída
 *     tags: [Messages]
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
 *         description: Conversación marcada como leída exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
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
router.put('/conversation/:conversationId/read', jwtMiddleware, validateContentType, (req, res) => messagesController.markConversationAsRead(req, res));

/**
 * @swagger
 * /api/messages/{messageId}:
 *   delete:
 *     summary: Eliminar mensaje
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: messageId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID del mensaje
 *     responses:
 *       200:
 *         description: Mensaje eliminado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       403:
 *         description: No tienes permisos para eliminar este mensaje
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Mensaje no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.delete('/:messageId', jwtMiddleware, (req, res) => messagesController.deleteMessage(req, res));

export { router as messagesRouter };