import express from 'express';
import { 
  getPosts,
  getPost,
  createPost,
  updatePost,
  deletePost,
  likePost,
  unlikePost,
  getPostsByUser,
  getPostsByDepartment,
  getPostsByGroup
} from '../controllers/postController';
import { protect, authorize, checkOwnership } from '../middleware/auth';
import { processPostMediaUpload } from '../middleware/upload';
import { validateMongoId } from '../middleware/validate';
import { logActivity } from '../middleware/activity';
import Post from '../models/Post';

const router = express.Router();

// Rotas públicas
router.get('/', getPosts);
router.get('/:id', validateMongoId, getPost);

// Rotas protegidas
router.use(protect);

// Rotas para posts do usuário
router.get('/user/:userId', validateMongoId, getPostsByUser);

// Rotas para posts do departamento
router.get('/department/:departmentId', validateMongoId, getPostsByDepartment);

// Rotas para posts do grupo
router.get('/group/:groupId', validateMongoId, getPostsByGroup);

// Rotas para criar, atualizar e excluir posts
router.post('/', createPost);

router.put('/:id', updatePost);

router.delete(
  '/:id', 
  validateMongoId, 
  checkOwnership(Post),
  logActivity('delete', 'post'),
  deletePost
);

// Rotas para curtir/descurtir posts
router.post(
  '/:id/like', 
  validateMongoId,
  logActivity('update', 'post'),
  likePost
);

router.delete(
  '/:id/like', 
  validateMongoId,
  logActivity('update', 'post'),
  unlikePost
);

export default router;