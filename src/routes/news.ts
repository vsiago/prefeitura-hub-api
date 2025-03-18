import express from 'express';
import { check } from 'express-validator';
import {
  getNews,
  getNewsItem,
  createNews,
  updateNews,
  deleteNews,
  getCategories,
  getFeaturedNews
} from '../controllers/newsController';
import { protect, authorize } from '../middleware/auth';
import { uploadMedia } from '../middleware/upload';

const router = express.Router();

// Aplicar middleware de proteção a todas as rotas
router.use(protect);

// @route   GET /api/news
// @desc    Obter todas as notícias
// @access  Private
router.get('/', getNews);

// @route   GET /api/news/:id
// @desc    Obter notícia por ID
// @access  Private
router.get('/:id', getNewsItem);

// @route   POST /api/news
// @desc    Criar uma nova notícia
// @access  Private/Admin
router.post(
  '/',
  [
    authorize('admin', 'editor'),
    uploadMedia,
    check('title', 'Título é obrigatório').not().isEmpty(),
    check('content', 'Conteúdo é obrigatório').not().isEmpty(),
    check('category', 'Categoria é obrigatória').not().isEmpty()
  ],
  createNews
);

// @route   PUT /api/news/:id
// @desc    Atualizar notícia
// @access  Private/Admin
router.put(
  '/:id',
  [
    authorize('admin', 'editor'),
    uploadMedia,
    check('title', 'Título é obrigatório').optional().not().isEmpty(),
    check('content', 'Conteúdo é obrigatório').optional().not().isEmpty(),
    check('category', 'Categoria é obrigatória').optional().not().isEmpty()
  ],
  updateNews
);

// @route   DELETE /api/news/:id
// @desc    Excluir notícia
// @access  Private/Admin
router.delete('/:id', authorize('admin', 'editor'), deleteNews);

// @route   GET /api/news/categories
// @desc    Obter categorias de notícias
// @access  Private
router.get('/categories', getCategories);

// @route   GET /api/news/featured
// @desc    Obter notícias destacadas
// @access  Private
router.get('/featured', getFeaturedNews);

export default router;