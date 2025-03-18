import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import News from '../models/News';
import Notification from '../models/Notification';
import User from '../models/User';
import ErrorResponse from '../utils/errorResponse';
import asyncHandler from 'express-async-handler';

// @desc    Obter todas as notícias
// @route   GET /api/news
// @access  Private
export const getNews = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  res.status(200).json(res.advancedResults);
});

// @desc    Obter notícia por ID
// @route   GET /api/news/:id
// @access  Private
export const getNewsItem = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const news = await News.findById(req.params.id).populate('author', 'name avatar');

  if (!news) {
    return next(new ErrorResponse(`Notícia não encontrada com id ${req.params.id}`, 404));
  }

  res.status(200).json({
    success: true,
    data: news
  });
});

// @desc    Criar nova notícia
// @route   POST /api/news
// @access  Private/Admin
export const createNews = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  // Adicionar autor ao corpo da requisição
  req.body.author = req.user.id;

  // Adicionar mídia se houver
  if (req.files && Array.isArray(req.files)) {
    req.body.media = req.files.map((file: any) => file.path);
  }

  const news = await News.create(req.body);

  // Se for notícia destacada, notificar todos os usuários
  if (news.isFeatured) {
    const users = await User.find();
    for (const user of users) {
      if (user._id.toString() !== req.user.id) {
        await Notification.create({
          recipient: user._id,
          type: 'news',
          content: `Nova notícia em destaque: ${news.title}`,
          relatedTo: {
            type: 'news',
            id: news._id
          }
        });
      }
    }
  }

  res.status(201).json({
    success: true,
    data: news
  });
});

// @desc    Atualizar notícia
// @route   PUT /api/news/:id
// @access  Private/Admin
export const updateNews = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  let news = await News.findById(req.params.id);

  if (!news) {
    return next(new ErrorResponse(`Notícia não encontrada com id ${req.params.id}`, 404));
  }

  // Verificar se o usuário é o autor da notícia
  if (news.author.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new ErrorResponse(`Usuário ${req.user.id} não está autorizado a atualizar esta notícia`, 401));
  }

  // Adicionar mídia se houver
  if (req.files && Array.isArray(req.files)) {
    req.body.media = req.files.map((file: any) => file.path);
  }

  // Verificar se a notícia passou a ser destacada
  const wasNotFeatured = !news.isFeatured;
  const willBeFeatured = req.body.isFeatured === true;

  news = await News.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  // Se a notícia passou a ser destacada, notificar todos os usuários
  if (wasNotFeatured && willBeFeatured) {
    const users = await User.find();
    for (const user of users) {
      if (user._id.toString() !== req.user.id) {
        await Notification.create({
          recipient: user._id,
          type: 'news',
          content: `Nova notícia em destaque: ${news.title}`,
          relatedTo: {
            type: 'news',
            id: news._id
          }
        });
      }
    }
  }

  res.status(200).json({
    success: true,
    data: news
  });
});

// @desc    Excluir notícia
// @route   DELETE /api/news/:id
// @access  Private/Admin
export const deleteNews = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const news = await News.findById(req.params.id);

  if (!news) {
    return next(new ErrorResponse(`Notícia não encontrada com id ${req.params.id}`, 404));
  }

  // Verificar se o usuário é o autor da notícia
  if (news.author.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new ErrorResponse(`Usuário ${req.user.id} não está autorizado a excluir esta notícia`, 401));
  }

  await news.remove();

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Obter categorias de notícias
// @route   GET /api/news/categories
// @access  Private
export const getCategories = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const categories = await News.distinct('category');

  res.status(200).json({
    success: true,
    count: categories.length,
    data: categories
  });
});

// @desc    Obter notícias destacadas
// @route   GET /api/news/featured
// @access  Private
export const getFeaturedNews = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const news = await News.find({ isFeatured: true })
    .sort({ publishDate: -1 })
    .populate('author', 'name avatar');

  res.status(200).json({
    success: true,
    count: news.length,
    data: news
  });
});