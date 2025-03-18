import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import QuickAccess from '../models/QuickAccess';
import ErrorResponse from '../utils/errorResponse';
import asyncHandler from 'express-async-handler';

// @desc    Obter apps de acesso rápido do usuário
// @route   GET /api/quick-access
// @access  Private
export const getQuickAccessApps = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const apps = await QuickAccess.find({ user: req.user.id })
    .sort({ order: 1 });

  res.status(200).json({
    success: true,
    count: apps.length,
    data: apps
  });
});

// @desc    Adicionar app de acesso rápido
// @route   POST /api/quick-access
// @access  Private
export const addQuickAccessApp = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  // Adicionar usuário ao corpo da requisição
  req.body.user = req.user.id;

  // Obter a maior ordem atual
  const maxOrderApp = await QuickAccess.findOne({ user: req.user.id })
    .sort({ order: -1 });
  
  const nextOrder = maxOrderApp ? maxOrderApp.order + 1 : 0;
  req.body.order = nextOrder;

  const app = await QuickAccess.create(req.body);

  res.status(201).json({
    success: true,
    data: app
  });
});

// @desc    Atualizar app de acesso rápido
// @route   PUT /api/quick-access/:id
// @access  Private
export const updateQuickAccessApp = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  let app = await QuickAccess.findById(req.params.id);

  if (!app) {
    return next(new ErrorResponse(`App não encontrado com id ${req.params.id}`, 404));
  }

  // Verificar se o usuário é o proprietário
  if (app.user.toString() !== req.user.id) {
    return next(new ErrorResponse(`Usuário ${req.user.id} não está autorizado a atualizar este app`, 401));
  }

  app = await QuickAccess.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    data: app
  });
});

// @desc    Excluir app de acesso rápido
// @route   DELETE /api/quick-access/:id
// @access  Private
export const deleteQuickAccessApp = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const app = await QuickAccess.findById(req.params.id);

  if (!app) {
    return next(new ErrorResponse(`App não encontrado com id ${req.params.id}`, 404));
  }

  // Verificar se o usuário é o proprietário
  if (app.user.toString() !== req.user.id) {
    return next(new ErrorResponse(`Usuário ${req.user.id} não está autorizado a excluir este app`, 401));
  }

  await app.remove();

  // Reordenar apps restantes
  const apps = await QuickAccess.find({ user: req.user.id })
    .sort({ order: 1 });
  
  for (let i = 0; i < apps.length; i++) {
    apps[i].order = i;
    await apps[i].save();
  }

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Obter apps da galeria
// @route   GET /api/quick-access/gallery
// @access  Private
export const getGalleryApps = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  // Lista de apps pré-definidos
  const galleryApps = [
    {
      name: 'Email',
      icon: 'mail',
      url: 'https://mail.prefeitura.gov.br',
      category: 'Comunicação',
      isCustom: false
    },
    {
      name: 'Calendário',
      icon: 'calendar',
      url: '/calendario',
      category: 'Produtividade',
      isCustom: false
    },
    {
      name: 'Documentos',
      icon: 'file-text',
      url: '/documentos',
      category: 'Produtividade',
      isCustom: false
    },
    {
      name: 'Recursos Humanos',
      icon: 'users',
      url: '/recursos-humanos',
      category: 'Departamentos',
      isCustom: false
    },
    {
      name: 'Financeiro',
      icon: 'dollar-sign',
      url: '/financeiro',
      category: 'Departamentos',
      isCustom: false
    },
    {
      name: 'Tecnologia',
      icon: 'cpu',
      url: '/tecnologia',
      category: 'Departamentos',
      isCustom: false
    },
    {
      name: 'Jurídico',
      icon: 'briefcase',
      url: '/juridico',
      category: 'Departamentos',
      isCustom: false
    },
    {
      name: 'Comunicação',
      icon: 'message-circle',
      url: '/comunicacao',
      category: 'Departamentos',
      isCustom: false
    },
    {
      name: 'Biblioteca',
      icon: 'book',
      url: '/biblioteca',
      category: 'Recursos',
      isCustom: false
    },
    {
      name: 'Treinamentos',
      icon: 'award',
      url: '/treinamentos',
      category: 'Recursos',
      isCustom: false
    }
  ];

  res.status(200).json({
    success: true,
    count: galleryApps.length,
    data: galleryApps
  });
});

// @desc    Atualizar ordem dos apps
// @route   POST /api/quick-access/order
// @access  Private
export const updateQuickAccessOrder = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { order } = req.body;

  // Verificar se todos os IDs pertencem ao usuário
  for (const item of order) {
    const app = await QuickAccess.findById(item.id);
    
    if (!app) {
      return next(new ErrorResponse(`App não encontrado com id ${item.id}`, 404));
    }
    
    if (app.user.toString() !== req.user.id) {
      return next(new ErrorResponse(`Usuário ${req.user.id} não está autorizado a reordenar este app`, 401));
    }
    
    app.order = item.order;
    await app.save();
  }

  const apps = await QuickAccess.find({ user: req.user.id })
    .sort({ order: 1 });

  res.status(200).json({
    success: true,
    data: apps
  });
});