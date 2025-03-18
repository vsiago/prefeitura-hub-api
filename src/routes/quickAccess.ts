import express from 'express';
import { check } from 'express-validator';
import {
  getQuickAccessApps,
  addQuickAccessApp,
  updateQuickAccessApp,
  deleteQuickAccessApp,
  getGalleryApps,
  updateQuickAccessOrder
} from '../controllers/quickAccessController';
import { protect } from '../middleware/auth';

const router = express.Router();

// Aplicar middleware de proteção a todas as rotas
router.use(protect);

// @route   GET /api/quick-access
// @desc    Obter apps de acesso rápido do usuário
// @access  Private
router.get('/', getQuickAccessApps);

// @route   POST /api/quick-access
// @desc    Adicionar app de acesso rápido
// @access  Private
router.post(
  '/',
  [
    check('name', 'Nome é obrigatório').not().isEmpty(),
    check('icon', 'Ícone é obrigatório').not().isEmpty(),
    check('url', 'URL é obrigatória').not().isEmpty(),
    check('category', 'Categoria é obrigatória').not().isEmpty()
  ],
  addQuickAccessApp
);

// @route   PUT /api/quick-access/:id
// @desc    Atualizar app de acesso rápido
// @access  Private
router.put(
  '/:id',
  [
    check('name', 'Nome é obrigatório').optional().not().isEmpty(),
    check('icon', 'Ícone é obrigatório').optional().not().isEmpty(),
    check('url', 'URL é obrigatória').optional().not().isEmpty(),
    check('category', 'Categoria é obrigatória').optional().not().isEmpty()
  ],
  updateQuickAccessApp
);

// @route   DELETE /api/quick-access/:id
// @desc    Excluir app de acesso rápido
// @access  Private
router.delete('/:id', deleteQuickAccessApp);

// @route   GET /api/quick-access/gallery
// @desc    Obter apps da galeria
// @access  Private
router.get('/gallery', getGalleryApps);

// @route   POST /api/quick-access/order
// @desc    Atualizar ordem dos apps
// @access  Private
router.post(
  '/order',
  [check('order', 'Ordem é obrigatória').isArray()],
  updateQuickAccessOrder
);

export default router;