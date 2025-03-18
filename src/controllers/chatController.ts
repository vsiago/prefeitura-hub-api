import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import Chat from '../models/Chat';
import Message from '../models/Message';
import User from '../models/User';
import Notification from '../models/Notification';
import ErrorResponse from '../utils/errorResponse';
import asyncHandler from 'express-async-handler';

// @desc    Obter todas as conversas do usuário
// @route   GET /api/chats
// @access  Private
export const getChats = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const chats = await Chat.find({
    participants: { $in: [req.user.id] }
  })
    .populate('participants', 'name avatar')
    .populate('lastMessage')
    .sort({ updatedAt: -1 });

  res.status(200).json({
    success: true,
    count: chats.length,
    data: chats
  });
});

// @desc    Obter conversa por ID
// @route   GET /api/chats/:id
// @access  Private
export const getChat = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const chat = await Chat.findById(req.params.id)
    .populate('participants', 'name avatar')
    .populate('lastMessage');

  if (!chat) {
    return next(new ErrorResponse(`Conversa não encontrada com id ${req.params.id}`, 404));
  }

  // Verificar se o usuário é participante da conversa
  if (!chat.participants.some((p: any) => p._id.toString() === req.user.id)) {
    return next(new ErrorResponse(`Usuário não é participante desta conversa`, 403));
  }

  res.status(200).json({
    success: true,
    data: chat
  });
});

// @desc    Criar nova conversa
// @route   POST /api/chats
// @access  Private
export const createChat = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { participants, isGroup, name } = req.body;

  // Verificar se todos os participantes existem
  for (const participantId of participants) {
    const user = await User.findById(participantId);
    if (!user) {
      return next(new ErrorResponse(`Usuário não encontrado com id ${participantId}`, 404));
    }
  }

  // Adicionar o usuário atual aos participantes se não estiver incluído
  if (!participants.includes(req.user.id)) {
    participants.push(req.user.id);
  }

  // Para conversas individuais, verificar se já existe uma conversa entre os participantes
  if (!isGroup && participants.length === 2) {
    const existingChat = await Chat.findOne({
      isGroup: false,
      participants: { $all: participants, $size: 2 }
    });

    if (existingChat) {
      return res.status(200).json({
        success: true,
        data: existingChat
      });
    }
  }

  // Criar nova conversa
  const chat = await Chat.create({
    participants,
    isGroup,
    name: isGroup ? name : undefined
  });

  res.status(201).json({
    success: true,
    data: chat
  });
});

// @desc    Excluir conversa
// @route   DELETE /api/chats/:id
// @access  Private
export const deleteChat = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const chat = await Chat.findById(req.params.id);

  if (!chat) {
    return next(new ErrorResponse(`Conversa não encontrada com id ${req.params.id}`, 404));
  }

  // Verificar se o usuário é participante da conversa
  if (!chat.participants.includes(req.user.id)) {
    return next(new ErrorResponse(`Usuário não é participante desta conversa`, 403));
  }

  // Para conversas em grupo, apenas o criador pode excluir
  if (chat.isGroup && chat.participants[0].toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new ErrorResponse(`Apenas o criador pode excluir esta conversa em grupo`, 403));
  }

  // Excluir todas as mensagens da conversa
  await Message.deleteMany({ chat: chat._id });

  await chat.remove();

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Obter mensagens de uma conversa
// @route   GET /api/chats/:id/messages
// @access  Private
export const getMessages = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const chat = await Chat.findById(req.params.id);

  if (!chat) {
    return next(new ErrorResponse(`Conversa não encontrada com id ${req.params.id}`, 404));
  }

  // Verificar se o usuário é participante da conversa
  if (!chat.participants.includes(req.user.id)) {
    return next(new ErrorResponse(`Usuário não é participante desta conversa`, 403));
  }

  const messages = await Message.find({ chat: chat._id })
    .populate('sender', 'name avatar')
    .sort({ createdAt: 1 });

  res.status(200).json({
    success: true,
    count: messages.length,
    data: messages
  });
});

