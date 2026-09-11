import { Request, Response, NextFunction } from 'express';
import { generateRequestId } from '../utils/requestId';

declare global {
  // Augment Express Request to carry our request ID
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      requestId: string;
    }
  }
}

export function requestIdMiddleware(req: Request, _res: Response, next: NextFunction): void {
  req.requestId = generateRequestId();
  next();
}
