/**
 * Privacy-safe structured logger.
 *
 * PRIVACY RULES – this logger MUST NEVER receive:
 *   - User message text
 *   - AI-generated responses
 *   - Custom instructions
 *   - API keys or auth tokens
 *
 * Allowed metadata: requestId, action, elapsedMs, inputLength,
 *   outputLength, HTTP status, success/failure flags, error names.
 */

import { config } from '../config';

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogMeta {
  [key: string]: unknown;
}

function write(level: LogLevel, message: string, meta?: LogMeta): void {
  if (level === 'debug' && config.server.isProduction) return;

  const isDev = !config.server.isProduction;

  if (isDev) {
    // Human-readable format for development – easy to scan in the terminal
    const metaStr = meta ? ' ' + JSON.stringify(meta) : '';
    const prefix =
      level === 'error' ? '❌ ERROR' :
      level === 'warn'  ? '⚠️  WARN' :
      level === 'debug' ? '🔍 DEBUG' :
                          '✅ INFO ';
    const line = `[${new Date().toISOString()}] ${prefix} ${message}${metaStr}`;
    if (level === 'error' || level === 'warn') {
      console.error(line);
    } else {
      console.log(line);
    }
  } else {
    // Structured JSON for production log aggregators
    const entry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      ...meta,
    };
    const output = JSON.stringify(entry);
    if (level === 'error' || level === 'warn') {
      console.error(output);
    } else {
      console.log(output);
    }
  }
}

const logger = {
  info:  (message: string, meta?: LogMeta) => write('info',  message, meta),
  warn:  (message: string, meta?: LogMeta) => write('warn',  message, meta),
  error: (message: string, meta?: LogMeta) => write('error', message, meta),
  debug: (message: string, meta?: LogMeta) => write('debug', message, meta),
};

export { logger };
