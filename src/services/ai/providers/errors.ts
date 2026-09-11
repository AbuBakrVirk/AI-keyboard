/**
 * Provider-agnostic error hierarchy.
 *
 * All AI provider implementations throw these errors so the
 * central error handler never needs to know which provider
 * is in use.
 */

export class ProviderError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ProviderError';
  }
}

export class ProviderRateLimitError extends ProviderError {
  constructor(message: string) {
    super(message);
    this.name = 'ProviderRateLimitError';
  }
}

export class ProviderAuthError extends ProviderError {
  constructor(message: string) {
    super(message);
    this.name = 'ProviderAuthError';
  }
}

export class ProviderUnavailableError extends ProviderError {
  constructor(message: string) {
    super(message);
    this.name = 'ProviderUnavailableError';
  }
}

export class ProviderTimeoutError extends ProviderError {
  constructor(message: string) {
    super(message);
    this.name = 'ProviderTimeoutError';
  }
}

export class ProviderConfigError extends ProviderError {
  constructor(message: string) {
    super(message);
    this.name = 'ProviderConfigError';
  }
}
