import express from 'express';
import {
  getNotifications,
  getNotification,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  updateNotificationSettings
} from '../controllers/notificationController';
import { protect } from '../middleware/auth';

const router = express.Router();

// Aplicar middleware de proteção a todas as rotas
router.use(protect);

// @route   GET /api/notifications
// @desc    Obter todas as notificações do usuário
// @access  Private
router.get('/', getNotifications);

// @route   GET /api/notifications/:id
// @desc    Obter notificação por ID
// @access  Private
router.get('/:id', getNotification);

// @route   PUT /api/notifications/:id/read
// @desc    Marcar notificação como lida
// @access  Private
router.put('/:id/read', markAsRead);

// @route   PUT /api/notifications/read-all
// @desc    Marcar todas as notificações como lidas
// @access  Private
router.put('/read-all', markAllAsRead);

// @route   DELETE /api/notifications/:id
// @desc    Excluir notificação
// @access  Private
router.delete('/:id', deleteNotification);

// @route   PUT /api/notifications/settings
// @desc    Atualizar configurações de notificação
// @access  Private
router.put('/settings', updateNotificationSettings);

export default router;