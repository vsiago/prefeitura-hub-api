import express from 'express';
import { check } from 'express-validator';
import {
  getPosts,
  getPost,
  createPost,
  updatePost,
  deletePost,
  likePost,
  unlikePost,
  addComment,
  updateComment,
  deleteComment
} from '../controllers/postController';
import { protect } from '../middleware/auth';
import { uploadMedia } from '../middleware/upload';

const router = express.Router();

// Aplicar middleware de proteção a todas as rotas
router.use(protect);

// @route   GET /api/posts
// @desc    Obter todos os posts
// @access  Private
router.get('/', getPosts);

// @route   GET /api/posts/:id
// @desc    Obter post por ID
// @access  Private
router.get('/:id', getPost);

// @route   POST /api/posts
// @desc    Criar um novo post
// @access  Private
router.post(
  '/',
  [
    uploadMedia,
    check('content', 'Conteúdo é obrigatório').not().isEmpty()
  ],
  createPost
);

// @route   PUT /api/posts/:id
// @desc    Atualizar post
// @access  Private
router.put(
  '/:id',
  [
    uploadMedia,
    check('content', 'Conteúdo é obrigatório').optional().not().isEmpty()
  ],
  updatePost
);

// @route   DELETE /api/posts/:id
// @desc    Excluir post
// @access  Private
router.delete('/:id', deletePost);

// @route   POST /api/posts/:id/like
// @desc    Curtir um post
// @access  Private
router.post('/:id/like', likePost);

// @route   DELETE /api/posts/:id/like
// @desc    Remover curtida de um post
// @access  Private
router.delete('/:id/like', unlikePost);

// @route   POST /api/posts/:id/comments
// @desc    Adicionar comentário a um post
// @access  Private
router.post(
  '/:id/comments',
  [check('content', 'Conteúdo é obrigatório').not().isEmpty()],
  addComment
);

// @route   PUT /api/posts/:id/comments/:commentId
// @desc    Atualizar comentário
// @access  Private
router.put(
  '/:id/comments/:commentId',
  [check('content', 'Conteúdo é obrigatório').not().isEmpty()],
  updateComment
);

// @route   DELETE /api/posts/:id/comments/:commentId
// @desc    Excluir comentário
// @access  Private
router.delete('/:id/comments/:commentId', deleteComment);

export default router;