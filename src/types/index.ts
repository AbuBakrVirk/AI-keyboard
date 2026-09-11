// ─────────────────────────────────────────────────────────────
// Supported rewrite actions
// ─────────────────────────────────────────────────────────────

export const SUPPORTED_ACTIONS = [
  'fix',
  'professional',
  'friendly',
  'shorten',
  'polite',
  'formal',
  'casual',
  'academic',
  'improve',
  'custom',
] as const;

export type RewriteAction = (typeof SUPPORTED_ACTIONS)[number];

// ─────────────────────────────────────────────────────────────
// Request / Response shapes
// ─────────────────────────────────────────────────────────────

export interface RewriteRequest {
  text: string;
  action: RewriteAction;
  /** Required when action === 'custom' */
  instruction?: string;
}

export interface RewriteSuccessResponse {
  success: true;
  result: string;
  requestId: string;
}

export interface RewriteErrorResponse {
  success: false;
  error: string;
  requestId?: string;
}

export type RewriteResponse = RewriteSuccessResponse | RewriteErrorResponse;

// ─────────────────────────────────────────────────────────────
// Health check
// ─────────────────────────────────────────────────────────────

export interface HealthResponse {
  success: true;
  status: 'ok';
}

// ─────────────────────────────────────────────────────────────
// AI Provider abstraction
// ─────────────────────────────────────────────────────────────

export interface AIProvider {
  /**
   * Rewrites the given text according to the specified action.
   * Returns the rewritten text only.
   */
  rewriteText(text: string, action: RewriteAction, instruction?: string): Promise<string>;
}

// ─────────────────────────────────────────────────────────────
// Supported provider identifiers
// ─────────────────────────────────────────────────────────────

export type ProviderName = 'openai' | 'gemini' | 'mock';
