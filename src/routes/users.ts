import express from 'express';
import { check } from 'express-validator';
import {
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  getUserProfile,
  updateAvatar,
  generateBadge,
  generateEmailSignature,
  generateBusinessCard
} from '../controllers/userController';
import { protect, authorize } from '../middleware/auth';
import { uploadAvatar } from '../middleware/upload';

const router = express.Router();

// Aplicar middleware de proteção a todas as rotas
router.use(protect);

// @route   GET /api/users
// @desc    Obter todos os usuários
// @access  Private
router.get('/', getUsers);

// @route   GET /api/users/:id
// @desc    Obter usuário por ID
// @access  Private
router.get('/:id', getUser);

// @route   PUT /api/users/:id
// @desc    Atualizar usuário
// @access  Private
router.put(
  '/:id',
  [
    check('name', 'Nome é obrigatório').optional().not().isEmpty(),
    check('email', 'Por favor, inclua um email válido').optional().isEmail()
  ],
  updateUser
);

// @route   DELETE /api/users/:id
// @desc    Excluir usuário
// @access  Private/Admin
router.delete('/:id', authorize('admin'), deleteUser);

// @route   GET /api/users/:id/profile
// @desc    Obter perfil completo do usuário
// @access  Private
router.get('/:id/profile', getUserProfile);

// @route   PUT /api/users/:id/avatar
// @desc    Atualizar avatar do usuário
// @access  Private
router.put('/:id/avatar', uploadAvatar, updateAvatar);

// @route   GET /api/users/:id/badge
// @desc    Gerar crachá do usuário
// @access  Private
router.get('/:id/badge', generateBadge);

// @route   GET /api/users/:id/signature
// @desc    Gerar assinatura de email do usuário
// @access  Private
router.get('/:id/signature', generateEmailSignature);

// @route   GET /api/users/:id/business-card
// @desc    Gerar cartão de visita do usuário
// @access  Private
router.get('/:id/business-card', generateBusinessCard);

export default router;