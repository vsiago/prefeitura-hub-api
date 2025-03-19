import { Request, Response, NextFunction } from 'express';
import { validationResult, ValidationChain } from 'express-validator';
import ErrorResponse from '../utils/errorResponse';

// Middleware para validar requisições
export const validate = (validations: ValidationChain[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Executar todas as validações
    await Promise.all(validations.map(validation => validation.run(req)));

    // Verificar se há erros
    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    // Formatar mensagens de erro
    const errorMessages = errors.array().map(err => {
      if (err.type === 'field') {
        return `${err.path}: ${err.msg}`;
      }
      return err.msg;
    }).join(', ');

    return next(new ErrorResponse(errorMessages, 400));
  };
};

// Middleware para sanitizar dados
export const sanitize = (req: Request, res: Response, next: NextFunction) => {
  // Remover campos sensíveis ou desnecessários
  if (req.body) {
    delete req.body.password;
    delete req.body.confirmPassword;
    delete req.body.__v;
  }
  next();
};

// Middleware para validar IDs de MongoDB
export const validateMongoId = (req: Request, res: Response, next: NextFunction) => {
  const idParam = req.params.id;
  
  if (idParam && !/^[0-9a-fA-F]{24}$/.test(idParam)) {
    return next(new ErrorResponse(`ID inválido: ${idParam}`, 400));
  }
  
  next();
};

// Middleware para validar datas
export const validateDateRange = (req: Request, res: Response, next: NextFunction) => {
  const { startDate, endDate } = req.query;
  
  if (startDate && !isValidDate(startDate as string)) {
    return next(new ErrorResponse(`Data de início inválida: ${startDate}`, 400));
  }
  
  if (endDate && !isValidDate(endDate as string)) {
    return next(new ErrorResponse(`Data de término inválida: ${endDate}`, 400));
  }
  
  if (startDate && endDate && new Date(startDate as string) > new Date(endDate as string)) {
    return next(new ErrorResponse('A data de início deve ser anterior à data de término', 400));
  }
  
  next();
};

// Função auxiliar para validar datas
const isValidDate = (dateString: string): boolean => {
  const date = new Date(dateString);
  return !isNaN(date.getTime());
};