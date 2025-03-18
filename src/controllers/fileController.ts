import { Request, Response, NextFunction } from 'express';
import File from '../models/File';
import User from '../models/User';
import Notification from '../models/Notification';
import ErrorResponse from '../utils/errorResponse';
import asyncHandler from 'express-async-handler';
import fs from 'fs';
import path from 'path';

// @desc    Obter todos os arquivos do usuário
// @route   GET /api/files
// @access  Private
export const getFiles = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const files = await File.find({ owner: req.user.id })
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: files.length,
    data: files
  });
});

// @desc    Obter arquivo por ID
// @route   GET /api/files/:id
// @access  Private
export const getFile = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const file = await File.findById(req.params.id);

  if (!file) {
    return next(new ErrorResponse(`Arquivo não encontrado com id ${req.params.id}`, 404));
  }

  // Verificar se o usuário é o proprietário ou se o arquivo foi compartilhado com ele
  if (
    file.owner.toString() !== req.user.id &&
    !file.sharedWith.includes(req.user.id) &&
    req.user.role !== 'admin'
  ) {
    return next(new ErrorResponse(`Acesso negado a este arquivo`, 403));
  }

  res.status(200).json({
    success: true,
    data: file
  });
});

// @desc    Fazer upload de arquivo
// @route   POST /api/files
// @access  Private
export const uploadFile = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  if (!req.file) {
    return next(new ErrorResponse('Por favor, envie um arquivo', 400));
  }

  const { originalname, mimetype, size, path: filePath } = req.file;
  const { group, department } = req.body;

  // Criar arquivo no banco de dados
  const file = await File.create({
    name: originalname,
    type: mimetype,
    size,
    url: filePath,
    owner: req.user.id,
    group,
    department
  });

  res.status(201).json({
    success: true,
    data: file
  });
});

// @desc    Excluir arquivo
// @route   DELETE /api/files/:id
// @access  Private
export const deleteFile = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const file = await File.findById(req.params.id);

  if (!file) {
    return next(new ErrorResponse(`Arquivo não encontrado com id ${req.params.id}`, 404));
  }

  // Verificar se o usuário é o proprietário
  if (file.owner.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new ErrorResponse(`Usuário ${req.user.id} não está autorizado a excluir este arquivo`, 401));
  }

  // Excluir arquivo do sistema de arquivos
  try {
    fs.unlinkSync(file.url);
  } catch (err) {
    console.error('Erro ao excluir arquivo físico:', err);
  }

  await file.remove();

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Obter arquivos compartilhados com o usuário
// @route   GET /api/files/shared
// @access  Private
export const getSharedFiles = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const files = await File.find({ sharedWith: req.user.id })
    .sort({ createdAt: -1 })
    .populate('owner', 'name avatar');

  res.status(200).json({
    success: true,
    count: files.length,
    data: files
  });
});

// @desc    Compartilhar arquivo com usuário
// @route   POST /api/files/:id/share
// @access  Private
export const shareFile = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { userId } = req.body;

  if (!userId) {
    return next(new ErrorResponse('Por favor, forneça o ID do usuário', 400));
  }

  // Verificar se o usuário existe
  const user = await User.findById(userId);

  if (!user) {
    return next(new ErrorResponse(`Usuário não encontrado com id ${userId}`, 404));
  }

  const file = await File.findById(req.params.id);

  if (!file) {
    return next(new ErrorResponse(`Arquivo não encontrado com id ${req.params.id}`, 404));
  }

  // Verificar se o usuário é o proprietário
  if (file.owner.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new ErrorResponse(`Usuário ${req.user.id} não está autorizado a compartilhar este arquivo`, 401));
  }

  // Verificar se o arquivo já foi compartilhado com o usuário
  if (file.sharedWith.includes(userId)) {
    return next(new ErrorResponse(`Arquivo já compartilhado com este usuário`, 400));
  }

  // Adicionar usuário à lista de compartilhamento
  file.sharedWith.push(userId);
  await file.save();

  // Criar notificação para o usuário
  await Notification.create({
    recipient: userId,
    type: 'file',
    content: `${req.user.name} compartilhou um arquivo com você: ${file.name}`,
    relatedTo: {
      type: 'file',
      id: file._id
    }
  });

  res.status(200).json({
    success: true,
    data: file
  });
});

// @desc    Remover compartilhamento de arquivo
// @route   DELETE /api/files/:id/share/:userId
// @access  Private
export const removeFileShare = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const file = await File.findById(req.params.id);

  if (!file) {
    return next(new ErrorResponse(`Arquivo não encontrado com id ${req.params.id}`, 404));
  }

  // Verificar se o usuário é o proprietário
  if (file.owner.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new ErrorResponse(`Usuário ${req.user.id} não está autorizado a gerenciar compartilhamentos deste arquivo`, 401));
  }

  // Verificar se o arquivo foi compartilhado com o usuário
  if (!file.sharedWith.includes(req.params.userId)) {
    return next(new ErrorResponse(`Arquivo não compartilhado com este usuário`, 400));
  }

  // Remover usuário da lista de compartilhamento
  file.sharedWith = file.sharedWith.filter(
    (id) => id.toString() !== req.params.userId
  );
  await file.save();

  res.status(200).json({
    success: true,
    data: file
  });
});