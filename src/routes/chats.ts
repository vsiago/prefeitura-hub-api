import express from 'express';
import { check } from 'express-validator';
import {
  getChats,
  getChat,
  createChat,
  deleteChat,
  getMessages,
  sendMessage,
  editMessage,
  deleteMessage,
  markAsRead
} from '../controllers/chatController';
import { protect } from '../middleware/auth';
import { uploadMedia } from '../middleware/upload';

const router = express.Router();

// Aplicar middleware de proteção a todas as rotas
router.use(protect);

// @route   GET /api/chats
// @desc    Obter todas as conversas do usuário
// @access  Private
router.get('/', getChats);

// @route   GET /api/chats/:id
// @desc    Obter conversa por ID
// @access  Private
router.get('/:id', getChat);

// @route   POST /api/chats
// @desc    Criar uma nova conversa
// @access  Private
router.post(
  '/',
  [
    check('participants', 'Participantes são obrigatórios').isArray({ min: 1 }),
    check('isGroup', 'isGroup é obrigatório').isBoolean(),
    check('name', 'Nome é obrigatório para grupos').if((value, { req }) => req.body.isGroup).not().isEmpty()
  ],
  createChat
);

// @route   DELETE /api/chats/:id
// @desc    Excluir conversa
// @access  Private
router.delete('/:id', deleteChat);

// @route   GET /api/chats/:id/messages
// @desc    Obter mensagens de uma conversa
// @access  Private
router.get('/:id/messages', getMessages);

// @route   POST /api/chats/:id/messages
// @desc    Enviar mensagem
// @access  Private
router.post(
  '/:id/messages',
  [
    uploadMedia,
    check('content', 'Conteúdo é obrigatório').not().isEmpty()
  ],
  sendMessage
);

// @route   PUT /api/chats/:id/messages/:messageId
// @desc    Editar mensagem
// @access  Private
router.put(
  '/:id/messages/:messageId',
  [check('content', 'Conteúdo é obrigatório').not().isEmpty()],
  editMessage
);

// @route   DELETE /api/chats/:id/messages/:messageId
// @desc    Excluir mensagem
// @access  Private
router.delete('/:id/messages/:messageId', deleteMessage);

// @route   PUT /api/chats/:id/read
// @desc    Marcar conversa como lida
// @access  Private
router.put('/:id/read', markAsRead);

export default router;