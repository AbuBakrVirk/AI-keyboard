import request from 'supertest';
import { createApp } from '../app';
import { resetAIProvider } from '../services/ai/aiProviderFactory';

const app = createApp();

// Reset provider singleton before each test to avoid state leakage
beforeEach(() => resetAIProvider());

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

function post(body: Record<string, unknown>) {
  return request(app).post('/api/ai/rewrite').send(body).set('Content-Type', 'application/json');
}

// ─────────────────────────────────────────────────────────────
// Success cases – all supported actions
// ─────────────────────────────────────────────────────────────

describe('POST /api/ai/rewrite – supported actions', () => {
  const actions = [
    'fix',
    'professional',
    'friendly',
    'shorten',
    'polite',
    'formal',
    'casual',
    'academic',
    'improve',
  ] as const;

  for (const action of actions) {
    it(`returns 200 with a result for action "${action}"`, async () => {
      const res = await post({ text: 'sir im still facing same issue', action });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(typeof res.body.result).toBe('string');
      expect(res.body.result.length).toBeGreaterThan(0);
      expect(typeof res.body.requestId).toBe('string');
    });
  }

  it('returns 200 for action "custom" with instruction', async () => {
    const res = await post({
      text: 'i need this report tomorrow',
      action: 'custom',
      instruction: 'Make this sound respectful but urgent.',
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(typeof res.body.result).toBe('string');
    expect(res.body.result.length).toBeGreaterThan(0);
  });
});

// ─────────────────────────────────────────────────────────────
// Response structure contract
// ─────────────────────────────────────────────────────────────

describe('Response structure', () => {
  it('always includes success, result, and requestId on success', async () => {
    const res = await post({ text: 'hello world', action: 'fix' });

    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('result');
    expect(res.body).toHaveProperty('requestId');
  });

  it('never exposes apiKey in the response', async () => {
    const res = await post({ text: 'hello', action: 'fix' });
    const bodyStr = JSON.stringify(res.body);
    expect(bodyStr).not.toContain('apiKey');
    expect(bodyStr).not.toContain('api_key');
    expect(bodyStr).not.toContain('GEMINI');
    expect(bodyStr).not.toContain('OPENAI');
  });
});

// ─────────────────────────────────────────────────────────────
// Validation – empty / whitespace text
// ─────────────────────────────────────────────────────────────

describe('POST /api/ai/rewrite – empty text', () => {
  it('returns 400 for empty string', async () => {
    const res = await post({ text: '', action: 'fix' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(typeof res.body.error).toBe('string');
    expect(res.body.error.length).toBeGreaterThan(0);
  });

  it('returns 400 for whitespace-only string', async () => {
    const res = await post({ text: '   ', action: 'fix' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('returns 400 when text is missing', async () => {
    const res = await post({ action: 'fix' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────
// Validation – invalid action
// ─────────────────────────────────────────────────────────────

describe('POST /api/ai/rewrite – invalid action', () => {
  it('returns 400 for an unsupported action', async () => {
    const res = await post({ text: 'hello', action: 'translate' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('returns 400 when action is missing', async () => {
    const res = await post({ text: 'hello' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────
// Validation – custom action missing instruction
// ─────────────────────────────────────────────────────────────

describe('POST /api/ai/rewrite – custom action', () => {
  it('returns 400 when custom action has no instruction', async () => {
    const res = await post({ text: 'hello', action: 'custom' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toMatch(/instruction/i);
  });

  it('returns 400 when custom instruction is empty', async () => {
    const res = await post({ text: 'hello', action: 'custom', instruction: '' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────
// Validation – text too long
// ─────────────────────────────────────────────────────────────

describe('POST /api/ai/rewrite – text length limit', () => {
  it('returns 400 when text exceeds MAX_TEXT_LENGTH', async () => {
    const longText = 'a'.repeat(5001);
    const res = await post({ text: longText, action: 'fix' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBe('Text is too long.');
  });

  it('accepts text exactly at the limit', async () => {
    const maxText = 'a'.repeat(5000);
    const res = await post({ text: maxText, action: 'fix' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────
// Validation – instruction length limit
// ─────────────────────────────────────────────────────────────

describe('POST /api/ai/rewrite – instruction length limit', () => {
  it('returns 400 when custom instruction exceeds MAX_INSTRUCTION_LENGTH', async () => {
    const longInstruction = 'a'.repeat(1001);
    const res = await post({ text: 'hello', action: 'custom', instruction: longInstruction });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('accepts instruction exactly at the limit', async () => {
    const maxInstruction = 'Make this polite. ' + 'a'.repeat(982); // pad to 1000 chars
    const res = await post({ text: 'send me the file', action: 'custom', instruction: maxInstruction });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────
// Provider failure simulation
// All error types now live in the shared errors.ts module.
// ─────────────────────────────────────────────────────────────

describe('POST /api/ai/rewrite – provider failure', () => {
  it('returns 502 when the provider throws a ProviderError', async () => {
    const factory = await import('../services/ai/aiProviderFactory');
    const { ProviderError } = await import('../services/ai/providers/errors');

    jest.spyOn(factory, 'getAIProvider').mockReturnValueOnce({
      rewriteText: () => Promise.reject(new ProviderError('Provider exploded')),
    });

    const res = await post({ text: 'hello world', action: 'fix' });

    expect(res.status).toBe(502);
    expect(res.body.success).toBe(false);
    expect(typeof res.body.error).toBe('string');
  });

  it('returns 429 when the provider throws a ProviderRateLimitError', async () => {
    const factory = await import('../services/ai/aiProviderFactory');
    const { ProviderRateLimitError } = await import('../services/ai/providers/errors');

    jest.spyOn(factory, 'getAIProvider').mockReturnValueOnce({
      rewriteText: () => Promise.reject(new ProviderRateLimitError('Rate limited')),
    });

    const res = await post({ text: 'hello world', action: 'fix' });

    expect(res.status).toBe(429);
    expect(res.body.success).toBe(false);
  });

  it('returns 503 when the provider is unavailable', async () => {
    const factory = await import('../services/ai/aiProviderFactory');
    const { ProviderUnavailableError } = await import('../services/ai/providers/errors');

    jest.spyOn(factory, 'getAIProvider').mockReturnValueOnce({
      rewriteText: () => Promise.reject(new ProviderUnavailableError('Down')),
    });

    const res = await post({ text: 'hello world', action: 'fix' });

    expect(res.status).toBe(503);
    expect(res.body.success).toBe(false);
  });

  it('returns 500 when the provider throws a ProviderConfigError', async () => {
    const factory = await import('../services/ai/aiProviderFactory');
    const { ProviderConfigError } = await import('../services/ai/providers/errors');

    jest.spyOn(factory, 'getAIProvider').mockReturnValueOnce({
      rewriteText: () => Promise.reject(new ProviderConfigError('Missing API key')),
    });

    const res = await post({ text: 'hello world', action: 'fix' });

    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
    // Must not leak the raw config error message
    expect(res.body.error).not.toMatch(/api.?key/i);
  });
});

// ─────────────────────────────────────────────────────────────
// 404 for unknown routes
// ─────────────────────────────────────────────────────────────

describe('Unknown routes', () => {
  it('returns 404 for an unknown path', async () => {
    const res = await request(app).get('/api/unknown-route');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});
