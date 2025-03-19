import { Request, Response, NextFunction } from 'express';
import { asyncHandler } from '../middleware/async';
import ErrorResponse from '../utils/errorResponse';
import Chat from '../models/Chat';
import Message from '../models/Message';
import User from '../models/User';

// @desc    Obter todos os chats do usuário
// @route   GET /api/chats
// @access  Private
export const getChats = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  
  // Obter chats onde o usuário é participante
  const total = await Chat.countDocuments({ participants: req.user!._id });

  const chats = await Chat.find({ participants: req.user!._id })
    .sort({ updatedAt: -1 })
    .skip(startIndex)
    .limit(limit)
    .populate('participants', 'name avatar position')
    .populate('lastMessage');

  const pagination = {
    total,
    pages: Math.ceil(total / limit),
    page,
    limit
  };

  res.status(200).json({
    success: true,
    data: chats,
    pagination
  });
});

// @desc    Obter um chat específico
// @route   GET /api/chats/:id
// @access  Private
export const getChat = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const chat = await Chat.findById(req.params.id)
    .populate('participants', 'name avatar position')
    .populate('lastMessage');

  if (!chat) {
    return next(new ErrorResponse(`Chat não encontrado com id ${req.params.id}`, 404));
  }

  // Verificar se o usuário é participante do chat
  if (!chat.participants.some(p => p._id.toString() === req.user!._id.toString())) {
    return next(new ErrorResponse('Não autorizado para acessar este chat', 403));
  }

  res.status(200).json({
    success: true,
    data: chat
  });
});

// @desc    Criar um novo chat
// @route   POST /api/chats
// @access  Private
export const createChat = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  // Verificar se os participantes existem
  const participants = req.body.participants || [];
  
  // Adicionar o usuário atual aos participantes se não estiver incluído
  if (!participants.includes(req.user!._id.toString())) {
    participants.push(req.user!._id);
  }

  // Verificar se já existe um chat com os mesmos participantes (para chats individuais)
  if (participants.length === 2 && !req.body.isGroup) {
    const existingChat = await Chat.findOne({
      participants: { $all: participants, $size: 2 },
      isGroup: false
    });

    if (existingChat) {
      return res.status(200).json({
        success: true,
        data: existingChat
      });
    }
  }

  // Criar o chat
  const chat = await Chat.create({
    participants,
    isGroup: req.body.isGroup || false,
    name: req.body.name
  });

  // Obter o chat com os participantes populados
  const populatedChat = await Chat.findById(chat._id)
    .populate('participants', 'name avatar position');

  res.status(201).json({
    success: true,
    data: populatedChat
  });
});

// @desc    Atualizar um chat
// @route   PUT /api/chats/:id
// @access  Private
export const updateChat = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  let chat = await Chat.findById(req.params.id);

  if (!chat) {
    return next(new ErrorResponse(`Chat não encontrado com id ${req.params.id}`, 404));
  }

  // Verificar se o usuário é participante do chat
  if (!chat.participants.includes(req.user!._id)) {
    return next(new ErrorResponse('Não autorizado para atualizar este chat', 403));
  }

  // Apenas chats em grupo podem ser atualizados
  if (!chat.isGroup) {
    return next(new ErrorResponse('Apenas chats em grupo podem ser atualizados', 400));
  }

  chat = await Chat.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  }).populate('participants', 'name avatar position');

  res.status(200).json({
    success: true,
    data: chat
  });
});

// @desc    Excluir um chat
// @route   DELETE /api/chats/:id
// @access  Private
export const deleteChat = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const chat = await Chat.findById(req.params.id);

  if (!chat) {
    return next(new ErrorResponse(`Chat não encontrado com id ${req.params.id}`, 404));
  }

  // Verificar se o usuário é participante do chat
  if (!chat.participants.includes(req.user!._id)) {
    return next(new ErrorResponse('Não autorizado para excluir este chat', 403));
  }

  // Excluir todas as mensagens do chat
  await Message.deleteMany({ chat: chat._id });

  // Excluir o chat
  await chat.deleteOne();

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Obter mensagens de um chat
// @route   GET /api/chats/:id/messages
// @access  Private
export const getMessages = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const chat = await Chat.findById(req.params.id);

  if (!chat) {
    return next(new ErrorResponse(`Chat não encontrado com id ${req.params.id}`, 404));
  }

  // Verificar se o usuário é participante do chat
  if (!chat.participants.includes(req.user!._id)) {
    return next(new ErrorResponse('Não autorizado para acessar este chat', 403));
  }

  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  const total = await Message.countDocuments({ chat: chat._id });

  const messages = await Message.find({ chat: chat._id })
    .sort({ createdAt: -1 }) // Mais recentes primeiro
    .skip(startIndex)
    .limit(limit)
    .populate('sender', 'name avatar position');

  const pagination = {
    total,
    pages: Math.ceil(total / limit),
    page,
    limit
  };

  res.status(200).json({
    success: true,
    data: messages.reverse(), // Inverter para ordem cronológica
    pagination
  });
});

