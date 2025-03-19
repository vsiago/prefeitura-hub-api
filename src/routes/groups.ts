import express from 'express';
import { 
  getGroups,
  getGroup,
  createGroup,
  updateGroup,
  deleteGroup,
  joinGroup,
  leaveGroup,
  getGroupMembers,
  addGroupMember,
  updateGroupMember,
  removeGroupMember,
  getGroupPosts,
  getGroupFiles,
  getGroupEvents
} from '../controllers/groupController';
import { protect, authorize, checkOwnership } from '../middleware/auth';
import { processGroupImageUpload } from '../middleware/upload';
import { validateMongoId } from '../middleware/validate';
import { logActivity } from '../middleware/activity';
import Group from '../models/Group';

const router = express.Router();

// Rotas públicas
router.get('/', getGroups);
router.get('/:id', validateMongoId, getGroup);

// Rotas protegidas
router.use(protect);

// Rotas para criar, atualizar e excluir grupos
router.post('/', createGroup);

router.put('/:id', updateGroup);

router.delete(
  '/:id', 
  validateMongoId, 
  checkOwnership(Group),
  logActivity('delete', 'group'),
  deleteGroup
);

// Rotas para membros do grupo
router.get(
  '/:id/members', 
  validateMongoId,
  getGroupMembers
);

router.post(
  '/:id/members', 
  validateMongoId,
  logActivity('create', 'group'),
  addGroupMember
);

router.put(
  '/:id/members/:userId', 
  validateMongoId,
  logActivity('update', 'group'),
  updateGroupMember
);

router.delete(
  '/:id/members/:userId', 
  validateMongoId,
  logActivity('delete', 'group'),
  removeGroupMember
);

// Rotas para entrar/sair de grupos
router.post(
  '/:id/join', 
  validateMongoId,
  logActivity('update', 'group'),
  joinGroup
);

router.delete(
  '/:id/leave', 
  validateMongoId,
  logActivity('update', 'group'),
  leaveGroup
);

// Rotas para obter posts, arquivos e eventos do grupo
router.get(
  '/:id/posts', 
  validateMongoId,
  getGroupPosts
);

router.get(
  '/:id/files', 
  validateMongoId,
  getGroupFiles
);

router.get(
  '/:id/events', 
  validateMongoId,
  getGroupEvents
);

export default router;