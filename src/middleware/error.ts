import { Request, Response, NextFunction } from 'express';
import ErrorResponse from '../utils/errorResponse';

const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  let error = { ...err };
  error.message = err.message;

  // Log para o console para desenvolvimento
  console.log(err.stack);

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = `Recurso não encontrado com id ${err.value}`;
    error = new ErrorResponse(message, 404);
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const value = err.keyValue[field];
    const message = `Valor duplicado para o campo ${field}: ${value}`;
    error = new ErrorResponse(message, 400);
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map((val: any) => val.message).join(', ');
    error = new ErrorResponse(message, 400);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    error = new ErrorResponse('Token inválido', 401);
  }

  if (err.name === 'TokenExpiredError') {
    error = new ErrorResponse('Token expirado', 401);
  }

  // Multer errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    error = new ErrorResponse('Arquivo muito grande', 400);
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    error = new ErrorResponse('Tipo de arquivo não suportado', 400);
  }

  res.status(error.statusCode || 500).json({
    success: false,
    error: error.message || 'Erro do servidor',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
};

export default errorHandler;