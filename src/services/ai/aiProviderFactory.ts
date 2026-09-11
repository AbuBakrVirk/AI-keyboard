import { config } from '../../config';
import { AIProvider, ProviderName } from '../../types';
import { OpenAIProvider } from './providers/openai.provider';
import { MockProvider } from './providers/mock.provider';
import { GeminiProvider } from './providers/gemini.provider';

/**
 * Returns the configured AI provider singleton.
 * Adding a new provider requires only:
 *   1. Implementing AIProvider in a new file under providers/
 *   2. Adding a case here
 *   3. Updating .env.example with the new provider name
 */
let instance: AIProvider | null = null;

export function getAIProvider(): AIProvider {
  if (instance) return instance;

  const provider: ProviderName = config.ai.provider;

  switch (provider) {
    case 'openai':
      instance = new OpenAIProvider();
      break;
    case 'gemini':
      instance = new GeminiProvider();
      break;
    case 'mock':
      instance = new MockProvider();
      break;
    default: {
      // TypeScript exhaustiveness check
      const _exhaustive: never = provider;
      throw new Error(`Unknown AI provider: ${_exhaustive}`);
    }
  }

  return instance;
}

/** Reset singleton – used in tests only. */
export function resetAIProvider(): void {
  instance = null;
}
