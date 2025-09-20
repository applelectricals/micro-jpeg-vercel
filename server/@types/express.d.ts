import 'express';

declare global {
  namespace Express {
    interface Request {
      context?: {
        pageIdentifier?: string;
        pageScope?: string;
        [key: string]: any;
      };
    }
  }
}