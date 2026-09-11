import { RewriteAction } from '../../types';

// ─────────────────────────────────────────────────────────────
// System prompt – shared across all actions
// ─────────────────────────────────────────────────────────────

export const SYSTEM_PROMPT = `You are an expert English writing assistant built into a mobile keyboard.

Your job is to rewrite the user's text according to a specific instruction.

Rules you MUST always follow:
1. Return ONLY the rewritten text. No explanations, no labels, no quotes, no prefixes, no suffixes.
2. Do NOT start your response with phrases like "Here is...", "Sure!", "Here's the corrected text:", or any similar preamble.
3. Preserve the EXACT original meaning. Never change what the user is saying.
4. Never invent facts, reasons, names, dates, commitments, or any information not present in the original text.
5. Preserve all names (people, products, brands, places) exactly as written.
6. Preserve all numbers, amounts, and dates exactly as written.
7. Preserve all URLs exactly as written.
8. Preserve all technical terms, product names, and jargon exactly as written.
9. Preserve emojis when they fit the requested tone.
10. Do not add unnecessary filler phrases, disclaimers, or extra sentences.
11. If the input is already correct for the requested style, return it with only the minimum necessary changes.`;

// ─────────────────────────────────────────────────────────────
// Action-specific instructions (centralized)
// ─────────────────────────────────────────────────────────────

export const ACTION_INSTRUCTIONS: Record<Exclude<RewriteAction, 'custom'>, string> = {
  fix: 'Correct grammar, spelling, punctuation, capitalization, and obvious English mistakes. Make the minimum necessary changes. Preserve the original meaning and wording wherever possible.',
  professional:
    'Rewrite the text in clear, natural, professional workplace English while preserving its meaning.',
  friendly:
    'Rewrite the text in a natural, warm, friendly conversational style while preserving its meaning.',
  shorten: 'Make the text concise while preserving all important meaning.',
  polite: 'Rewrite the text in a respectful and polite tone.',
  formal: 'Rewrite the text in formal English.',
  casual: 'Rewrite the text in natural casual conversational English.',
  academic: 'Rewrite the text in clear academic English without changing its meaning.',
  improve:
    'Improve grammar, clarity, sentence structure, and naturalness while preserving the original meaning.',
};

// ─────────────────────────────────────────────────────────────
// Build the full user prompt for the LLM
// ─────────────────────────────────────────────────────────────

/**
 * Combines the action instruction with the user's text.
 * For 'custom', the user-supplied instruction is sandwiched so it
 * cannot override system-level rules.
 */
export function buildUserPrompt(
  text: string,
  action: RewriteAction,
  customInstruction?: string
): string {
  if (action === 'custom') {
    const safeInstruction = sanitiseCustomInstruction(customInstruction ?? '');
    return (
      `Follow the user's custom style instruction below.\n` +
      `Style instruction: ${safeInstruction}\n\n` +
      `Important: preserve the original meaning exactly. Return only the rewritten text.\n\n` +
      `Text:\n${text}`
    );
  }

  const instruction = ACTION_INSTRUCTIONS[action];
  return `${instruction}\n\nReturn only the rewritten text.\n\nText:\n${text}`;
}

// ─────────────────────────────────────────────────────────────
// Response cleaning
// ─────────────────────────────────────────────────────────────

/**
 * Strips AI preamble phrases that Gemini sometimes prepends despite
 * being instructed not to.
 *
 * Design rules:
 * - Only strip if there is a COLON after the preamble keyword, OR the
 *   pattern ends with ! or . followed by a space (unambiguous filler).
 * - "Here is my report for Q3." → NOT stripped (no colon, genuine content).
 * - "Sure thing, I will send it." → NOT stripped ("Sure" not followed by ! or .).
 * - Emojis, URLs, names, numbers in the body are never touched.
 */
export function cleanAIResponse(raw: string): string {
  const PREAMBLE_PATTERNS: RegExp[] = [
    // "Here is the rewritten text: ..." / "Here is your corrected sentence: ..."
    // Requires a colon — prevents stripping genuine sentences like "Here is my report".
    /^here\s+is\s+(?:the\s+|your\s+)?(?:rewritten|corrected|revised|improved|updated)?\s*(?:text|sentence|version|message|result)?:\s*/i,

    // "Here's the corrected text: ..."
    /^here'?s\s+(?:the\s+|your\s+)?(?:rewritten|corrected|revised|improved|updated)?\s*(?:text|sentence|version|message|result)?:\s*/i,

    // "Rewritten text: ..." / "Corrected sentence: ..." / "Improved version: ..."
    /^(?:rewritten|corrected|revised|improved|updated)\s+(?:text|sentence|version|message|result):\s*/i,

    // "Here you go! ..." / "Here you go: ..."
    /^here\s+you\s+go[!:.]\s+/i,

    // "Sure! ..." / "Sure. ..." — only when immediately followed by ! or .
    /^sure[!.]\s+/i,

    // "Of course! ..." / "Of course. ..."
    /^of\s+course[!.]\s+/i,

    // "Certainly! ..." / "Certainly. ..."
    /^certainly[!.]\s+/i,
  ];

  let result = raw.trim();

  for (const pattern of PREAMBLE_PATTERNS) {
    const cleaned = result.replace(pattern, '');
    // Only apply if something was actually removed
    if (cleaned !== result && cleaned.trim().length > 0) {
      result = cleaned.trim();
      break; // Only strip one preamble prefix
    }
  }

  return result;
}

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

/**
 * Removes prompt-injection patterns from a user-supplied custom instruction.
 * Defence-in-depth: the system prompt is the primary guard.
 */
function sanitiseCustomInstruction(instruction: string): string {
  return instruction
    .replace(/ignore\s+(all\s+)?(previous|above|prior)\s+(instructions?|rules?)/gi, '')
    .replace(/you\s+are\s+now/gi, '')
    .replace(/system\s*prompt/gi, '')
    .replace(/disregard/gi, '')
    .trim();
}
