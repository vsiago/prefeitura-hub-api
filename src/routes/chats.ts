import express from 'express';
import { 
  getChats,
  getChat,
  createChat,
  updateChat,
  deleteChat,
  getMessages,
  sendMessage,
  updateMessage,
  deleteMessage,
  markMessagesAsRead
} from '../controllers/chatController';
import { protect } from '../middleware/auth';
import { processMessageMediaUpload } from '../middleware/upload';
import { validateMongoId } from '../middleware/validate';
import { logActivity } from '../middleware/activity';

const router = express.Router();

// Todas as rotas de chat são protegidas
router.use(protect);

// Rotas para chats
router.get('/', getChats);
router.get('/:id', validateMongoId, getChat);
router.post(
  '/', 
  logActivity('create', 'chat'),
  createChat
);
router.put(
  '/:id', 
  validateMongoId,
  logActivity('update', 'chat'),
  updateChat
);
router.delete(
  '/:id', 
  validateMongoId,
  logActivity('delete', 'chat'),
  deleteChat
);

// Rotas para mensagens
router.get(
  '/:id/messages', 
  validateMongoId,
  getMessages
);
router.post(
  '/:id/messages', 
  validateMongoId,
  processMessageMediaUpload,
  logActivity('create', 'message'),
  sendMessage
);
router.put(
  '/:id/messages/:messageId', 
  validateMongoId,
  logActivity('update', 'message'),
  updateMessage
);
router.delete(
  '/:id/messages/:messageId', 
  validateMongoId,
  logActivity('delete', 'message'),
  deleteMessage
);

// Rota para marcar mensagens como lidas
router.post(
  '/:id/read', 
  validateMongoId,
  logActivity('update', 'message'),
  markMessagesAsRead
);

export default router;