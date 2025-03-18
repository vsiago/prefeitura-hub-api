import { Express } from 'express';
import { UserTypes } from './user';

declare global {
  namespace Express {
    interface Request {
      user?: UserTypes.User;
      file?: {
        filename: string;
        path: string;
        mimetype: string;
        size: number;
      };
      files?: {
        [fieldname: string]: {
          filename: string;
          path: string;
          mimetype: string;
          size: number;
        }[];
      };
    }
  }
}

export {};