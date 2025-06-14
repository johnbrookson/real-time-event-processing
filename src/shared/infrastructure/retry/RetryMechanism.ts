// Conteúdo do arquivo retry-mechanism.ts 

import { Logger } from '@shared/application/logging/logger';

export interface RetryConfig {
  maxAttempts: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffFactor: number;
}

export class RetryMechanism {
  private readonly logger: Logger;
  private readonly config: RetryConfig;

  constructor(logger: Logger, config: RetryConfig) {
    this.logger = logger;
    this.config = config;
  }

  async executeWithRetry<T>(
    operation: () => Promise<T>,
    context: string
  ): Promise<T> {
    let lastError: Error | null = null;
    let delay = this.config.initialDelayMs;

    for (let attempt = 1; attempt <= this.config.maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        if (attempt === this.config.maxAttempts) {
          this.logger.error(`Operation failed after ${attempt} attempts`, {
            context,
            error: lastError.message
          });
          throw lastError;
        }

        this.logger.warn(`Operation failed, retrying...`, {
          context,
          attempt,
          nextAttemptIn: delay,
          error: lastError.message
        });

        await this.delay(delay);
        delay = Math.min(
          delay * this.config.backoffFactor,
          this.config.maxDelayMs
        );
      }
    }

    throw lastError;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
} 