import express from 'express';
import {
  getDashboardData,
  manageUsers,
  managePosts,
  manageGroups,
  manageEvents,
  manageNews,
  getActivityLogs,
  getSystemSettings,
  updateSystemSettings
} from '../controllers/adminController';
import { protect, authorize } from '../middleware/auth';

const router = express.Router();

// Aplicar middleware de proteção e autorização a todas as rotas
router.use(protect);
router.use(authorize('admin'));

// @route   GET /api/admin/dashboard
// @desc    Obter dados do dashboard
// @access  Private/Admin
router.get('/dashboard', getDashboardData);

// @route   GET /api/admin/users
// @desc    Gerenciar usuários
// @access  Private/Admin
router.get('/users', manageUsers);

// @route   GET /api/admin/posts
// @desc    Gerenciar posts
// @access  Private/Admin
router.get('/posts', managePosts);

// @route   GET /api/admin/groups
// @desc    Gerenciar grupos
// @access  Private/Admin
router.get('/groups', manageGroups);

// @route   GET /api/admin/events
// @desc    Gerenciar eventos
// @access  Private/Admin
router.get('/events', manageEvents);

// @route   GET /api/admin/news
// @desc    Gerenciar notícias
// @access  Private/Admin
router.get('/news', manageNews);

// @route   GET /api/admin/logs
// @desc    Visualizar logs de atividade
// @access  Private/Admin
router.get('/logs', getActivityLogs);

// @route   GET /api/admin/settings
// @desc    Obter configurações do sistema
// @access  Private/Admin
router.get('/settings', getSystemSettings);

// @route   PUT /api/admin/settings
// @desc    Atualizar configurações do sistema
// @access  Private/Admin
router.put('/settings', updateSystemSettings);

export default router;