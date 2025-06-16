// Conteúdo do arquivo retry-mechanism.ts 

import { Logger } from '../../application/logging/logger';
import { DomainEvent } from '../../domain/events/DomainEvent';

export interface RetryConfig {
  maxAttempts: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffFactor: number;
}

export interface DeadLetterQueueService {
  sendToDeadLetterQueue(event: DomainEvent, error: Error, retryCount: number): Promise<void>;
}

export class RetryMechanism {
  private readonly logger: Logger;
  private readonly config: RetryConfig;
  private readonly dlqService?: DeadLetterQueueService;

  constructor(logger: Logger, config: RetryConfig, dlqService?: DeadLetterQueueService) {
    this.logger = logger;
    this.config = config;
    this.dlqService = dlqService;
  }

  async executeWithRetry<T>(
    operation: () => Promise<T>,
    context: string,
    event?: DomainEvent
  ): Promise<T> {
    let lastError: Error | null = null;
    let delay = this.config.initialDelayMs;

    for (let attempt = 1; attempt <= this.config.maxAttempts; attempt++) {
      try {


        return await operation();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        this.logger.warn(`⚠️ Operation failed on attempt ${attempt}`, {
          context,
          attempt,
          maxAttempts: this.config.maxAttempts,
          error: lastError.message,
          eventType: event?.eventType,
          eventId: event?.eventId?.value
        });

        if (attempt === this.config.maxAttempts) {
          this.logger.error(`❌ Operation failed after ${attempt} attempts - sending to DLQ`, {
            context,
            error: lastError.message,
            eventType: event?.eventType,
            eventId: event?.eventId?.value
          });

          // Send to Dead Letter Queue if available
          if (event && this.dlqService) {
            try {
              await this.dlqService.sendToDeadLetterQueue(event, lastError, attempt);
              this.logger.info(`📮 Event sent to Dead Letter Queue`, {
                eventType: event.eventType,
                eventId: event.eventId?.value,
                retryCount: attempt
              });
            } catch (dlqError) {
              this.logger.error(`❌ Failed to send event to DLQ`, {
                eventType: event.eventType,
                eventId: event.eventId?.value,
                dlqError: dlqError instanceof Error ? dlqError.message : 'Unknown DLQ error'
              });
            }
          }

          throw lastError;
        }

        this.logger.info(`⏳ Waiting ${delay}ms before retry ${attempt + 1}`, {
          context,
          delayMs: delay,
          nextAttempt: attempt + 1
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