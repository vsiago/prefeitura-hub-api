import { Request, Response, NextFunction } from 'express';
import { asyncHandler } from '../middleware/async';
import ErrorResponse from '../utils/errorResponse';
import Group from '../models/Group';
import GroupMember from '../models/GroupMember';
import Post from '../models/Post';
import File from '../models/File';
import Event from '../models/Event';

// @desc    Obter todos os grupos
// @route   GET /api/groups
// @access  Public
export const getGroups = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  
  // Filtrar grupos privados se o usuário não estiver autenticado
  const filter = !req.user ? { isPrivate: false } : {};
  
  const total = await Group.countDocuments(filter);

  const groups = await Group.find(filter)
    .sort({ name: 1 })
    .skip(startIndex)
    .limit(limit)
    .populate('creator', 'name avatar position');

  const pagination = {
    total,
    pages: Math.ceil(total / limit),
    page,
    limit
  };

  res.status(200).json({
    success: true,
    data: groups,
    pagination
  });
});

// @desc    Obter um grupo específico
// @route   GET /api/groups/:id
// @access  Public/Private (depende se o grupo é privado)
export const getGroup = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const group = await Group.findById(req.params.id)
    .populate('creator', 'name avatar position');

  if (!group) {
    return next(new ErrorResponse(`Grupo não encontrado com id ${req.params.id}`, 404));
  }

  // Verificar se o grupo é privado e o usuário não está autenticado
  if (group.isPrivate && !req.user) {
    return next(new ErrorResponse('Não autorizado para acessar este grupo', 403));
  }

  // Verificar se o usuário é membro do grupo privado
  if (group.isPrivate && req.user) {
    const isMember = await GroupMember.findOne({
      group: group._id,
      user: req.user._id
    });

    if (!isMember && req.user.role !== 'admin') {
      return next(new ErrorResponse('Não autorizado para acessar este grupo', 403));
    }
  }

  res.status(200).json({
    success: true,
    data: group
  });
});

// @desc    Criar um novo grupo
// @route   POST /api/groups
// @access  Private
export const createGroup = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  // Adicionar criador ao corpo da requisição
  req.body.creator = req.user!._id;

  // Processar arquivos de imagem, se houver
  if (req.files) {
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    
    if (files.avatar && files.avatar.length > 0) {
      req.body.avatar = `/uploads/groups/${files.avatar[0].filename}`;
    }
    
    if (files.cover && files.cover.length > 0) {
      req.body.cover = `/uploads/groups/${files.cover[0].filename}`;
    }
  }

  const group = await Group.create(req.body);

  // Adicionar o criador como membro administrador do grupo
  await GroupMember.create({
    group: group._id,
    user: req.user!._id,
    role: 'admin'
  });

  // Adicionar o ID do membro ao grupo
  const groupMember = await GroupMember.findOne({
    group: group._id,
    user: req.user!._id
  });

  group.members = [groupMember!._id];
  await group.save();

  res.status(201).json({
    success: true,
    data: group
  });
});

// @desc    Atualizar um grupo
// @route   PUT /api/groups/:id
// @access  Private
export const updateGroup = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  let group = await Group.findById(req.params.id);

  if (!group) {
    return next(new ErrorResponse(`Grupo não encontrado com id ${req.params.id}`, 404));
  }

  // Verificar se o usuário é o criador do grupo ou um administrador
  const isMember = await GroupMember.findOne({
    group: group._id,
    user: req.user!._id,
    role: 'admin'
  });

  if (!isMember && req.user!.role !== 'admin') {
    return next(new ErrorResponse('Não autorizado para atualizar este grupo', 403));
  }

  // Processar arquivos de imagem, se houver
  if (req.files) {
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    
    if (files.avatar && files.avatar.length > 0) {
      req.body.avatar = `/uploads/groups/${files.avatar[0].filename}`;
    }
    
    if (files.cover && files.cover.length > 0) {
      req.body.cover = `/uploads/groups/${files.cover[0].filename}`;
    }
  }

  group = await Group.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    data: group
  });
});

