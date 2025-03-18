import { Request, Response, NextFunction } from 'express';
import User from '../models/User';
import Post from '../models/Post';
import Group from '../models/Group';
import Event from '../models/Event';
import News from '../models/News';
import ActivityLog from '../models/ActivityLog';
import ErrorResponse from '../utils/errorResponse';
import asyncHandler from 'express-async-handler';

// @desc    Obter dados do dashboard
// @route   GET /api/admin/dashboard
// @access  Private/Admin
export const getDashboardData = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  // Contagem de usuários
  const userCount = await User.countDocuments();
  
  // Usuários ativos nos últimos 30 dias
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const activeUserCount = await User.countDocuments({
    lastActive: { $gte: thirtyDaysAgo }
  });
  
  // Contagem de posts
  const postCount = await Post.countDocuments();
  
  // Posts nos últimos 7 dias
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const recentPostCount = await Post.countDocuments({
    createdAt: { $gte: sevenDaysAgo }
  });
  
  // Contagem de grupos
  const groupCount = await Group.countDocuments();
  
  // Contagem de eventos
  const eventCount = await Event.countDocuments();
  
  // Eventos futuros
  const now = new Date();
  const upcomingEventCount = await Event.countDocuments({
    startDate: { $gte: now }
  });
  
  // Contagem de notícias
  const newsCount = await News.countDocuments();

  // Atividade recente
  const recentActivity = await ActivityLog.find()
    .sort({ createdAt: -1 })
    .limit(10)
    .populate('user', 'name avatar')
    .populate('entity.id');

  res.status(200).json({
    success: true,
    data: {
      userCount,
      activeUserCount,
      postCount,
      recentPostCount,
      groupCount,
      eventCount,
      upcomingEventCount,
      newsCount,
      recentActivity
    }
  });
});

// @desc    Gerenciar usuários
// @route   GET /api/admin/users
// @access  Private/Admin
export const manageUsers = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  res.status(200).json(res.advancedResults);
});

// @desc    Gerenciar posts
// @route   GET /api/admin/posts
// @access  Private/Admin
export const managePosts = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  res.status(200).json(res.advancedResults);
});

// @desc    Gerenciar grupos
// @route   GET /api/admin/groups
// @access  Private/Admin
export const manageGroups = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  res.status(200).json(res.advancedResults);
});

// @desc    Gerenciar eventos
// @route   GET /api/admin/events
// @access  Private/Admin
export const manageEvents = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  res.status(200).json(res.advancedResults);
});

// @desc    Gerenciar notícias
// @route   GET /api/admin/news
// @access  Private/Admin
export const manageNews = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  res.status(200).json(res.advancedResults);
});

// @desc    Visualizar logs de atividade
// @route   GET /api/admin/logs
// @access  Private/Admin
export const getActivityLogs = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const logs = await ActivityLog.find()
    .sort({ createdAt: -1 })
    .populate('user', 'name avatar')
    .populate('entity.id');

  res.status(200).json({
    success: true,
    count: logs.length,
    data: logs
  });
});

// @desc    Obter configurações do sistema
// @route   GET /api/admin/settings
// @access  Private/Admin
export const getSystemSettings = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  // Obter configurações do sistema (implementar modelo de configurações)
  const settings = {
    siteName: 'Intranet da Prefeitura',
    logo: '/uploads/logo.png',
    theme: 'light',
    allowRegistration: true,
    requireApproval: true,
    maxFileSize: 10, // MB
    allowedFileTypes: ['image/jpeg', 'image/png', 'application/pdf', 'application/msword'],
    maintenanceMode: false
  };

  res.status(200).json({
    success: true,
    data: settings
  });
});

// @desc    Atualizar configurações do sistema
// @route   PUT /api/admin/settings
// @access  Private/Admin
export const updateSystemSettings = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  // Atualizar configurações do sistema (implementar modelo de configurações)
  const settings = {
    ...req.body
  };

  res.status(200).json({
    success: true,
    data: settings
  });
});