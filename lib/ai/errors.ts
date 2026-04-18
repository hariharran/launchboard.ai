export class AIValidationError extends Error {
  details: string[];

  constructor(message: string, details: string[] = []) {
    super(message);
    this.name = "AIValidationError";
    this.details = details;
  }
}

export class AIConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AIConfigurationError";
  }
}

export class AIProviderError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AIProviderError";
  }
}