// @desc    Excluir um grupo
// @route   DELETE /api/groups/:id
// @access  Private
export const deleteGroup = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const group = await Group.findById(req.params.id);

  if (!group) {
    return next(new ErrorResponse(`Grupo não encontrado com id ${req.params.id}`, 404));
  }

  // Verificar se o usuário é o criador do grupo ou um administrador
  const isMember = await GroupMember.findOne({
    group: group._id,
    user: req.user!._id,
    role: 'admin'
  });

  if (!isMember && req.user!.role !== 'admin') {
    return next(new ErrorResponse('Não autorizado para excluir este grupo', 403));
  }

  // Excluir todos os membros do grupo
  await GroupMember.deleteMany({ group: group._id });

  // Excluir o grupo
  await group.deleteOne();

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Entrar em um grupo
// @route   POST /api/groups/:id/join
// @access  Private
export const joinGroup = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const group = await Group.findById(req.params.id);

  if (!group) {
    return next(new ErrorResponse(`Grupo não encontrado com id ${req.params.id}`, 404));
  }

  // Verificar se o usuário já é membro do grupo
  const existingMember = await GroupMember.findOne({
    group: group._id,
    user: req.user!._id
  });

  if (existingMember) {
    return next(new ErrorResponse('Você já é membro deste grupo', 400));
  }

  // Criar novo membro
  const groupMember = await GroupMember.create({
    group: group._id,
    user: req.user!._id,
    role: 'member'
  });

  // Adicionar o ID do membro ao grupo
  group.members.push(groupMember._id);
  await group.save();

  res.status(200).json({
    success: true,
    message: 'Você entrou no grupo com sucesso',
    data: group
  });
});

// @desc    Sair de um grupo
// @route   DELETE /api/groups/:id/leave
// @access  Private
export const leaveGroup = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const group = await Group.findById(req.params.id);

  if (!group) {
    return next(new ErrorResponse(`Grupo não encontrado com id ${req.params.id}`, 404));
  }

  // Verificar se o usuário é membro do grupo
  const member = await GroupMember.findOne({
    group: group._id,
    user: req.user!._id
  });

  if (!member) {
    return next(new ErrorResponse('Você não é membro deste grupo', 400));
  }

  // Verificar se o usuário é o único administrador do grupo
  if (member.role === 'admin') {
    const adminCount = await GroupMember.countDocuments({
      group: group._id,
      role: 'admin'
    });

    if (adminCount === 1) {
      return next(new ErrorResponse('Você é o único administrador do grupo. Transfira a administração antes de sair', 400));
    }
  }

  // Remover o ID do membro do grupo
  group.members = group.members.filter(
    (m) => m.toString() !== member._id.toString()
  );
  await group.save();

  // Excluir o membro
  await member.deleteOne();

  res.status(200).json({
    success: true,
    message: 'Você saiu do grupo com sucesso',
    data: {}
  });
});

// @desc    Obter membros de um grupo
// @route   GET /api/groups/:id/members
// @access  Private
export const getGroupMembers = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const group = await Group.findById(req.params.id);

  if (!group) {
    return next(new ErrorResponse(`Grupo não encontrado com id ${req.params.id}`, 404));
  }

  // Verificar se o grupo é privado e o usuário não está autenticado
  if (group.isPrivate && !req.user) {
    return next(new ErrorResponse('Não autorizado para acessar este grupo', 403));
  }

  // Verificar se o usuário é membro do grupo privado
  if (group.isPrivate && req.user) {
    const isMember = await GroupMember.findOne({
      group: group._id,
      user: req.user._id
    });

    if (!isMember && req.user.role !== 'admin') {
      return next(new ErrorResponse('Não autorizado para acessar este grupo', 403));
    }
  }

  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  const total = await GroupMember.countDocuments({ group: group._id });

  const members = await GroupMember.find({ group: group._id })
    .sort({ role: 1, joinedAt: 1 })
    .skip(startIndex)
    .limit(limit)
    .populate('user', 'name avatar position');

  const pagination = {
    total,
    pages: Math.ceil(total / limit),
    page,
    limit
  };

  res.status(200).json({
    success: true,
    data: members,
    pagination
  });
});

