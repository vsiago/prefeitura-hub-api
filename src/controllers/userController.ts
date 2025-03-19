import { Request, Response, NextFunction } from 'express';
import { asyncHandler } from '../middleware/async';
import ErrorResponse from '../utils/errorResponse';
import User from '../models/User';
import bcrypt from 'bcryptjs';

// @desc    Obter todos os usuários
// @route   GET /api/users/admin/users
// @access  Private/Admin
export const getUsers = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  const total = await User.countDocuments();

  const users = await User.find()
    .select('-password')
    .sort({ name: 1 })
    .skip(startIndex)
    .limit(limit)
    .populate('department', 'name');

  const pagination = {
    total,
    pages: Math.ceil(total / limit),
    page,
    limit
  };

  res.status(200).json({
    success: true,
    data: users,
    pagination
  });
});

// @desc    Obter um usuário específico
// @route   GET /api/users/admin/users/:id
// @access  Private/Admin
export const getUser = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const user = await User.findById(req.params.id)
    .select('-password')
    .populate('department', 'name');

  if (!user) {
    return next(new ErrorResponse(`Usuário não encontrado com id ${req.params.id}`, 404));
  }

  res.status(200).json({
    success: true,
    data: user
  });
});

// @desc    Criar um novo usuário
// @route   POST /api/users/admin/users
// @access  Private/Admin
export const createUser = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  // Processar avatar, se houver
  if (req.file) {
    req.body.avatar = `/uploads/avatars/${req.file.filename}`;
  }

  const user = await User.create(req.body);

  res.status(201).json({
    success: true,
    data: user
  });
});

// @desc    Atualizar um usuário
// @route   PUT /api/users/admin/users/:id
// @access  Private/Admin
export const updateUser = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  let user = await User.findById(req.params.id);

  if (!user) {
    return next(new ErrorResponse(`Usuário não encontrado com id ${req.params.id}`, 404));
  }

  // Processar avatar, se houver
  if (req.file) {
    req.body.avatar = `/uploads/avatars/${req.file.filename}`;
  }

  // Se a senha estiver sendo atualizada, criptografá-la
  if (req.body.password) {
    const salt = await bcrypt.genSalt(10);
    req.body.password = await bcrypt.hash(req.body.password, salt);
  }

  user = await User.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  }).select('-password');

  res.status(200).json({
    success: true,
    data: user
  });
});

// @desc    Excluir um usuário
// @route   DELETE /api/users/admin/users/:id
// @access  Private/Admin
export const deleteUser = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(new ErrorResponse(`Usuário não encontrado com id ${req.params.id}`, 404));
  }

  // Não permitir que o usuário exclua a si mesmo
  if (user._id.toString() === req.user!._id.toString()) {
    return next(new ErrorResponse('Não é possível excluir seu próprio usuário', 400));
  }

  await user.deleteOne();

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Obter perfil do usuário atual
// @route   GET /api/users/profile
// @access  Private
export const getUserProfile = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const user = await User.findById(req.user!._id)
    .select('-password')
    .populate('department', 'name');

  res.status(200).json({
    success: true,
    data: user
  });
});

// @desc    Atualizar perfil do usuário atual
// @route   PUT /api/users/profile
// @access  Private
export const updateProfile = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  // Campos que o usuário pode atualizar
  const fieldsToUpdate = {
    name: req.body.name,
    email: req.body.email,
    avatar: req.body.avatar,
    phone: req.body.phone,
    bio: req.body.bio
  };

  // Processar avatar, se houver
  if (req.file) {
    fieldsToUpdate.avatar = `/uploads/avatars/${req.file.filename}`;
  }

  // Remover campos indefinidos
  Object.keys(fieldsToUpdate).forEach(key => {
    if (fieldsToUpdate[key] === undefined) {
      delete fieldsToUpdate[key];
    }
  });

  const user = await User.findByIdAndUpdate(req.user!._id, fieldsToUpdate, {
    new: true,
    runValidators: true
  }).select('-password');

  res.status(200).json({
    success: true,
    data: user
  });
});

// @desc    Atualizar senha do usuário atual
// @route   PUT /api/users/password
// @access  Private
export const updatePassword = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const user = await User.findById(req.user!._id).select('+password');

  // Verificar senha atual
  const isMatch = await user!.matchPassword(req.body.currentPassword);

  if (!isMatch) {
    return next(new ErrorResponse('Senha atual incorreta', 401));
  }

  // Verificar se a nova senha é igual à atual
  if (req.body.newPassword === req.body.currentPassword) {
    return next(new ErrorResponse('A nova senha não pode ser igual à atual', 400));
  }

  // Verificar se a nova senha e a confirmação são iguais
  if (req.body.newPassword !== req.body.confirmPassword) {
    return next(new ErrorResponse('As senhas não coincidem', 400));
  }

  user!.password = req.body.newPassword;
  await user!.save();

  res.status(200).json({
    success: true,
    message: 'Senha atualizada com sucesso'
  });
});

// @desc    Obter configurações de notificação do usuário atual
// @route   GET /api/users/notifications/settings
// @access  Private
export const getUserNotificationSettings = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const user = await User.findById(req.user!._id).select('notificationSettings');

  res.status(200).json({
    success: true,
    data: user!.notificationSettings
  });
});

// @desc    Atualizar configurações de notificação do usuário atual
// @route   PUT /api/users/notifications/settings
// @access  Private
export const updateUserNotificationSettings = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const user = await User.findByIdAndUpdate(
    req.user!._id,
    { notificationSettings: req.body },
    {
      new: true,
      runValidators: true
    }
  ).select('notificationSettings');

  res.status(200).json({
    success: true,
    data: user!.notificationSettings
  });
});