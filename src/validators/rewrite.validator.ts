import { z } from 'zod';
import { SUPPORTED_ACTIONS } from '../types';
import { config } from '../config';

/**
 * Builds the Zod schema for POST /api/ai/rewrite.
 * Limits come from config so they're driven by environment variables.
 */
export function buildRewriteSchema() {
  const maxTextLen = config.input.maxTextLength;
  const maxInstructionLen = config.input.maxInstructionLength;

  return z
    .object({
      text: z
        .string({ required_error: 'text is required.' })
        .max(maxTextLen, { message: 'Text is too long.' })
        .transform((val) => val.trim())
        .refine((val) => val.length > 0, { message: 'Text is required.' }),

      action: z.enum(SUPPORTED_ACTIONS, {
        errorMap: () => ({
          message: `action must be one of: ${SUPPORTED_ACTIONS.join(', ')}.`,
        }),
      }),

      instruction: z
        .string()
        .max(maxInstructionLen, {
          message: `instruction must not exceed ${maxInstructionLen} characters.`,
        })
        .optional(),
    })
    .refine(
      (data) => {
        // 'custom' action requires a non-empty instruction
        if (data.action === 'custom') {
          return typeof data.instruction === 'string' && data.instruction.trim().length > 0;
        }
        return true;
      },
      {
        message: 'instruction is required when action is "custom".',
        path: ['instruction'],
      }
    );
}

export type ValidatedRewriteBody = z.infer<ReturnType<typeof buildRewriteSchema>>;
