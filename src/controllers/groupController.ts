import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import Group from '../models/Group';
import GroupMember from '../models/GroupMember';
import Post from '../models/Post';
import File from '../models/File';
import User from '../models/User';
import Notification from '../models/Notification';
import ErrorResponse from '../utils/errorResponse';
import asyncHandler from 'express-async-handler';

// @desc    Obter todos os grupos
// @route   GET /api/groups
// @access  Private
export const getGroups = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  res.status(200).json(res.advancedResults);
});

// @desc    Obter grupo por ID
// @route   GET /api/groups/:id
// @access  Private
export const getGroup = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const group = await Group.findById(req.params.id)
    .populate('creator', 'name avatar')
    .populate({
      path: 'members',
      populate: {
        path: 'user',
        select: 'name avatar position'
      }
    });

  if (!group) {
    return next(new ErrorResponse(`Grupo não encontrado com id ${req.params.id}`, 404));
  }

  // Verificar se o grupo é privado e se o usuário é membro
  if (group.isPrivate) {
    const isMember = await GroupMember.findOne({
      group: group._id,
      user: req.user.id
    });

    if (!isMember && req.user.role !== 'admin') {
      return next(new ErrorResponse(`Acesso negado a este grupo privado`, 403));
    }
  }

  res.status(200).json({
    success: true,
    data: group
  });
});

// @desc    Criar novo grupo
// @route   POST /api/groups
// @access  Private
export const createGroup = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  // Adicionar criador ao corpo da requisição
  req.body.creator = req.user.id;

  // Adicionar imagens se houver
  if (req.files) {
    const files = req.files as any;
    if (files.avatar) {
      req.body.avatar = files.avatar[0].path;
    }
    if (files.cover) {
      req.body.cover = files.cover[0].path;
    }
  }

  const group = await Group.create(req.body);

  // Adicionar criador como membro administrador
  await GroupMember.create({
    group: group._id,
    user: req.user.id,
    role: 'admin',
    joinedAt: new Date()
  });

  res.status(201).json({
    success: true,
    data: group
  });
});

// @desc    Atualizar grupo
// @route   PUT /api/groups/:id
// @access  Private
export const updateGroup = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  let group = await Group.findById(req.params.id);

  if (!group) {
    return next(new ErrorResponse(`Grupo não encontrado com id ${req.params.id}`, 404));
  }

  // Verificar se o usuário é o criador ou administrador do grupo
  const member = await GroupMember.findOne({
    group: group._id,
    user: req.user.id
  });

  if (
    group.creator.toString() !== req.user.id &&
    (!member || member.role !== 'admin') &&
    req.user.role !== 'admin'
  ) {
    return next(new ErrorResponse(`Usuário ${req.user.id} não está autorizado a atualizar este grupo`, 401));
  }

  // Adicionar imagens se houver
  if (req.files) {
    const files = req.files as any;
    if (files.avatar) {
      req.body.avatar = files.avatar[0].path;
    }
    if (files.cover) {
      req.body.cover = files.cover[0].path;
    }
  }

  group = await Group.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    data: group
  });
});

// @desc    Excluir grupo
// @route   DELETE /api/groups/:id
// @access  Private
export const deleteGroup = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const group = await Group.findById(req.params.id);

  if (!group) {
    return next(new ErrorResponse(`Grupo não encontrado com id ${req.params.id}`, 404));
  }

  // Verificar se o usuário é o criador ou administrador do sistema
  if (group.creator.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new ErrorResponse(`Usuário ${req.user.id} não está autorizado a excluir este grupo`, 401));
  }

  // Remover membros do grupo
  await GroupMember.deleteMany({ group: group._id });

  // Remover posts do grupo
  await Post.deleteMany({ group: group._id });

  // Remover arquivos do grupo
  await File.deleteMany({ group: group._id });

  await group.remove();

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Adicionar membro ao grupo
// @route   POST /api/groups/:id/members
// @access  Private
export const addMember = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const group = await Group.findById(req.params.id);

  if (!group) {
    return next(new ErrorResponse(`Grupo não encontrado com id ${req.params.id}`, 404));
  }

  // Verificar se o usuário é o criador ou administrador do grupo
  const currentMember = await GroupMember.findOne({
    group: group._id,
    user: req.user.id
  });

  if (
    group.creator.toString() !== req.user.id &&
    (!currentMember || currentMember.role !== 'admin') &&
    req.user.role !== 'admin'
  ) {
    return next(new ErrorResponse(`Usuário ${req.user.id} não está autorizado a adicionar membros a este grupo`, 401));
  }

  // Verificar se o usuário a ser adicionado existe
  const user = await User.findById(req.body.userId);

  if (!user) {
    return next(new ErrorResponse(`Usuário não encontrado com id ${req.body.userId}`, 404));
  }

  // Verificar se o usuário já é membro
  const existingMember = await GroupMember.findOne({
    group: group._id,
    user: req.body.userId
  });

  if (existingMember) {
    return next(new ErrorResponse(`Usuário já é membro deste grupo`, 400));
  }

  // Adicionar membro
  const member = await GroupMember.create({
    group: group._id,
    user: req.body.userId,
    role: req.body.role,
    joinedAt: new Date()
  });

  // Criar notificação para o usuário adicionado
  await Notification.create({
    recipient: req.body.userId,
    type: 'group',
    content: `Você foi adicionado ao grupo ${group.name}`,
    relatedTo: {
      type: 'group',
      id: group._id
    }
  });

  res.status(201).json({
    success: true,
    data: member
  });
});

