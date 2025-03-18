import express from 'express';
import {
  getFiles,
  getFile,
  uploadFile,
  deleteFile,
  getSharedFiles,
  shareFile,
  removeFileShare
} from '../controllers/fileController';
import { protect } from '../middleware/auth';
import { uploadDocument } from '../middleware/upload';

const router = express.Router();

// Aplicar middleware de proteção a todas as rotas
router.use(protect);

// @route   GET /api/files
// @desc    Obter todos os arquivos do usuário
// @access  Private
router.get('/', getFiles);

// @route   GET /api/files/:id
// @desc    Obter arquivo por ID
// @access  Private
router.get('/:id', getFile);

// @route   POST /api/files
// @desc    Fazer upload de arquivo
// @access  Private
router.post('/', uploadDocument, uploadFile);

// @route   DELETE /api/files/:id
// @desc    Excluir arquivo
// @access  Private
router.delete('/:id', deleteFile);

// @route   GET /api/files/shared
// @desc    Obter arquivos compartilhados com o usuário
// @access  Private
router.get('/shared', getSharedFiles);

// @route   POST /api/files/:id/share
// @desc    Compartilhar arquivo com usuário
// @access  Private
router.post('/:id/share', shareFile);

// @route   DELETE /api/files/:id/share/:userId
// @desc    Remover compartilhamento de arquivo
// @access  Private
router.delete('/:id/share/:userId', removeFileShare);

export default router;