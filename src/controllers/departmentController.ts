import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import Department from '../models/Department';
import User from '../models/User';
import Post from '../models/Post';
import ErrorResponse from '../utils/errorResponse';
import asyncHandler from 'express-async-handler';

// @desc    Obter todos os departamentos
// @route   GET /api/departments
// @access  Private
export const getDepartments = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  res.status(200).json(res.advancedResults);
});

// @desc    Obter departamento por ID
// @route   GET /api/departments/:id
// @access  Private
export const getDepartment = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const department = await Department.findById(req.params.id)
    .populate('head', 'name avatar position')
    .populate('parent', 'name');

  if (!department) {
    return next(new ErrorResponse(`Departamento não encontrado com id ${req.params.id}`, 404));
  }

  res.status(200).json({
    success: true,
    data: department
  });
});

// @desc    Criar novo departamento
// @route   POST /api/departments
// @access  Private/Admin
export const createDepartment = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  // Verificar se o chefe do departamento existe
  if (req.body.head) {
    const user = await User.findById(req.body.head);
    if (!user) {
      return next(new ErrorResponse(`Usuário não encontrado com id ${req.body.head}`, 404));
    }
  }

  // Verificar se o departamento pai existe
  if (req.body.parent) {
    const parent = await Department.findById(req.body.parent);
    if (!parent) {
      return next(new ErrorResponse(`Departamento pai não encontrado com id ${req.body.parent}`, 404));
    }
  }

  const department = await Department.create(req.body);

  res.status(201).json({
    success: true,
    data: department
  });
});

// @desc    Atualizar departamento
// @route   PUT /api/departments/:id
// @access  Private/Admin
export const updateDepartment = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  let department = await Department.findById(req.params.id);

  if (!department) {
    return next(new ErrorResponse(`Departamento não encontrado com id ${req.params.id}`, 404));
  }

  // Verificar se o chefe do departamento existe
  if (req.body.head) {
    const user = await User.findById(req.body.head);
    if (!user) {
      return next(new ErrorResponse(`Usuário não encontrado com id ${req.body.head}`, 404));
    }
  }

  // Verificar se o departamento pai existe
  if (req.body.parent) {
    // Não permitir que um departamento seja seu próprio pai
    if (req.body.parent === req.params.id) {
      return next(new ErrorResponse(`Um departamento não pode ser seu próprio pai`, 400));
    }

    const parent = await Department.findById(req.body.parent);
    if (!parent) {
      return next(new ErrorResponse(`Departamento pai não encontrado com id ${req.body.parent}`, 404));
    }
  }

  department = await Department.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    data: department
  });
});

// @desc    Excluir departamento
// @route   DELETE /api/departments/:id
// @access  Private/Admin
export const deleteDepartment = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const department = await Department.findById(req.params.id);

  if (!department) {
    return next(new ErrorResponse(`Departamento não encontrado com id ${req.params.id}`, 404));
  }

  // Verificar se há departamentos filhos
  const children = await Department.find({ parent: department._id });
  if (children.length > 0) {
    return next(new ErrorResponse(`Não é possível excluir um departamento que possui departamentos filhos`, 400));
  }

  // Verificar se há usuários no departamento
  const users = await User.find({ department: department._id });
  if (users.length > 0) {
    return next(new ErrorResponse(`Não é possível excluir um departamento que possui usuários`, 400));
  }

  await department.remove();

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Obter usuários do departamento
// @route   GET /api/departments/:id/users
// @access  Private
export const getDepartmentUsers = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const department = await Department.findById(req.params.id);

  if (!department) {
    return next(new ErrorResponse(`Departamento não encontrado com id ${req.params.id}`, 404));
  }

  const users = await User.find({ department: department._id })
    .select('name avatar position email phone');

  res.status(200).json({
    success: true,
    count: users.length,
    data: users
  });
});

// @desc    Obter posts do departamento
// @route   GET /api/departments/:id/posts
// @access  Private
export const getDepartmentPosts = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const department = await Department.findById(req.params.id);

  if (!department) {
    return next(new ErrorResponse(`Departamento não encontrado com id ${req.params.id}`, 404));
  }

  const posts = await Post.find({ department: department._id })
    .sort({ createdAt: -1 })
    .populate('author', 'name avatar')
    .populate('comments');

  res.status(200).json({
    success: true,
    count: posts.length,
    data: posts
  });
});