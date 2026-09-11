import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import {
  ProviderError,
  ProviderRateLimitError,
  ProviderAuthError,
  ProviderUnavailableError,
  ProviderTimeoutError,
  ProviderConfigError,
} from '../services/ai/providers/errors';
import { logger } from '../utils/logger';
import { config } from '../config';

/**
 * Central error handler.
 *
 * Maps known error types to appropriate HTTP status codes and
 * safe JSON responses. Never exposes stack traces or provider
 * credentials in production.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction): void {
  const requestId: string = req.requestId ?? 'unknown';

  // ── Zod validation errors ────────────────────────────────
  if (err instanceof ZodError) {
    const messages = err.errors.map((e) => e.message).join(' ');
    res.status(400).json({ success: false, error: messages, requestId });
    return;
  }

  // ── Provider-specific errors ─────────────────────────────
  if (err instanceof ProviderConfigError) {
    logger.error('provider_config_error', { requestId });
    res.status(500).json({
      success: false,
      error: 'The AI provider is not configured correctly. Contact the server administrator.',
      requestId,
    });
    return;
  }

  if (err instanceof ProviderRateLimitError) {
    logger.warn('provider_rate_limit', { requestId });
    res.status(429).json({ success: false, error: err.message, requestId });
    return;
  }

  if (err instanceof ProviderAuthError) {
    logger.error('provider_auth_error', { requestId });
    res
      .status(502)
      .json({ success: false, error: 'AI provider authentication failed.', requestId });
    return;
  }

  if (err instanceof ProviderUnavailableError) {
    logger.warn('provider_unavailable', { requestId });
    res.status(503).json({ success: false, error: 'AI service is temporarily unavailable.', requestId });
    return;
  }

  if (err instanceof ProviderTimeoutError) {
    logger.warn('provider_timeout', { requestId });
    res.status(504).json({ success: false, error: 'AI request timed out. Please try again.', requestId });
    return;
  }

  if (err instanceof ProviderError) {
    logger.error('provider_error', { requestId, name: err.name });
    res
      .status(502)
      .json({ success: false, error: 'Unable to process your request.', requestId });
    return;
  }

  // ── Generic / unexpected errors ──────────────────────────
  if (err instanceof Error) {
    logger.error('unhandled_error', {
      requestId,
      name: err.name,
      // Only log message in development; in production it could contain sensitive data
      message: config.server.isProduction ? undefined : err.message,
    });
  } else {
    logger.error('unknown_error', { requestId });
  }

  res.status(500).json({ success: false, error: 'An unexpected error occurred.', requestId });
}
