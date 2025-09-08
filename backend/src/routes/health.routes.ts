const express = require('express');
import { Router, Request, Response } from 'express';
import { container } from '../config/inversify.config';
import { HealthController } from '../health/health.controller';
import { HealthService } from '../health/health.service';
import { TYPES } from '../types/container.types';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Health
 *   description: Verificación del estado del sistema
 */

// Crear instancia del controlador usando container.get para obtener el servicio
const healthService = container.get<HealthService>(TYPES.HealthService);
const healthController = new HealthController(healthService);

/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: Verificar estado del sistema
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Sistema funcionando correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: OK
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   example: 2024-01-15T10:30:00.000Z
 *                 database:
 *                   type: string
 *                   example: connected
 *                 uptime:
 *                   type: number
 *                   example: 3600
 */
router.get('/', (req: Request, res: Response) => healthController.getHealth(req, res));

export { router as healthRouter };