// @desc    Adicionar membro a um grupo
// @route   POST /api/groups/:id/members
// @access  Private (apenas admin do grupo)
export const addGroupMember = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const group = await Group.findById(req.params.id);

  if (!group) {
    return next(new ErrorResponse(`Grupo não encontrado com id ${req.params.id}`, 404));
  }

  // Verificar se o usuário é administrador do grupo
  const isAdmin = await GroupMember.findOne({
    group: group._id,
    user: req.user!._id,
    role: 'admin'
  });

  if (!isAdmin && req.user!.role !== 'admin') {
    return next(new ErrorResponse('Não autorizado para adicionar membros a este grupo', 403));
  }

  // Verificar se o usuário a ser adicionado já é membro do grupo
  const existingMember = await GroupMember.findOne({
    group: group._id,
    user: req.body.userId
  });

  if (existingMember) {
    return next(new ErrorResponse('Este usuário já é membro do grupo', 400));
  }

  // Criar novo membro
  const groupMember = await GroupMember.create({
    group: group._id,
    user: req.body.userId,
    role: req.body.role || 'member'
  });

  // Adicionar o ID do membro ao grupo
  group.members.push(groupMember._id);
  await group.save();

  // Obter detalhes do membro
  const member = await GroupMember.findById(groupMember._id).populate('user', 'name avatar position');

  res.status(201).json({
    success: true,
    data: member
  });
});

// @desc    Atualizar função de um membro do grupo
// @route   PUT /api/groups/:id/members/:userId
// @access  Private (apenas admin do grupo)
export const updateGroupMember = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const group = await Group.findById(req.params.id);

  if (!group) {
    return next(new ErrorResponse(`Grupo não encontrado com id ${req.params.id}`, 404));
  }

  // Verificar se o usuário é administrador do grupo
  const isAdmin = await GroupMember.findOne({
    group: group._id,
    user: req.user!._id,
    role: 'admin'
  });

  if (!isAdmin && req.user!.role !== 'admin') {
    return next(new ErrorResponse('Não autorizado para atualizar membros deste grupo', 403));
  }

  // Verificar se o membro existe
  let member = await GroupMember.findOne({
    group: group._id,
    user: req.params.userId
  });

  if (!member) {
    return next(new ErrorResponse('Membro não encontrado', 404));
  }

  // Atualizar função do membro
  member = await GroupMember.findOneAndUpdate(
    {
      group: group._id,
      user: req.params.userId
    },
    { role: req.body.role },
    {
      new: true,
      runValidators: true
    }
  ).populate('user', 'name avatar position');

  res.status(200).json({
    success: true,
    data: member
  });
});