// @desc    Enviar mensagem
// @route   POST /api/chats/:id/messages
// @access  Private
export const sendMessage = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const chat = await Chat.findById(req.params.id);

  if (!chat) {
    return next(new ErrorResponse(`Conversa não encontrada com id ${req.params.id}`, 404));
  }

  // Verificar se o usuário é participante da conversa
  if (!chat.participants.includes(req.user.id)) {
    return next(new ErrorResponse(`Usuário não é participante desta conversa`, 403));
  }

  // Adicionar mídia se houver
  let media = [];
  if (req.files && Array.isArray(req.files)) {
    media = req.files.map((file: any) => file.path);
  }

  // Criar mensagem
  const message = await Message.create({
    chat: chat._id,
    sender: req.user.id,
    content: req.body.content,
    media,
    readBy: [req.user.id] // Marcar como lida pelo remetente
  });

  // Atualizar última mensagem da conversa
  chat.lastMessage = message._id;
  await chat.save();

  // Criar notificações para os outros participantes
  for (const participantId of chat.participants) {
    if (participantId.toString() !== req.user.id) {
      await Notification.create({
        recipient: participantId,
        type: 'message',
        content: `Nova mensagem de ${req.user.name}`,
        relatedTo: {
          type: 'chat',
          id: chat._id
        }
      });
    }
  }

  res.status(201).json({
    success: true,
    data: message
  });
});

// @desc    Editar mensagem
// @route   PUT /api/chats/:id/messages/:messageId
// @access  Private
export const editMessage = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const chat = await Chat.findById(req.params.id);

  if (!chat) {
    return next(new ErrorResponse(`Conversa não encontrada com id ${req.params.id}`, 404));
  }

  // Verificar se o usuário é participante da conversa
  if (!chat.participants.includes(req.user.id)) {
    return next(new ErrorResponse(`Usuário não é participante desta conversa`, 403));
  }

  let message = await Message.findById(req.params.messageId);

  if (!message) {
    return next(new ErrorResponse(`Mensagem não encontrada com id ${req.params.messageId}`, 404));
  }

  // Verificar se a mensagem pertence à conversa
  if (message.chat.toString() !== req.params.id) {
    return next(new ErrorResponse(`Mensagem não pertence a esta conversa`, 400));
  }

  // Verificar se o usuário é o remetente da mensagem
  if (message.sender.toString() !== req.user.id) {
    return next(new ErrorResponse(`Apenas o remetente pode editar esta mensagem`, 403));
  }

  // Verificar se a mensagem foi enviada há menos de 15 minutos
  const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
  if (message.createdAt < fifteenMinutesAgo) {
    return next(new ErrorResponse(`Não é possível editar mensagens enviadas há mais de 15 minutos`, 400));
  }

  message = await Message.findByIdAndUpdate(
    req.params.messageId,
    {
      content: req.body.content,
      isEdited: true
    },
    { new: true, runValidators: true }
  );

  res.status(200).json({
    success: true,
    data: message
  });
});

// @desc    Excluir mensagem
// @route   DELETE /api/chats/:id/messages/:messageId
// @access  Private
export const deleteMessage = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const chat = await Chat.findById(req.params.id);

  if (!chat) {
    return next(new ErrorResponse(`Conversa não encontrada com id ${req.params.id}`, 404));
  }

  // Verificar se o usuário é participante da conversa
  if (!chat.participants.includes(req.user.id)) {
    return next(new ErrorResponse(`Usuário não é participante desta conversa`, 403));
  }

  const message = await Message.findById(req.params.messageId);

  if (!message) {
    return next(new ErrorResponse(`Mensagem não encontrada com id ${req.params.messageId}`, 404));
  }

  // Verificar se a mensagem pertence à conversa
  if (message.chat.toString() !== req.params.id) {
    return next(new ErrorResponse(`Mensagem não pertence a esta conversa`, 400));
  }

  // Verificar se o usuário é o remetente da mensagem ou admin
  if (message.sender.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new ErrorResponse(`Apenas o remetente pode excluir esta mensagem`, 403));
  }

  await message.remove();

  // Atualizar última mensagem da conversa se necessário
  if (chat.lastMessage && chat.lastMessage.toString() === req.params.messageId) {
    const lastMessage = await Message.findOne({ chat: chat._id }).sort({ createdAt: -1 });
    chat.lastMessage = lastMessage ? lastMessage._id : undefined;
    await chat.save();
  }

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Marcar conversa como lida
// @route   PUT /api/chats/:id/read
// @access  Private
export const markAsRead = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const chat = await Chat.findById(req.params.id);

  if (!chat) {
    return next(new ErrorResponse(`Conversa não encontrada com id ${req.params.id}`, 404));
  }

  // Verificar se o usuário é participante da conversa
  if (!chat.participants.includes(req.user.id)) {
    return next(new ErrorResponse(`Usuário não é participante desta conversa`, 403));
  }

  // Marcar todas as mensagens não lidas como lidas
  await Message.updateMany(
    {
      chat: chat._id,
      readBy: { $ne: req.user.id }
    },
    {
      $addToSet: { readBy: req.user.id }
    }
  );

  res.status(200).json({
    success: true,
    data: {}
  });
});