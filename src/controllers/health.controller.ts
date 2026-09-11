import { Request, Response } from 'express';
import { HealthResponse } from '../types';

/**
 * GET /health
 *
 * Lightweight liveness check.
 * Does NOT call the AI provider.
 */
export function healthHandler(_req: Request, res: Response): void {
  const body: HealthResponse = { success: true, status: 'ok' };
  res.status(200).json(body);
}
