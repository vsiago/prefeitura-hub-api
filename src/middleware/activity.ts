import { Request, Response, NextFunction } from 'express';
import ActivityLog from '../models/ActivityLog';
import { asyncHandler } from './async';

// Middleware para registrar atividade do usuário
export const logActivity = (action: string, entityType: string) => {
  return asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    // Verificar se o usuário está autenticado
    if (!req.user) {
      return next();
    }

    // Obter ID da entidade
    let entityId = req.params.id;

    // Para ações de criação, obter o ID da resposta
    if (action === 'create' && res.locals.resourceId) {
      entityId = res.locals.resourceId;
    }

    // Não registrar se não houver ID de entidade (exceto para login/logout)
    if (!entityId && !['login', 'logout'].includes(action)) {
      return next();
    }

    try {
      // Criar log de atividade
      await ActivityLog.create({
        user: req.user._id,
        action,
        entity: {
          type: entityType,
          id: entityId || req.user._id // Para login/logout, usar ID do usuário
        },
        details: getActivityDetails(req, action, entityType),
        ip: req.ip,
        userAgent: req.get('user-agent')
      });
    } catch (error) {
      // Não interromper o fluxo se houver erro no registro de atividade
      console.error('Erro ao registrar atividade:', error);
    }

    next();
  });
};

// Função para obter detalhes da atividade
const getActivityDetails = (req: Request, action: string, entityType: string): string => {
  switch (action) {
    case 'login':
      return 'Usuário realizou login no sistema';
    case 'logout':
      return 'Usuário realizou logout do sistema';
    case 'create':
      return `Usuário criou ${entityType}`;
    case 'update':
      return `Usuário atualizou ${entityType}`;
    case 'delete':
      return `Usuário excluiu ${entityType}`;
    case 'view':
      return `Usuário visualizou ${entityType}`;
    case 'download':
      return `Usuário baixou ${entityType}`;
    case 'upload':
      return `Usuário enviou ${entityType}`;
    case 'share':
      return `Usuário compartilhou ${entityType}`;
    default:
      return `Usuário realizou ação ${action} em ${entityType}`;
  }
};

// Middleware para registrar login
export const logLogin = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  if (req.user) {
    try {
      await ActivityLog.create({
        user: req.user._id,
        action: 'login',
        entity: {
          type: 'user',
          id: req.user._id
        },
        details: 'Usuário realizou login no sistema',
        ip: req.ip,
        userAgent: req.get('user-agent')
      });
    } catch (error) {
      console.error('Erro ao registrar login:', error);
    }
  }
  next();
});

// Middleware para registrar logout
export const logLogout = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  if (req.user) {
    try {
      await ActivityLog.create({
        user: req.user._id,
        action: 'logout',
        entity: {
          type: 'user',
          id: req.user._id
        },
        details: 'Usuário realizou logout do sistema',
        ip: req.ip,
        userAgent: req.get('user-agent')
      });
    } catch (error) {
      console.error('Erro ao registrar logout:', error);
    }
  }
  next();
});

// Middleware para salvar ID do recurso criado
export const saveResourceId = (req: Request, res: Response, next: NextFunction) => {
  const originalJson = res.json;
  
  res.json = function(body) {
    if (body && body.data && body.data._id) {
      res.locals.resourceId = body.data._id;
    }
    return originalJson.call(this, body);
  };
  
  next();
};