// @desc    Remover membro do grupo
// @route   DELETE /api/groups/:id/members/:userId
// @access  Private
export const removeMember = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const group = await Group.findById(req.params.id);

  if (!group) {
    return next(new ErrorResponse(`Grupo não encontrado com id ${req.params.id}`, 404));
  }

  // Verificar se o usuário é o criador, administrador do grupo, ou o próprio membro
  const currentMember = await GroupMember.findOne({
    group: group._id,
    user: req.user.id
  });

  if (
    group.creator.toString() !== req.user.id &&
    (!currentMember || currentMember.role !== 'admin') &&
    req.user.id !== req.params.userId &&
    req.user.role !== 'admin'
  ) {
    return next(new ErrorResponse(`Usuário ${req.user.id} não está autorizado a remover membros deste grupo`, 401));
  }

  // Verificar se o usuário a ser removido é membro
  const member = await GroupMember.findOne({
    group: group._id,
    user: req.params.userId
  });

  if (!member) {
    return next(new ErrorResponse(`Usuário não é membro deste grupo`, 404));
  }

  // Não permitir remover o criador do grupo
  if (group.creator.toString() === req.params.userId) {
    return next(new ErrorResponse(`Não é possível remover o criador do grupo`, 400));
  }

  await member.remove();

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Obter posts do grupo
// @route   GET /api/groups/:id/posts
// @access  Private
export const getGroupPosts = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const group = await Group.findById(req.params.id);

  if (!group) {
    return next(new ErrorResponse(`Grupo não encontrado com id ${req.params.id}`, 404));
  }

  // Verificar se o grupo é privado e se o usuário é membro
  if (group.isPrivate) {
    const isMember = await GroupMember.findOne({
      group: group._id,
      user: req.user.id
    });

    if (!isMember && req.user.role !== 'admin') {
      return next(new ErrorResponse(`Acesso negado a este grupo privado`, 403));
    }
  }

  const posts = await Post.find({ group: group._id })
    .sort({ createdAt: -1 })
    .populate('author', 'name avatar')
    .populate('comments');

  res.status(200).json({
    success: true,
    count: posts.length,
    data: posts
  });
});

// @desc    Criar post no grupo
// @route   POST /api/groups/:id/posts
// @access  Private
export const createGroupPost = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const group = await Group.findById(req.params.id);

  if (!group) {
    return next(new ErrorResponse(`Grupo não encontrado com id ${req.params.id}`, 404));
  }

  // Verificar se o usuário é membro do grupo
  const isMember = await GroupMember.findOne({
    group: group._id,
    user: req.user.id
  });

  if (!isMember && req.user.role !== 'admin') {
    return next(new ErrorResponse(`Apenas membros podem criar posts neste grupo`, 403));
  }

  // Adicionar autor e grupo ao corpo da requisição
  req.body.author = req.user.id;
  req.body.group = group._id;

  // Adicionar mídia se houver
  if (req.files && Array.isArray(req.files)) {
    req.body.media = req.files.map((file: any) => file.path);
  }

  const post = await Post.create(req.body);

  res.status(201).json({
    success: true,
    data: post
  });
});

// @desc    Obter arquivos do grupo
// @route   GET /api/groups/:id/files
// @access  Private
export const getGroupFiles = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const group = await Group.findById(req.params.id);

  if (!group) {
    return next(new ErrorResponse(`Grupo não encontrado com id ${req.params.id}`, 404));
  }

  // Verificar se o grupo é privado e se o usuário é membro
  if (group.isPrivate) {
    const isMember = await GroupMember.findOne({
      group: group._id,
      user: req.user.id
    });

    if (!isMember && req.user.role !== 'admin') {
      return next(new ErrorResponse(`Acesso negado a este grupo privado`, 403));
    }
  }

  const files = await File.find({ group: group._id })
    .sort({ createdAt: -1 })
    .populate('owner', 'name avatar');

  res.status(200).json({
    success: true,
    count: files.length,
    data: files
  });
});