import express from 'express';

const router = express.Router();

// Importar controladores individualmente para evitar problemas de desestruturação
import * as userController from '../controllers/userController';

// Definir rotas sem middlewares primeiro
router.get('/admin/users', userController.getUsers);
router.get('/admin/users/:id', userController.getUser);
router.post('/admin/users', userController.createUser);
router.put('/admin/users/:id', userController.updateUser);
router.delete('/admin/users/:id', userController.deleteUser);

router.get('/profile', userController.getUserProfile);
router.put('/profile', userController.updateProfile);
router.put('/password', userController.updatePassword);

router.get('/notifications/settings', userController.getUserNotificationSettings);
router.put('/notifications/settings', userController.updateUserNotificationSettings);

export default router;