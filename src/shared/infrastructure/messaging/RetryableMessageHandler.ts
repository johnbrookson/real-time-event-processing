import { Logger } from '../../application/logging/logger';
import { RetryMechanism } from '../retry/RetryMechanism';
import { DomainEvent } from '../../domain/events/DomainEvent';
import { EventId } from '../../domain/value-objects/EventId';
import { MessageHandler } from './RabbitMQClient';
import { IRetryableMessageHandler } from './IRetryableMessageHandler';

export class RetryableMessageHandler implements MessageHandler, IRetryableMessageHandler {
  private readonly logger: Logger;
  private readonly retryMechanism: RetryMechanism;
  private readonly baseHandler: MessageHandler;

  constructor(
    logger: Logger,
    retryMechanism: RetryMechanism,
    baseHandler: MessageHandler
  ) {
    this.logger = logger;
    this.retryMechanism = retryMechanism;
    this.baseHandler = baseHandler;
  }

  getHandlerName(): string {
    return `RetryableMessageHandler(${this.baseHandler.getHandlerName()})`;
  }

  async handle(message: any): Promise<void> {
    this.logger.info(`🔄 RETRYABLE HANDLER: Processing message`, {
      eventType: message.eventType,
      eventId: message.eventId,
      aggregateId: message.aggregateId
    });

    // Convert message to DomainEvent for retry mechanism
    const domainEvent = this.convertToDomainEvent(message);

    this.logger.info(`🔄 RETRYABLE HANDLER: Converted to domain event`, {
      eventType: domainEvent.eventType,
      eventId: domainEvent.eventId?.value,
      aggregateId: domainEvent.aggregateId,
      data: domainEvent.data
    });

    try {
      await this.retryMechanism.executeWithRetry(
        async () => {
          this.logger.info(`🔄 RETRYABLE HANDLER: Calling base handler`);
          return await this.baseHandler.handle(domainEvent); // Pass domainEvent instead of message
        },
        `MessageProcessing-${message.eventType || 'Unknown'}`,
        domainEvent
      );



    } catch (error) {
      this.logger.error('❌ Message processing failed after all retry attempts', {
        eventType: message.eventType,
        eventId: message.eventId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      // Error is already logged and sent to DLQ by RetryMechanism
      // Re-throw to let RabbitMQ know the message failed
      throw error;
    }
  }

  private convertToDomainEvent(message: any): DomainEvent {
    // Create a DomainEvent-like object from the message
    // This allows the retry mechanism to work with proper event data
    return {
      eventId: message.eventId ? new EventId(message.eventId) : new EventId(),
      eventType: message.eventType || 'UnknownEvent',
      aggregateId: message.aggregateId || 'unknown',
      data: message.data || message,
      version: message.version || 1,
      occurredOn: message.occurredOn ? new Date(message.occurredOn) : new Date()
    } as DomainEvent;
  }
} 