import { Request, Response, NextFunction } from 'express';

// Wrapper para lidar com async/await sem try/catch em cada rota
export const asyncHandler = (fn: Function) => (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};