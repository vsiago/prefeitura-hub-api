import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { asyncHandler } from './async';
import ErrorResponse from '../utils/errorResponse';
import User from '../models/User';

// Proteger rotas
export const protect = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    // Obter token do header
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies?.token) {
    // Obter token dos cookies
    token = req.cookies.token;
  }

  // Verificar se o token existe
  if (!token) {
    return next(new ErrorResponse('Não autorizado para acessar esta rota', 401));
  }

  try {
    // Verificar token
    const decoded = jwt.verify(token, process.env.JWT_SECRET) as { id: string };

    // Obter usuário pelo ID
    const user = await User.findById(decoded.id);

    if (!user) {
      return next(new ErrorResponse('Usuário não encontrado', 404));
    }

    // Verificar se o usuário está ativo
    if (!user.isActive) {
      return next(new ErrorResponse('Conta desativada. Entre em contato com o administrador', 403));
    }

    // Atualizar último acesso
    user.lastActive = new Date();
    await user.save({ validateBeforeSave: false });

    // Adicionar usuário à requisição
    req.user = user;
    next();
  } catch (err) {
    return next(new ErrorResponse('Não autorizado para acessar esta rota', 401));
  }
});

// Conceder acesso a funções específicas
export const authorize = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new ErrorResponse('Não autorizado para acessar esta rota', 401));
    }

    if (!roles.includes(req.user.role)) {
      return next(
        new ErrorResponse(
          `Função ${req.user.role} não está autorizada a acessar esta rota`,
          403
        )
      );
    }
    next();
  };
};

// Verificar propriedade do recurso
export const checkOwnership = (model: any) => async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return next(new ErrorResponse('Não autorizado para acessar esta rota', 401));
    }

    // Administradores podem acessar qualquer recurso
    if (req.user.role === 'admin') {
      return next();
    }

    const resource = await model.findById(req.params.id);

    if (!resource) {
      return next(new ErrorResponse(`Recurso não encontrado com id ${req.params.id}`, 404));
    }

    // Verificar se o usuário é o proprietário do recurso
    if (resource.user && resource.user.toString() !== req.user._id.toString() &&
        resource.author && resource.author.toString() !== req.user._id.toString() &&
        resource.owner && resource.owner.toString() !== req.user._id.toString() &&
        resource.creator && resource.creator.toString() !== req.user._id.toString()) {
      return next(new ErrorResponse('Não autorizado para acessar este recurso', 403));
    }

    next();
  } catch (err) {
    return next(new ErrorResponse('Erro ao verificar propriedade do recurso', 500));
  }
};