import { Request, Response, NextFunction } from 'express';
import Notification from '../models/Notification';
import User from '../models/User';
import ErrorResponse from '../utils/errorResponse';
import asyncHandler from 'express-async-handler';

// @desc    Obter todas as notificações do usuário
// @route   GET /api/notifications
// @access  Private
export const getNotifications = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const notifications = await Notification.find({ recipient: req.user.id })
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: notifications.length,
    data: notifications
  });
});

// @desc    Obter notificação por ID
// @route   GET /api/notifications/:id
// @access  Private
export const getNotification = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const notification = await Notification.findById(req.params.id);

  if (!notification) {
    return next(new ErrorResponse(`Notificação não encontrada com id ${req.params.id}`, 404));
  }

  // Verificar se o usuário é o destinatário
  if (notification.recipient.toString() !== req.user.id) {
    return next(new ErrorResponse(`Usuário ${req.user.id} não está autorizado a acessar esta notificação`, 401));
  }

  res.status(200).json({
    success: true,
    data: notification
  });
});

// @desc    Marcar notificação como lida
// @route   PUT /api/notifications/:id/read
// @access  Private
export const markAsRead = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const notification = await Notification.findById(req.params.id);

  if (!notification) {
    return next(new ErrorResponse(`Notificação não encontrada com id ${req.params.id}`, 404));
  }

  // Verificar se o usuário é o destinatário
  if (notification.recipient.toString() !== req.user.id) {
    return next(new ErrorResponse(`Usuário ${req.user.id} não está autorizado a atualizar esta notificação`, 401));
  }

  notification.isRead = true;
  await notification.save();

  res.status(200).json({
    success: true,
    data: notification
  });
});

// @desc    Marcar todas as notificações como lidas
// @route   PUT /api/notifications/read-all
// @access  Private
export const markAllAsRead = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  await Notification.updateMany(
    { recipient: req.user.id, isRead: false },
    { isRead: true }
  );

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Excluir notificação
// @route   DELETE /api/notifications/:id
// @access  Private
export const deleteNotification = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const notification = await Notification.findById(req.params.id);

  if (!notification) {
    return next(new ErrorResponse(`Notificação não encontrada com id ${req.params.id}`, 404));
  }

  // Verificar se o usuário é o destinatário
  if (notification.recipient.toString() !== req.user.id) {
    return next(new ErrorResponse(`Usuário ${req.user.id} não está autorizado a excluir esta notificação`, 401));
  }

  await notification.remove();

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Atualizar configurações de notificação
// @route   PUT /api/notifications/settings
// @access  Private
export const updateNotificationSettings = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const user = await User.findById(req.user.id);

  if (!user) {
    return next(new ErrorResponse(`Usuário não encontrado com id ${req.user.id}`, 404));
  }

  // Atualizar configurações de notificação
  if (!user.notificationSettings) {
    user.notificationSettings = {};
  }

  const { email, push, desktop, types } = req.body;

  if (email !== undefined) user.notificationSettings.email = email;
  if (push !== undefined) user.notificationSettings.push = push;
  if (desktop !== undefined) user.notificationSettings.desktop = desktop;
  if (types) user.notificationSettings.types = types;

  await user.save();

  res.status(200).json({
    success: true,
    data: user.notificationSettings
  });
});