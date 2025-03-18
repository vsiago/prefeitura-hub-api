import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import User from '../models/User';
import ErrorResponse from '../utils/errorResponse';
import asyncHandler from 'express-async-handler';
import { sendEmail } from '../utils/sendEmail';

// @desc    Registrar usuário
// @route   POST /api/auth/register
// @access  Public
export const register = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, email, password, department, position } = req.body;

  // Verificar se o usuário já existe
  let user = await User.findOne({ email });

  if (user) {
    return next(new ErrorResponse('Usuário já existe', 400));
  }

  // Criar usuário
  user = await User.create({
    name,
    email,
    password,
    department,
    position,
    role: 'user' // Default role
  });

  // Enviar token JWT
  sendTokenResponse(user, 201, res);
});

// @desc    Login de usuário
// @route   POST /api/auth/login
// @access  Public
export const login = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;

  // Verificar se o usuário existe
  const user = await User.findOne({ email }).select('+password');

  if (!user) {
    return next(new ErrorResponse('Credenciais inválidas', 401));
  }

  // Verificar se a senha está correta
  const isMatch = await user.matchPassword(password);

  if (!isMatch) {
    return next(new ErrorResponse('Credenciais inválidas', 401));
  }

  // Atualizar último acesso
  user.lastActive = new Date();
  await user.save();

  // Enviar token JWT
  sendTokenResponse(user, 200, res);
});

// @desc    Logout / limpar cookie
// @route   GET /api/auth/logout
// @access  Private
export const logout = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Obter usuário atual
// @route   GET /api/auth/me
// @access  Private
export const getMe = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const user = await User.findById(req.user.id);

  res.status(200).json({
    success: true,
    data: user
  });
});

// @desc    Atualizar senha
// @route   PUT /api/auth/password
// @access  Private
export const updatePassword = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const user = await User.findById(req.user.id).select('+password');

  // Verificar senha atual
  const isMatch = await user.matchPassword(req.body.currentPassword);

  if (!isMatch) {
    return next(new ErrorResponse('Senha atual incorreta', 401));
  }

  user.password = req.body.newPassword;
  await user.save();

  sendTokenResponse(user, 200, res);
});

// @desc    Esqueci minha senha
// @route   POST /api/auth/forgot-password
// @access  Public
export const forgotPassword = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return next(new ErrorResponse('Não há usuário com esse email', 404));
  }

  // Gerar e hash token de redefinição
  const resetToken = user.getResetPasswordToken();

  await user.save({ validateBeforeSave: false });

  // Criar URL de redefinição
  const resetUrl = `${req.protocol}://${req.get('host')}/api/auth/reset-password/${resetToken}`;

  const message = `Você está recebendo este email porque solicitou a redefinição de senha. Por favor, faça uma solicitação PUT para: \n\n ${resetUrl}`;

  try {
    await sendEmail({
      email: user.email,
      subject: 'Token de redefinição de senha',
      message
    });

    res.status(200).json({ success: true, data: 'Email enviado' });
  } catch (err) {
    console.log(err);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save({ validateBeforeSave: false });

    return next(new ErrorResponse('Email não pôde ser enviado', 500));
  }
});

// @desc    Redefinir senha
// @route   PUT /api/auth/reset-password/:token
// @access  Public
export const resetPassword = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  // Obter token hashed
  const resetPasswordToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() }
  });

  if (!user) {
    return next(new ErrorResponse('Token inválido', 400));
  }

  // Definir nova senha
  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  sendTokenResponse(user, 200, res);
});

// Função auxiliar para enviar token de resposta
const sendTokenResponse = (user: any, statusCode: number, res: Response) => {
  // Criar token
  const token = user.getSignedJwtToken();

  const options = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production'
  };

  res
    .status(statusCode)
    .cookie('token', token, options)
    .json({
      success: true,
      token
    });
};