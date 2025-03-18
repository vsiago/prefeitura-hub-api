import express from 'express';
import { check } from 'express-validator';
import {
  getGroups,
  getGroup,
  createGroup,
  updateGroup,
  deleteGroup,
  addMember,
  removeMember,
  getGroupPosts,
  createGroupPost,
  getGroupFiles
} from '../controllers/groupController';
import { protect } from '../middleware/auth';
import { uploadGroupImage, uploadMedia } from '../middleware/upload';

const router = express.Router();

// Aplicar middleware de proteção a todas as rotas
router.use(protect);

// @route   GET /api/groups
// @desc    Obter todos os grupos
// @access  Private
router.get('/', getGroups);

// @route   GET /api/groups/:id
// @desc    Obter grupo por ID
// @access  Private
router.get('/:id', getGroup);

// @route   POST /api/groups
// @desc    Criar um novo grupo
// @access  Private
router.post(
  '/',
  [
    uploadGroupImage,
    check('name', 'Nome é obrigatório').not().isEmpty(),
    check('description', 'Descrição é obrigatória').not().isEmpty()
  ],
  createGroup
);

// @route   PUT /api/groups/:id
// @desc    Atualizar grupo
// @access  Private
router.put(
  '/:id',
  [
    uploadGroupImage,
    check('name', 'Nome é obrigatório').optional().not().isEmpty(),
    check('description', 'Descrição é obrigatória').optional().not().isEmpty()
  ],
  updateGroup
);

// @route   DELETE /api/groups/:id
// @desc    Excluir grupo
// @access  Private
router.delete('/:id', deleteGroup);

// @route   POST /api/groups/:id/members
// @desc    Adicionar membro ao grupo
// @access  Private
router.post(
  '/:id/members',
  [
    check('userId', 'ID do usuário é obrigatório').not().isEmpty(),
    check('role', 'Função é obrigatória').not().isEmpty()
  ],
  addMember
);

// @route   DELETE /api/groups/:id/members/:userId
// @desc    Remover membro do grupo
// @access  Private
router.delete('/:id/members/:userId', removeMember);

// @route   GET /api/groups/:id/posts
// @desc    Obter posts do grupo
// @access  Private
router.get('/:id/posts', getGroupPosts);

// @route   POST /api/groups/:id/posts
// @desc    Criar post no grupo
// @access  Private
router.post(
  '/:id/posts',
  [
    uploadMedia,
    check('content', 'Conteúdo é obrigatório').not().isEmpty()
  ],
  createGroupPost
);

// @route   GET /api/groups/:id/files
// @desc    Obter arquivos do grupo
// @access  Private
router.get('/:id/files', getGroupFiles);

export default router;