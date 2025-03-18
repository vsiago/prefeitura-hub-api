import express from 'express';
import { check } from 'express-validator';
import {
  register,
  login,
  logout,
  getMe,
  updatePassword,
  forgotPassword,
  resetPassword
} from '../controllers/authController';
import { protect } from '../middleware/auth';

const router = express.Router();

// @route   POST /api/auth/register
// @desc    Registrar um novo usuário
// @access  Public
router.post(
  '/register',
  [
    check('name', 'Nome é obrigatório').not().isEmpty(),
    check('email', 'Por favor, inclua um email válido').isEmail(),
    check('password', 'Por favor, digite uma senha com 6 ou mais caracteres').isLength({ min: 6 })
  ],
  register
);

// @route   POST /api/auth/login
// @desc    Autenticar usuário e obter token
// @access  Public
router.post(
  '/login',
  [
    check('email', 'Por favor, inclua um email válido').isEmail(),
    check('password', 'Senha é obrigatória').exists()
  ],
  login
);

// @route   GET /api/auth/logout
// @desc    Logout do usuário / Limpar cookie
// @access  Private
router.get('/logout', protect, logout);

// @route   GET /api/auth/me
// @desc    Obter usuário atual
// @access  Private
router.get('/me', protect, getMe);

// @route   PUT /api/auth/password
// @desc    Atualizar senha
// @access  Private
router.put(
  '/password',
  [
    protect,
    check('currentPassword', 'Senha atual é obrigatória').exists(),
    check('newPassword', 'Por favor, digite uma nova senha com 6 ou mais caracteres').isLength({
      min: 6
    })
  ],
  updatePassword
);

// @route   POST /api/auth/forgot-password
// @desc    Esqueci minha senha
// @access  Public
router.post(
  '/forgot-password',
  [check('email', 'Por favor, inclua um email válido').isEmail()],
  forgotPassword
);

// @route   PUT /api/auth/reset-password/:token
// @desc    Redefinir senha
// @access  Public
router.put(
  '/reset-password/:token',
  [check('password', 'Por favor, digite uma senha com 6 ou mais caracteres').isLength({ min: 6 })],
  resetPassword
);

export default router;