// @desc    Remover membro de um grupo
// @route   DELETE /api/groups/:id/members/:userId
// @access  Private (apenas admin do grupo)
export const removeGroupMember = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const group = await Group.findById(req.params.id);

  if (!group) {
    return next(new ErrorResponse(`Grupo não encontrado com id ${req.params.id}`, 404));
  }

  // Verificar se o usuário é administrador do grupo
  const isAdmin = await GroupMember.findOne({
    group: group._id,
    user: req.user!._id,
    role: 'admin'
  });

  if (!isAdmin && req.user!.role !== 'admin') {
    return next(new ErrorResponse('Não autorizado para remover membros deste grupo', 403));
  }

  // Verificar se o membro existe
  const member = await GroupMember.findOne({
    group: group._id,
    user: req.params.userId
  });

  if (!member) {
    return next(new ErrorResponse('Membro não encontrado', 404));
  }

  // Verificar se o membro a ser removido é o único administrador do grupo
  if (member.role === 'admin') {
    const adminCount = await GroupMember.countDocuments({
      group: group._id,
      role: 'admin'
    });

    if (adminCount === 1) {
      return next(new ErrorResponse('Não é possível remover o único administrador do grupo', 400));
    }
  }

  // Remover o ID do membro do grupo
  group.members = group.members.filter(
    (m) => m.toString() !== member._id.toString()
  );
  await group.save();

  // Excluir o membro
  await member.deleteOne();

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Obter posts de um grupo
// @route   GET /api/groups/:id/posts
// @access  Private
export const getGroupPosts = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const group = await Group.findById(req.params.id);

  if (!group) {
    return next(new ErrorResponse(`Grupo não encontrado com id ${req.params.id}`, 404));
  }

  // Verificar se o grupo é privado e o usuário não está autenticado
  if (group.isPrivate && !req.user) {
    return next(new ErrorResponse('Não autorizado para acessar este grupo', 403));
  }

  // Verificar se o usuário é membro do grupo privado
  if (group.isPrivate && req.user) {
    const isMember = await GroupMember.findOne({
      group: group._id,
      user: req.user._id
    });

    if (!isMember && req.user.role !== 'admin') {
      return next(new ErrorResponse('Não autorizado para acessar este grupo', 403));
    }
  }

  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  const total = await Post.countDocuments({ group: group._id, isPublished: true });

  const posts = await Post.find({ group: group._id, isPublished: true })
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

// @desc    Obter arquivos de um grupo
// @route   GET /api/groups/:id/files
// @access  Private
export const getGroupFiles = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const group = await Group.findById(req.params.id);

  if (!group) {
    return next(new ErrorResponse(`Grupo não encontrado com id ${req.params.id}`, 404));
  }

  // Verificar se o grupo é privado e o usuário não está autenticado
  if (group.isPrivate && !req.user) {
    return next(new ErrorResponse('Não autorizado para acessar este grupo', 403));
  }

  // Verificar se o usuário é membro do grupo privado
  if (group.isPrivate && req.user) {
    const isMember = await GroupMember.findOne({
      group: group._id,
      user: req.user._id
    });

    if (!isMember && req.user.role !== 'admin') {
      return next(new ErrorResponse('Não autorizado para acessar este grupo', 403));
    }
  }

  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  const total = await File.countDocuments({ group: group._id });

  const files = await File.find({ group: group._id })
    .sort({ createdAt: -1 })
    .skip(startIndex)
    .limit(limit)
    .populate('owner', 'name avatar position');

  const pagination = {
    total,
    pages: Math.ceil(total / limit),
    page,
    limit
  };

  res.status(200).json({
    success: true,
    data: files,
    pagination
  });
});

// @desc    Obter eventos de um grupo
// @route   GET /api/groups/:id/events
// @access  Private
export const getGroupEvents = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const group = await Group.findById(req.params.id);

  if (!group) {
    return next(new ErrorResponse(`Grupo não encontrado com id ${req.params.id}`, 404));
  }

  // Verificar se o grupo é privado e o usuário não está autenticado
  if (group.isPrivate && !req.user) {
    return next(new ErrorResponse('Não autorizado para acessar este grupo', 403));
  }

  // Verificar se o usuário é membro do grupo privado
  if (group.isPrivate && req.user) {
    const isMember = await GroupMember.findOne({
      group: group._id,
      user: req.user._id
    });

    if (!isMember && req.user.role !== 'admin') {
      return next(new ErrorResponse('Não autorizado para acessar este grupo', 403));
    }
  }

  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  const total = await Event.countDocuments({ group: group._id });

  const events = await Event.find({ group: group._id })
    .sort({ startDate: 1 })
    .skip(startIndex)
    .limit(limit)
    .populate('creator', 'name avatar position');

  const pagination = {
    total,
    pages: Math.ceil(total / limit),
    page,
    limit
  };

  res.status(200).json({
    success: true,
    data: events,
    pagination
  });
});