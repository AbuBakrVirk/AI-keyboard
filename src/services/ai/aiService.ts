import { RewriteAction } from '../../types';
import { getAIProvider } from './aiProviderFactory';
import { logger } from '../../utils/logger';

/**
 * Thin service layer between the controller and the AI provider.
 * Handles timing and privacy-safe metadata logging.
 *
 * PRIVACY: Never logs text content, instructions, or AI responses.
 * Only safe metadata: requestId, action, timing, lengths.
 */
export async function rewriteText(
  text: string,
  action: RewriteAction,
  instruction: string | undefined,
  requestId: string
): Promise<string> {
  const start = Date.now();

  const provider = getAIProvider();
  const result = await provider.rewriteText(text, action, instruction);

  const elapsed = Date.now() - start;

  // Log safe metadata only – NEVER log text content or AI responses
  logger.info(`[AI] action=${action} status=success duration=${elapsed}ms`, {
    requestId,
    inputLength: text.length,
    outputLength: result.length,
  });

  return result;
}
