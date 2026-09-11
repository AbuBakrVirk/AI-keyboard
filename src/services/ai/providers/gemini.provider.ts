import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
  GoogleGenerativeAIError,
  GoogleGenerativeAIFetchError,
  GoogleGenerativeAIRequestInputError,
} from '@google/generative-ai';
import { config } from '../../../config';
import { AIProvider, RewriteAction } from '../../../types';
import { SYSTEM_PROMPT, buildUserPrompt, cleanAIResponse } from '../prompts';
import { logger } from '../../../utils/logger';
import {
  ProviderError,
  ProviderRateLimitError,
  ProviderAuthError,
  ProviderUnavailableError,
  ProviderTimeoutError,
  ProviderConfigError,
} from './errors';

export class GeminiProvider implements AIProvider {
  private readonly client: GoogleGenerativeAI;
  private readonly modelName: string;

  constructor() {
    const apiKey = config.ai.apiKey;

    if (!apiKey) {
      throw new ProviderConfigError(
        'GEMINI_API_KEY (or AI_API_KEY) is not configured. ' +
          'Set it in your .env file and restart the server.'
      );
    }

    this.client = new GoogleGenerativeAI(apiKey);
    // Default to gemini-2.0-flash if not specified; it's fast and capable.
    this.modelName = config.ai.model || 'gemini-2.0-flash';
  }

  async rewriteText(text: string, action: RewriteAction, instruction?: string): Promise<string> {
    const userPrompt = buildUserPrompt(text, action, instruction);

    let resultText: string;

    try {
      const model = this.client.getGenerativeModel({
        model: this.modelName,
        systemInstruction: SYSTEM_PROMPT,
        // Conservative safety settings – we're processing professional text,
        // not generating harmful content, so relax blocking to avoid false positives.
        safetySettings: [
          {
            category: HarmCategory.HARM_CATEGORY_HARASSMENT,
            threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
          },
          {
            category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
            threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
          },
          {
            category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
            threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
          },
          {
            category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
            threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
          },
        ],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 1024,
          // Instruct the model to return plain text, not markdown
          responseMimeType: 'text/plain',
        },
      });

      // Wrap the call in a timeout promise
      const generatePromise = model.generateContent(userPrompt);
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new ProviderTimeoutError('Gemini did not respond in time.')),
          config.ai.timeoutMs
        )
      );

      const response = await Promise.race([generatePromise, timeoutPromise]);
      resultText = cleanAIResponse(response.response.text());
    } catch (err: unknown) {
      // Already a typed provider error (e.g. our timeout) – re-throw directly
      if (err instanceof ProviderError) {
        throw err;
      }

      // Gemini fetch errors carry an HTTP status
      if (err instanceof GoogleGenerativeAIFetchError) {
        const status = err.status ?? 500;

        if (status === 429) {
          throw new ProviderRateLimitError('Gemini rate limit exceeded. Please try again later.');
        }
        if (status === 400) {
          // 400 from Gemini often means a bad request / safety block
          logger.warn('gemini_bad_request', { status });
          throw new ProviderError('Gemini rejected the request. Please try different text.');
        }
        if (status === 401 || status === 403) {
          logger.error('gemini_auth_error', { status });
          throw new ProviderAuthError('Gemini authentication failed. Check your API key.');
        }
        if (status >= 500) {
          throw new ProviderUnavailableError('Gemini service is currently unavailable.');
        }

        throw new ProviderError(`Gemini request failed with status ${status}.`);
      }

      // Input validation error from the SDK
      if (err instanceof GoogleGenerativeAIRequestInputError) {
        logger.warn('gemini_input_error');
        throw new ProviderError('Gemini could not process the input.');
      }

      // Generic Gemini SDK error
      if (err instanceof GoogleGenerativeAIError) {
        logger.error('gemini_sdk_error', { name: err.name });
        throw new ProviderError('An error occurred communicating with Gemini.');
      }

      // Network / timeout from Node itself
      if (isTimeoutError(err)) {
        throw new ProviderTimeoutError('Gemini did not respond in time.');
      }

      // Unexpected
      throw new ProviderError('Unexpected error communicating with Gemini.');
    }

    if (!resultText) {
      throw new ProviderError('Gemini returned an empty response.');
    }

    return resultText;
  }
}

function isTimeoutError(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  const msg = err.message.toLowerCase();
  return (
    msg.includes('timeout') ||
    msg.includes('timed out') ||
    msg.includes('econnreset') ||
    msg.includes('network')
  );
}