// @desc    Enviar uma mensagem
// @route   POST /api/chats/:id/messages
// @access  Private
export const sendMessage = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const chat = await Chat.findById(req.params.id);

  if (!chat) {
    return next(new ErrorResponse(`Chat não encontrado com id ${req.params.id}`, 404));
  }

  // Verificar se o usuário é participante do chat
  if (!chat.participants.includes(req.user!._id)) {
    return next(new ErrorResponse('Não autorizado para enviar mensagens neste chat', 403));
  }

  // Processar arquivos de mídia, se houver
  if (req.files && Array.isArray(req.files)) {
    req.body.media = req.files.map((file: Express.Multer.File) => `/uploads/messages/${file.filename}`);
  }

  // Criar a mensagem
  const message = await Message.create({
    chat: chat._id,
    sender: req.user!._id,
    content: req.body.content,
    media: req.body.media || [],
    readBy: [req.user!._id] // O remetente já leu a mensagem
  });

  // Atualizar o lastMessage do chat
  chat.lastMessage = message._id;
  chat.updatedAt = new Date();
  await chat.save();

  // Obter a mensagem com o remetente populado
  const populatedMessage = await Message.findById(message._id)
    .populate('sender', 'name avatar position');

  res.status(201).json({
    success: true,
    data: populatedMessage
  });
});

// @desc    Atualizar uma mensagem
// @route   PUT /api/chats/:id/messages/:messageId
// @access  Private
export const updateMessage = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const chat = await Chat.findById(req.params.id);

  if (!chat) {
    return next(new ErrorResponse(`Chat não encontrado com id ${req.params.id}`, 404));
  }

  // Verificar se o usuário é participante do chat
  if (!chat.participants.includes(req.user!._id)) {
    return next(new ErrorResponse('Não autorizado para atualizar mensagens neste chat', 403));
  }

  let message = await Message.findById(req.params.messageId);

  if (!message) {
    return next(new ErrorResponse(`Mensagem não encontrada com id ${req.params.messageId}`, 404));
  }

  // Verificar se o usuário é o remetente da mensagem
  if (message.sender.toString() !== req.user!._id.toString()) {
    return next(new ErrorResponse('Não autorizado para atualizar esta mensagem', 403));
  }

  // Verificar se a mensagem foi enviada há mais de 5 minutos
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  if (message.createdAt < fiveMinutesAgo) {
    return next(new ErrorResponse('Não é possível editar mensagens enviadas há mais de 5 minutos', 400));
  }

  // Atualizar a mensagem
  message = await Message.findByIdAndUpdate(
    req.params.messageId,
    {
      content: req.body.content,
      isEdited: true
    },
    {
      new: true,
      runValidators: true
    }
  ).populate('sender', 'name avatar position');

  res.status(200).json({
    success: true,
    data: message
  });
});

// @desc    Excluir uma mensagem
// @route   DELETE /api/chats/:id/messages/:messageId
// @access  Private
export const deleteMessage = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const chat = await Chat.findById(req.params.id);

  if (!chat) {
    return next(new ErrorResponse(`Chat não encontrado com id ${req.params.id}`, 404));
  }

  // Verificar se o usuário é participante do chat
  if (!chat.participants.includes(req.user!._id)) {
    return next(new ErrorResponse('Não autorizado para excluir mensagens neste chat', 403));
  }

  const message = await Message.findById(req.params.messageId);

  if (!message) {
    return next(new ErrorResponse(`Mensagem não encontrada com id ${req.params.messageId}`, 404));
  }

  // Verificar se o usuário é o remetente da mensagem
  if (message.sender.toString() !== req.user!._id.toString()) {
    return next(new ErrorResponse('Não autorizado para excluir esta mensagem', 403));
  }

  // Verificar se esta mensagem é a última do chat
  if (chat.lastMessage && chat.lastMessage.toString() === message._id.toString()) {
    // Encontrar a mensagem anterior para atualizar lastMessage
    const previousMessage = await Message.findOne({
      chat: chat._id,
      _id: { $ne: message._id }
    }).sort({ createdAt: -1 });

    if (previousMessage) {
      chat.lastMessage = previousMessage._id;
    } else {
      chat.lastMessage = undefined;
    }
    
    await chat.save();
  }

  // Excluir a mensagem
  await message.deleteOne();

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Marcar mensagens como lidas
// @route   POST /api/chats/:id/read
// @access  Private
export const markMessagesAsRead = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const chat = await Chat.findById(req.params.id);

  if (!chat) {
    return next(new ErrorResponse(`Chat não encontrado com id ${req.params.id}`, 404));
  }

  // Verificar se o usuário é participante do chat
  if (!chat.participants.includes(req.user!._id)) {
    return next(new ErrorResponse('Não autorizado para acessar este chat', 403));
  }

  // Marcar todas as mensagens não lidas como lidas
  await Message.updateMany(
    {
      chat: chat._id,
      readBy: { $ne: req.user!._id }
    },
    {
      $addToSet: { readBy: req.user!._id }
    }
  );

  res.status(200).json({
    success: true,
    message: 'Mensagens marcadas como lidas'
  });
});