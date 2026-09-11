import OpenAI from 'openai';
import { config } from '../../../config';
import { AIProvider, RewriteAction } from '../../../types';
import { SYSTEM_PROMPT, buildUserPrompt } from '../prompts';
import { logger } from '../../../utils/logger';
import {
  ProviderError,
  ProviderRateLimitError,
  ProviderAuthError,
  ProviderUnavailableError,
  ProviderTimeoutError,
} from './errors';

// Re-export so existing imports from this file continue to work.
export {
  ProviderError,
  ProviderRateLimitError,
  ProviderAuthError,
  ProviderUnavailableError,
  ProviderTimeoutError,
} from './errors';

export class OpenAIProvider implements AIProvider {
  private readonly client: OpenAI;

  constructor() {
    this.client = new OpenAI({
      apiKey: config.ai.apiKey,
      timeout: config.ai.timeoutMs,
      maxRetries: 1,
    });
  }

  async rewriteText(text: string, action: RewriteAction, instruction?: string): Promise<string> {
    const userPrompt = buildUserPrompt(text, action, instruction);

    let completion: OpenAI.Chat.ChatCompletion;

    try {
      completion = await this.client.chat.completions.create({
        model: config.ai.model,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.3,
        max_tokens: 1024,
      });
    } catch (err: unknown) {
      if (err instanceof OpenAI.APIError) {
        const status = err.status ?? 500;

        if (status === 429) {
          throw new ProviderRateLimitError('OpenAI rate limit exceeded. Please try again later.');
        }
        if (status === 401 || status === 403) {
          logger.error('OpenAI authentication failed', { status });
          throw new ProviderAuthError('AI provider authentication failed. Check your API key.');
        }
        if (status >= 500) {
          throw new ProviderUnavailableError('OpenAI service is currently unavailable.');
        }

        throw new ProviderError(`OpenAI request failed with status ${status}.`);
      }

      if (isTimeoutError(err)) {
        throw new ProviderTimeoutError('The AI provider did not respond in time.');
      }

      throw new ProviderError('Unexpected error communicating with the AI provider.');
    }

    const content = completion.choices[0]?.message?.content?.trim();

    if (!content) {
      throw new ProviderError('AI provider returned an empty response.');
    }

    return content;
  }
}

function isTimeoutError(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  const msg = err.message.toLowerCase();
  return msg.includes('timeout') || msg.includes('timed out') || msg.includes('econnreset');
}
