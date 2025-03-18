import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import User from '../models/User';
import Department from '../models/Department';
import ErrorResponse from '../utils/errorResponse';
import asyncHandler from 'express-async-handler';
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

// @desc    Obter todos os usuários
// @route   GET /api/users
// @access  Private
export const getUsers = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  res.status(200).json(res.advancedResults);
});

// @desc    Obter usuário por ID
// @route   GET /api/users/:id
// @access  Private
export const getUser = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(new ErrorResponse(`Usuário não encontrado com id ${req.params.id}`, 404));
  }

  res.status(200).json({
    success: true,
    data: user
  });
});

// @desc    Atualizar usuário
// @route   PUT /api/users/:id
// @access  Private
export const updateUser = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  // Verificar se o usuário é o próprio ou um admin
  if (req.params.id !== req.user.id && req.user.role !== 'admin') {
    return next(new ErrorResponse(`Usuário ${req.user.id} não está autorizado a atualizar este perfil`, 401));
  }

  let user = await User.findById(req.params.id);

  if (!user) {
    return next(new ErrorResponse(`Usuário não encontrado com id ${req.params.id}`, 404));
  }

  // Campos que podem ser atualizados
  const { name, email, position, phone, bio } = req.body;

  // Atualizar campos
  if (name) user.name = name;
  if (email) user.email = email;
  if (position) user.position = position;
  if (phone) user.phone = phone;
  if (bio) user.bio = bio;

  user = await user.save();

  res.status(200).json({
    success: true,
    data: user
  });
});

// @desc    Excluir usuário
// @route   DELETE /api/users/:id
// @access  Private/Admin
export const deleteUser = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(new ErrorResponse(`Usuário não encontrado com id ${req.params.id}`, 404));
  }

  await user.remove();

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Obter perfil completo do usuário
// @route   GET /api/users/:id/profile
// @access  Private
export const getUserProfile = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const user = await User.findById(req.params.id).populate('department');

  if (!user) {
    return next(new ErrorResponse(`Usuário não encontrado com id ${req.params.id}`, 404));
  }

  res.status(200).json({
    success: true,
    data: user
  });
});

// @desc    Atualizar avatar do usuário
// @route   PUT /api/users/:id/avatar
// @access  Private
export const updateAvatar = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  // Verificar se o usuário é o próprio ou um admin
  if (req.params.id !== req.user.id && req.user.role !== 'admin') {
    return next(new ErrorResponse(`Usuário ${req.user.id} não está autorizado a atualizar este avatar`, 401));
  }

  let user = await User.findById(req.params.id);

  if (!user) {
    return next(new ErrorResponse(`Usuário não encontrado com id ${req.params.id}`, 404));
  }

  if (!req.file) {
    return next(new ErrorResponse('Por favor, envie um arquivo', 400));
  }

  // Atualizar avatar
  user.avatar = req.file.path;
  await user.save();

  res.status(200).json({
    success: true,
    data: user
  });
});

// @desc    Gerar crachá do usuário
// @route   GET /api/users/:id/badge
// @access  Private
export const generateBadge = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const user = await User.findById(req.params.id).populate('department');

  if (!user) {
    return next(new ErrorResponse(`Usuário não encontrado com id ${req.params.id}`, 404));
  }

  // Criar PDF
  const doc = new PDFDocument();
  const filename = `badge-${user._id}.pdf`;
  const filepath = path.join(__dirname, '..', 'temp', filename);

  // Pipe para arquivo temporário
  doc.pipe(fs.createWriteStream(filepath));

  // Adicionar conteúdo ao PDF
  doc.fontSize(25).text('CRACHÁ INSTITUCIONAL', { align: 'center' });
  doc.moveDown();
  
  // Adicionar avatar se existir
  if (user.avatar) {
    doc.image(user.avatar, {
      fit: [250, 300],
      align: 'center'
    });
  }
  
  doc.moveDown();
  doc.fontSize(18).text(`Nome: ${user.name}`, { align: 'center' });
  doc.fontSize(14).text(`Cargo: ${user.position}`, { align: 'center' });
  
  if (user.department) {
    doc.fontSize(14).text(`Departamento: ${user.department.name}`, { align: 'center' });
  }
  
  // Finalizar PDF
  doc.end();

  // Enviar arquivo
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
  
  // Esperar arquivo ser criado
  setTimeout(() => {
    const filestream = fs.createReadStream(filepath);
    filestream.pipe(res);
    
    // Limpar arquivo após envio
    filestream.on('end', () => {
      fs.unlinkSync(filepath);
    });
  }, 1000);
});

