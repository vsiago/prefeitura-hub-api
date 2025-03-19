import { Request, Response, NextFunction } from 'express';
import { asyncHandler } from '../middleware/async';
import ErrorResponse from '../utils/errorResponse';
import Post from '../models/Post';
import User from '../models/User';
import Department from '../models/Department';
import Group from '../models/Group';

// @desc    Obter todos os posts
// @route   GET /api/posts
// @access  Public
export const getPosts = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  const total = await Post.countDocuments({ isPublished: true });

  const posts = await Post.find({ isPublished: true })
    .sort({ createdAt: -1 })
    .skip(startIndex)
    .limit(limit)
    .populate('author', 'name avatar position')
    .populate('comments', 'content author createdAt');

  const pagination = {
    total,
    pages: Math.ceil(total / limit),
    page,
    limit
  };

  res.status(200).json({
    success: true,
    data: posts,
    pagination
  });
});

// @desc    Obter um post específico
// @route   GET /api/posts/:id
// @access  Public
export const getPost = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const post = await Post.findById(req.params.id)
    .populate('author', 'name avatar position')
    .populate({
      path: 'comments',
      populate: {
        path: 'author',
        select: 'name avatar position'
      }
    });

  if (!post) {
    return next(new ErrorResponse(`Post não encontrado com id ${req.params.id}`, 404));
  }

  res.status(200).json({
    success: true,
    data: post
  });
});

// @desc    Criar um novo post
// @route   POST /api/posts
// @access  Private
export const createPost = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  // Adicionar autor ao corpo da requisição
  req.body.author = req.user!._id;

  // Processar arquivos de mídia, se houver
  if (req.files && Array.isArray(req.files)) {
    req.body.media = req.files.map((file: Express.Multer.File) => `/uploads/posts/${file.filename}`);
  }

  const post = await Post.create(req.body);

  res.status(201).json({
    success: true,
    data: post
  });
});

// @desc    Atualizar um post
// @route   PUT /api/posts/:id
// @access  Private
export const updatePost = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  let post = await Post.findById(req.params.id);

  if (!post) {
    return next(new ErrorResponse(`Post não encontrado com id ${req.params.id}`, 404));
  }

  // Verificar se o usuário é o autor do post
  if (post.author.toString() !== req.user!._id.toString() && req.user!.role !== 'admin') {
    return next(new ErrorResponse('Não autorizado para atualizar este post', 403));
  }

  // Processar arquivos de mídia, se houver
  if (req.files && Array.isArray(req.files)) {
    // Adicionar novas mídias às existentes
    const newMedia = req.files.map((file: Express.Multer.File) => `/uploads/posts/${file.filename}`);
    req.body.media = [...(post.media || []), ...newMedia];
  }

  post = await Post.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    data: post
  });
});

// @desc    Excluir um post
// @route   DELETE /api/posts/:id
// @access  Private
export const deletePost = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const post = await Post.findById(req.params.id);

  if (!post) {
    return next(new ErrorResponse(`Post não encontrado com id ${req.params.id}`, 404));
  }

  // Verificar se o usuário é o autor do post
  if (post.author.toString() !== req.user!._id.toString() && req.user!.role !== 'admin') {
    return next(new ErrorResponse('Não autorizado para excluir este post', 403));
  }

  await post.deleteOne();

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Curtir um post
// @route   POST /api/posts/:id/like
// @access  Private
export const likePost = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const post = await Post.findById(req.params.id);

  if (!post) {
    return next(new ErrorResponse(`Post não encontrado com id ${req.params.id}`, 404));
  }

  // Verificar se o post já foi curtido pelo usuário
  if (post.likes.includes(req.user!._id)) {
    return next(new ErrorResponse('Post já foi curtido', 400));
  }

  post.likes.push(req.user!._id);
  await post.save();

  res.status(200).json({
    success: true,
    data: {
      likes: post.likes.length,
      isLiked: true
    }
  });
});

// @desc    Descurtir um post
// @route   DELETE /api/posts/:id/like
// @access  Private
export const unlikePost = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const post = await Post.findById(req.params.id);

  if (!post) {
    return next(new ErrorResponse(`Post não encontrado com id ${req.params.id}`, 404));
  }

  // Verificar se o post foi curtido pelo usuário
  if (!post.likes.includes(req.user!._id)) {
    return next(new ErrorResponse('Post não foi curtido', 400));
  }

  // Remover o ID do usuário do array de likes
  post.likes = post.likes.filter(
    (like) => like.toString() !== req.user!._id.toString()
  );
  
  await post.save();

  res.status(200).json({
    success: true,
    data: {
      likes: post.likes.length,
      isLiked: false
    }
  });
});

// @desc    Obter posts de um usuário específico
// @route   GET /api/posts/user/:userId
// @access  Private
export const getPostsByUser = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const user = await User.findById(req.params.userId);

  if (!user) {
    return next(new ErrorResponse(`Usuário não encontrado com id ${req.params.userId}`, 404));
  }

  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  const total = await Post.countDocuments({ author: req.params.userId, isPublished: true });

  const posts = await Post.find({ author: req.params.userId, isPublished: true })
    .sort({ createdAt: -1 })
    .skip(startIndex)
    .limit(limit)
    .populate('author', 'name avatar position')
    .populate('comments', 'content author createdAt');

  const pagination = {
    total,
    pages: Math.ceil(total / limit),
    page,
    limit
  };

  res.status(200).json({
    success: true,
    data: posts,
    pagination
  });
});

// @desc    Obter posts de um departamento específico
// @route   GET /api/posts/department/:departmentId
// @access  Private
export const getPostsByDepartment = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const department = await Department.findById(req.params.departmentId);

  if (!department) {
    return next(new ErrorResponse(`Departamento não encontrado com id ${req.params.departmentId}`, 404));
  }

  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  const total = await Post.countDocuments({ department: req.params.departmentId, isPublished: true });

  const posts = await Post.find({ department: req.params.departmentId, isPublished: true })
    .sort({ createdAt: -1 })
    .skip(startIndex)
    .limit(limit)
    .populate('author', 'name avatar position')
    .populate('comments', 'content author createdAt');

  const pagination = {
    total,
    pages: Math.ceil(total / limit),
    page,
    limit
  };

  res.status(200).json({
    success: true,
    data: posts,
    pagination
  });
});

// @desc    Obter posts de um grupo específico
// @route   GET /api/posts/group/:groupId
// @access  Private
export const getPostsByGroup = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const group = await Group.findById(req.params.groupId);

  if (!group) {
    return next(new ErrorResponse(`Grupo não encontrado com id ${req.params.groupId}`, 404));
  }

  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  const total = await Post.countDocuments({ group: req.params.groupId, isPublished: true });

  const posts = await Post.find({ group: req.params.groupId, isPublished: true })
    .sort({ createdAt: -1 })
    .skip(startIndex)
    .limit(limit)
    .populate('author', 'name avatar position')
    .populate('comments', 'content author createdAt');

  const pagination = {
    total,
    pages: Math.ceil(total / limit),
    page,
    limit
  };

  res.status(200).json({
    success: true,
    data: posts,
    pagination
  });
});