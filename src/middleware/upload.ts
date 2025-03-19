import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import ErrorResponse from '../utils/errorResponse';

// Configuração de armazenamento para diferentes tipos de arquivos
const createStorage = (folder: string) => {
  return multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadPath = path.join(process.cwd(), 'uploads', folder);

      // Criar diretório se não existir
      if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath, { recursive: true });
      }

      cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = `${Date.now()}-${uuidv4()}`;
      const ext = path.extname(file.originalname);
      cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
    }
  });
};

// Filtro para verificar tipos de arquivo
const fileFilter = (allowedTypes: string[]) => (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const mimeType = file.mimetype.toLowerCase();

  if (allowedTypes.includes(mimeType)) {
    cb(null, true);
  } else {
    cb(new Error(`Tipo de arquivo não suportado. Tipos permitidos: ${allowedTypes.join(', ')}`));
  }
};

// Configurações para diferentes tipos de upload
const uploadConfigs = {
  message: {
    storage: createStorage('messages'),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter: fileFilter(['image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'audio/mpeg', 'application/pdf'])
  },

  document: {
    storage: createStorage('documents'),
    limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
    fileFilter: fileFilter([
      'application/pdf',
      'application/msword', // .doc
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
      'application/vnd.ms-excel', // .xls
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/zip',
      'text/csv',
      'text/plain'
    ])
  }
};

// Middleware para upload de mídia de mensagem
export const uploadMessageMedia = multer(uploadConfigs.message).array('media', 10);

// Middleware para upload de documentos
export const uploadDocument = multer(uploadConfigs.document).array('documents', 5);

// Middleware para processar upload de mídia de mensagem
export const processMessageMediaUpload = (req: Request, res: Response, next: NextFunction) => {
  uploadMessageMedia(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return next(new ErrorResponse('Arquivo muito grande', 400));
      }
      if (err.code === 'LIMIT_UNEXPECTED_FILE') {
        return next(new ErrorResponse('Tipo de arquivo não suportado', 400));
      }
    }
    if (err) {
      return next(new ErrorResponse(err.message, 400));
    }
    next();
  });
};

// Middleware para processar upload de documentos
export const processDocumentUpload = (req: Request, res: Response, next: NextFunction) => {
  uploadDocument(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return next(new ErrorResponse('Arquivo muito grande', 400));
      }
      if (err.code === 'LIMIT_UNEXPECTED_FILE') {
        return next(new ErrorResponse('Tipo de arquivo não suportado', 400));
      }
    }
    if (err) {
      return next(new ErrorResponse(err.message, 400));
    }
    next();
  });
};
