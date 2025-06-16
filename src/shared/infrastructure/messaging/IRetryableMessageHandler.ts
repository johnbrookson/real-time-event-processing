import { MessageHandler } from './RabbitMQClient';

/**
 * Interface for Retryable Message Handler
 */
export interface IRetryableMessageHandler extends MessageHandler {
  getHandlerName(): string;
} 