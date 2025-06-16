import { MessageHandler } from './RabbitMQClient';

/**
 * Interface for Composite Message Handler
 */
export interface ICompositeMessageHandler extends MessageHandler {
  getHandlerName(): string;
} 