// @desc    Gerar assinatura de email do usuário
// @route   GET /api/users/:id/signature
// @access  Private
export const generateEmailSignature = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const user = await User.findById(req.params.id).populate('department');

  if (!user) {
    return next(new ErrorResponse(`Usuário não encontrado com id ${req.params.id}`, 404));
  }

  // Criar HTML da assinatura
  const signature = `
    <div style="font-family: Arial, sans-serif; max-width: 500px; border-top: 3px solid #0066cc; padding-top: 10px;">
      <div style="display: flex;">
        ${user.avatar ? `<img src="${user.avatar}" alt="Avatar" style="width: 80px; height: 80px; border-radius: 50%; margin-right: 20px;">` : ''}
        <div>
          <h3 style="margin: 0; color: #0066cc;">${user.name}</h3>
          <p style="margin: 5px 0; color: #333;">${user.position}</p>
          ${user.department ? `<p style="margin: 5px 0; color: #333;">${user.department.name}</p>` : ''}
          <p style="margin: 5px 0; color: #333;">${user.email}</p>
          ${user.phone ? `<p style="margin: 5px 0; color: #333;">${user.phone}</p>` : ''}
        </div>
      </div>
      <div style="margin-top: 10px; border-top: 1px solid #eee; padding-top: 10px;">
        <p style="margin: 0; color: #666; font-size: 12px;">Prefeitura Municipal - Todos os direitos reservados</p>
      </div>
    </div>
  `;

  res.setHeader('Content-Type', 'text/html');
  res.send(signature);
});

// @desc    Gerar cartão de visita do usuário
// @route   GET /api/users/:id/business-card
// @access  Private
export const generateBusinessCard = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const user = await User.findById(req.params.id).populate('department');

  if (!user) {
    return next(new ErrorResponse(`Usuário não encontrado com id ${req.params.id}`, 404));
  }

  // Criar PDF
  const doc = new PDFDocument({
    size: [300, 150],
    margin: 10
  });
  
  const filename = `business-card-${user._id}.pdf`;
  const filepath = path.join(__dirname, '..', 'temp', filename);

  // Pipe para arquivo temporário
  doc.pipe(fs.createWriteStream(filepath));

  // Adicionar conteúdo ao PDF
  doc.fontSize(14).text('Prefeitura Municipal', { align: 'center' });
  doc.moveDown(0.5);
  doc.fontSize(12).text(user.name, { align: 'center' });
  doc.fontSize(10).text(user.position, { align: 'center' });
  
  if (user.department) {
    doc.fontSize(10).text(user.department.name, { align: 'center' });
  }
  
  doc.moveDown(0.5);
  doc.fontSize(8).text(`Email: ${user.email}`, { align: 'center' });
  
  if (user.phone) {
    doc.fontSize(8).text(`Telefone: ${user.phone}`, { align: 'center' });
  }
  
  // Finalizar PDF
  doc.end();

  // Enviar arquivo
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
  
  // Esperar arquivo ser criado
  setTimeout(() => {
    const filestream = fs.createReadStream(filepath);
    filestream.pipe(res);
    
    // Limpar arquivo após envio
    filestream.on('end', () => {
      fs.unlinkSync(filepath);
    });
  }, 1000);
});