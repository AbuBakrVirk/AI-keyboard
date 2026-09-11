import dotenv from 'dotenv';
import { ProviderName } from '../types';

dotenv.config();

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

function getEnv(key: string, defaultValue: string): string {
  return process.env[key] ?? defaultValue;
}

function getEnvInt(key: string, defaultValue: number): number {
  const raw = process.env[key];
  if (!raw) return defaultValue;
  const parsed = parseInt(raw, 10);
  if (isNaN(parsed)) {
    throw new Error(`Environment variable ${key} must be an integer, got: "${raw}"`);
  }
  return parsed;
}

// ─────────────────────────────────────────────────────────────
// Provider validation
// ─────────────────────────────────────────────────────────────

const rawProvider = getEnv('AI_PROVIDER', 'gemini').toLowerCase();
const validProviders: ProviderName[] = ['openai', 'gemini', 'mock'];

if (!validProviders.includes(rawProvider as ProviderName)) {
  throw new Error(
    `[config] Invalid AI_PROVIDER "${rawProvider}". Must be one of: ${validProviders.join(', ')}`
  );
}

// ─────────────────────────────────────────────────────────────
// API key resolution
// Provider-specific keys take precedence over the generic AI_API_KEY.
// ─────────────────────────────────────────────────────────────

function resolveApiKey(provider: string): string {
  if (provider === 'gemini') {
    return process.env['GEMINI_API_KEY'] || process.env['AI_API_KEY'] || '';
  }
  if (provider === 'openai') {
    return process.env['OPENAI_API_KEY'] || process.env['AI_API_KEY'] || '';
  }
  // mock – no key needed
  return '';
}

const resolvedApiKey = resolveApiKey(rawProvider);

// ─────────────────────────────────────────────────────────────
// Config object
// ─────────────────────────────────────────────────────────────

const config = {
  server: {
    port: getEnvInt('PORT', 5000),
    nodeEnv: getEnv('NODE_ENV', 'development'),
    isProduction: getEnv('NODE_ENV', 'development') === 'production',
  },

  ai: {
    provider: rawProvider as ProviderName,
    /** Resolved API key – NEVER log or return this value. */
    apiKey: resolvedApiKey,
    /** Model name passed to the provider. */
    model: getEnv('AI_MODEL', rawProvider === 'gemini' ? 'gemini-2.0-flash' : 'gpt-4o-mini'),
    timeoutMs: getEnvInt('AI_TIMEOUT_MS', 30_000),
  },

  cors: {
    allowedOrigins: getEnv('ALLOWED_ORIGINS', '')
      .split(',')
      .map((o) => o.trim())
      .filter(Boolean),
  },

  rateLimit: {
    windowMs: getEnvInt('RATE_LIMIT_WINDOW_MS', 60_000),
    maxRequests: getEnvInt('RATE_LIMIT_MAX_REQUESTS', 30),
  },

  input: {
    maxTextLength: getEnvInt('MAX_TEXT_LENGTH', 5_000),
    maxInstructionLength: getEnvInt('MAX_INSTRUCTION_LENGTH', 1_000),
  },
} as const;

// ─────────────────────────────────────────────────────────────
// Startup validation – fail clearly on missing required vars
// ─────────────────────────────────────────────────────────────

const startupErrors: string[] = [];

if (!process.env['PORT'] && !process.env['NODE_ENV']) {
  // PORT is optional (defaults to 5000), so only warn if completely absent
}

if (!process.env['AI_PROVIDER']) {
  // Defaulted to 'gemini' – acceptable, no error
}

if (config.ai.provider !== 'mock' && !config.ai.apiKey) {
  const keyName = config.ai.provider === 'gemini' ? 'GEMINI_API_KEY' : 'OPENAI_API_KEY';
  startupErrors.push(
    `[config] MISSING REQUIRED: ${keyName} is not set. ` +
      `AI requests will fail. Add it to your .env file.`
  );
}

// Print startup errors clearly without crashing (provider throws at request time)
for (const err of startupErrors) {
  console.error(`\n⚠️  ${err}\n`);
}

export { config };
