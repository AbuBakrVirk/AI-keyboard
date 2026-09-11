import { AIProvider, RewriteAction } from '../../../types';

/**
 * Mock AI provider for development and testing.
 *
 * Returns deterministic, predictable responses without calling any external API.
 * Switch to this provider with: AI_PROVIDER=mock
 */
export class MockProvider implements AIProvider {
  async rewriteText(text: string, action: RewriteAction, instruction?: string): Promise<string> {
    // Simulate slight network delay so tests behave realistically
    await delay(50);

    return buildMockResponse(text, action, instruction);
  }
}

// ─────────────────────────────────────────────────────────────
// Mock response logic
// ─────────────────────────────────────────────────────────────

function buildMockResponse(text: string, action: RewriteAction, instruction?: string): string {
  const trimmed = text.trim();

  const MOCK_RESPONSES: Record<RewriteAction, string> = {
    fix: applyFix(trimmed),
    professional: `I am writing to inform you that ${trimmed.toLowerCase()}.`,
    friendly: `Hey! Just wanted to let you know — ${trimmed.toLowerCase()}.`,
    shorten: trimmed.split(' ').slice(0, Math.ceil(trimmed.split(' ').length / 2)).join(' ') + '.',
    polite: `Could you please note that ${trimmed.toLowerCase()}? Thank you.`,
    formal: `It is hereby noted that ${trimmed}.`,
    casual: `${trimmed} — just FYI!`,
    academic: `This document notes that ${trimmed.toLowerCase()}.`,
    improve: `${trimmed} (improved for clarity).`,
    custom: `[Custom: ${instruction ?? 'no instruction'}] ${trimmed}`,
  };

  return MOCK_RESPONSES[action];
}

function applyFix(text: string): string {
  // Capitalise first letter, ensure ends with punctuation
  let result = text.charAt(0).toUpperCase() + text.slice(1);
  if (!/[.!?]$/.test(result)) {
    result += '.';
  }
  return result;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
