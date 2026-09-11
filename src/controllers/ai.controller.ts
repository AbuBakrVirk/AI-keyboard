import { Request, Response, NextFunction } from 'express';
import { buildRewriteSchema } from '../validators/rewrite.validator';
import { rewriteText } from '../services/ai/aiService';
import { logger } from '../utils/logger';

/**
 * POST /api/ai/rewrite
 *
 * Validates the incoming request, calls the AI service, and returns
 * a predictable JSON response. All errors forwarded to central handler.
 *
 * PRIVACY: Never logs text, instructions, or AI responses.
 * Only logs: requestId, action, inputLength.
 */
export async function rewriteHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const requestId = req.requestId;

  try {
    // ── Validate ────────────────────────────────────────────
    const schema = buildRewriteSchema();
    const parsed = schema.safeParse(req.body);

    if (!parsed.success) {
      return next(parsed.error);
    }

    const { text, action, instruction } = parsed.data;

    // Safe metadata only – no text content
    logger.info(`[AI] action=${action} request received`, {
      requestId,
      inputLength: text.length,
    });

    // ── Process ─────────────────────────────────────────────
    const result = await rewriteText(text, action, instruction, requestId);

    // ── Respond ─────────────────────────────────────────────
    res.status(200).json({
      success: true,
      result,
      requestId,
    });
  } catch (err) {
    next(err);
  }
}
