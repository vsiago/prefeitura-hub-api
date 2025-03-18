import express from 'express';
import { check } from 'express-validator';
import {
  getDepartments,
  getDepartment,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  getDepartmentUsers,
  getDepartmentPosts
} from '../controllers/departmentController';
import { protect, authorize } from '../middleware/auth';

const router = express.Router();

// Aplicar middleware de proteção a todas as rotas
router.use(protect);

// @route   GET /api/departments
// @desc    Obter todos os departamentos
// @access  Private
router.get('/', getDepartments);

// @route   GET /api/departments/:id
// @desc    Obter departamento por ID
// @access  Private
router.get('/:id', getDepartment);

// @route   POST /api/departments
// @desc    Criar um novo departamento
// @access  Private/Admin
router.post(
  '/',
  [
    authorize('admin'),
    check('name', 'Nome é obrigatório').not().isEmpty(),
    check('description', 'Descrição é obrigatória').not().isEmpty()
  ],
  createDepartment
);

// @route   PUT /api/departments/:id
// @desc    Atualizar departamento
// @access  Private/Admin
router.put(
  '/:id',
  [
    authorize('admin'),
    check('name', 'Nome é obrigatório').optional().not().isEmpty(),
    check('description', 'Descrição é obrigatória').optional().not().isEmpty()
  ],
  updateDepartment
);

// @route   DELETE /api/departments/:id
// @desc    Excluir departamento
// @access  Private/Admin
router.delete('/:id', authorize('admin'), deleteDepartment);

// @route   GET /api/departments/:id/users
// @desc    Obter usuários do departamento
// @access  Private
router.get('/:id/users', getDepartmentUsers);

// @route   GET /api/departments/:id/posts
// @desc    Obter posts do departamento
// @access  Private
router.get('/:id/posts', getDepartmentPosts);

export default router;