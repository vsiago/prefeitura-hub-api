import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import Post from '../models/Post';
import Comment from '../models/Comment';
import User from '../models/User';
import Notification from '../models/Notification';
import ErrorResponse from '../utils/errorResponse';
import asyncHandler from 'express-async-handler';

// @desc    Obter todos os posts
// @route   GET /api/posts
// @access  Private
export const getPosts = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  res.status(200).json(res.advancedResults);
});

// @desc    Obter post por ID
// @route   GET /api/posts/:id
// @access  Private
export const getPost = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const post = await Post.findById(req.params.id)
    .populate('author', 'name avatar')
    .populate('comments');

  if (!post) {
    return next(new ErrorResponse(`Post não encontrado com id ${req.params.id}`, 404));
  }

  res.status(200).json({
    success: true,
    data: post
  });
});

// @desc    Criar novo post
// @route   POST /api/posts
// @access  Private
export const createPost = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  // Adicionar autor ao corpo da requisição
  req.body.author = req.user.id;

  // Adicionar mídia se houver
  if (req.files && Array.isArray(req.files)) {
    req.body.media = req.files.map((file: any) => file.path);
  }

  const post = await Post.create(req.body);

  res.status(201).json({
    success: true,
    data: post
  });
});

// @desc    Atualizar post
// @route   PUT /api/posts/:id
// @access  Private
export const updatePost = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  let post = await Post.findById(req.params.id);

  if (!post) {
    return next(new ErrorResponse(`Post não encontrado com id ${req.params.id}`, 404));
  }

  // Verificar se o usuário é o autor do post
  if (post.author.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new ErrorResponse(`Usuário ${req.user.id} não está autorizado a atualizar este post`, 401));
  }

  // Adicionar mídia se houver
  if (req.files && Array.isArray(req.files)) {
    req.body.media = req.files.map((file: any) => file.path);
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

// @desc    Excluir post
// @route   DELETE /api/posts/:id
// @access  Private
export const deletePost = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const post = await Post.findById(req.params.id);

  if (!post) {
    return next(new ErrorResponse(`Post não encontrado com id ${req.params.id}`, 404));
  }

  // Verificar se o usuário é o autor do post
  if (post.author.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new ErrorResponse(`Usuário ${req.user.id} não está autorizado a excluir este post`, 401));
  }

  await post.remove();

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Curtir post
// @route   POST /api/posts/:id/like
// @access  Private
export const likePost = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const post = await Post.findById(req.params.id);

  if (!post) {
    return next(new ErrorResponse(`Post não encontrado com id ${req.params.id}`, 404));
  }

  // Verificar se o post já foi curtido pelo usuário
  if (post.likes.includes(req.user.id)) {
    return next(new ErrorResponse('Post já foi curtido', 400));
  }

  post.likes.push(req.user.id);
  await post.save();

  // Criar notificação para o autor do post
  if (post.author.toString() !== req.user.id) {
    await Notification.create({
      recipient: post.author,
      type: 'like',
      content: `${req.user.name} curtiu seu post`,
      relatedTo: {
        type: 'post',
        id: post._id
      }
    });
  }

  res.status(200).json({
    success: true,
    data: post
  });
});

// @desc    Remover curtida de post
// @route   DELETE /api/posts/:id/like
// @access  Private
export const unlikePost = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const post = await Post.findById(req.params.id);

  if (!post) {
    return next(new ErrorResponse(`Post não encontrado com id ${req.params.id}`, 404));
  }

  // Verificar se o post foi curtido pelo usuário
  if (!post.likes.includes(req.user.id)) {
    return next(new ErrorResponse('Post ainda não foi curtido', 400));
  }

  // Remover usuário da lista de curtidas
  post.likes = post.likes.filter(
    (like) => like.toString() !== req.user.id
  );

  await post.save();

  res.status(200).json({
    success: true,
    data: post
  });
});

// @desc    Adicionar comentário a um post
// @route   POST /api/posts/:id/comments
// @access  Private
export const addComment = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const post = await Post.findById(req.params.id);

  if (!post) {
    return next(new ErrorResponse(`Post não encontrado com id ${req.params.id}`, 404));
  }

  // Criar comentário
  const comment = await Comment.create({
    post: post._id,
    author: req.user.id,
    content: req.body.content
  });

  // Adicionar comentário ao post
  post.comments.push(comment._id);
  await post.save();

  // Criar notificação para o autor do post
  if (post.author.toString() !== req.user.id) {
    await Notification.create({
      recipient: post.author,
      type: 'comment',
      content: `${req.user.name} comentou em seu post`,
      relatedTo: {
        type: 'post',
        id: post._id
      }
    });
  }

  res.status(201).json({
    success: true,
    data: comment
  });
});

// @desc    Atualizar comentário
// @route   PUT /api/posts/:id/comments/:commentId
// @access  Private
export const updateComment = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  let comment = await Comment.findById(req.params.commentId);

  if (!comment) {
    return next(new ErrorResponse(`Comentário não encontrado com id ${req.params.commentId}`, 404));
  }

  // Verificar se o comentário pertence ao post
  if (comment.post.toString() !== req.params.id) {
    return next(new ErrorResponse(`Comentário não pertence a este post`, 400));
  }

  // Verificar se o usuário é o autor do comentário
  if (comment.author.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new ErrorResponse(`Usuário ${req.user.id} não está autorizado a atualizar este comentário`, 401));
  }

  comment = await Comment.findByIdAndUpdate(
    req.params.commentId,
    { content: req.body.content },
    { new: true, runValidators: true }
  );

  res.status(200).json({
    success: true,
    data: comment
  });
});

// @desc    Excluir comentário
// @route   DELETE /api/posts/:id/comments/:commentId
// @access  Private
export const deleteComment = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const comment = await Comment.findById(req.params.commentId);

  if (!comment) {
    return next(new ErrorResponse(`Comentário não encontrado com id ${req.params.commentId}`, 404));
  }

  // Verificar se o comentário pertence ao post
  if (comment.post.toString() !== req.params.id) {
    return next(new ErrorResponse(`Comentário não pertence a este post`, 400));
  }

  // Verificar se o usuário é o autor do comentário
  if (comment.author.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new ErrorResponse(`Usuário ${req.user.id} não está autorizado a excluir este comentário`, 401));
  }

  await comment.remove();

  // Remover comentário do post
  const post = await Post.findById(req.params.id);
  post.comments = post.comments.filter(
    (c) => c.toString() !== req.params.commentId
  );
  await post.save();

  res.status(200).json({
    success: true,
    data: {}
  });
});