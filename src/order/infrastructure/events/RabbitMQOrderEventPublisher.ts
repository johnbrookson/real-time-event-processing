import { DomainEvent } from '../../../shared/domain/events/DomainEvent';
import { IOrderEventPublisher } from '../../domain/repositories/IOrderEventPublisher';
import { ConfigFactory } from '../../../shared/infrastructure/config/AppConfig';
import { Logger } from '../../../shared/application/logging/logger';
import * as amqp from 'amqplib';

export class RabbitMQOrderEventPublisher implements IOrderEventPublisher {
  private channel: any = null;
  private connection: any = null;
  private readonly config = ConfigFactory.create();
  private readonly logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  async initialize(): Promise<void> {
    try {
      this.connection = await amqp.connect(this.config.rabbitmq.url);
      if (!this.connection) {
        throw new Error('Failed to establish RabbitMQ connection');
      }
      
      this.channel = await this.connection.createChannel();
      if (!this.channel) {
        throw new Error('Failed to create RabbitMQ channel');
      }
      
      // Declare exchanges
      await this.channel.assertExchange('order.events', 'topic', { durable: true });
      
      // Declare queues
      await this.channel.assertQueue('order.created', { durable: true });
      await this.channel.assertQueue('order.cancelled', { durable: true });
      await this.channel.assertQueue('order.completed', { durable: true });
      
      // Bind queues to exchange
      await this.channel.bindQueue('order.created', 'order.events', 'order.created');
      await this.channel.bindQueue('order.cancelled', 'order.events', 'order.cancelled');
      await this.channel.bindQueue('order.completed', 'order.events', 'order.completed');
      
      this.logger.info('RabbitMQ Order Event Publisher initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize RabbitMQ Order Event Publisher:', error);
      throw error;
    }
  }

  async publish(event: DomainEvent): Promise<void> {
    if (!this.channel) {
      await this.initialize();
    }

    if (!this.channel) {
      throw new Error('Failed to initialize RabbitMQ channel');
    }

    try {
      const routingKey = this.getRoutingKey(event);
      const message = JSON.stringify({
        eventId: event.eventId.value,
        eventType: event.eventType,
        aggregateId: event.aggregateId,
        occurredOn: event.occurredOn,
        version: event.version,
        data: event.data
      });

      await this.channel.publish(
        'order.events',
        routingKey,
        Buffer.from(message),
        { persistent: true }
      );

      this.logger.info(`Published event: ${event.eventType}`, {
        eventId: event.eventId.value,
        routingKey
      });
    } catch (error) {
      this.logger.error('Failed to publish event:', {
        eventType: event.eventType,
        eventId: event.eventId.value,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      if (this.channel) {
        await this.channel.close();
        this.channel = null;
      }
      if (this.connection) {
        await this.connection.close();
        this.connection = null;
      }
      this.logger.info('RabbitMQ Order Event Publisher disconnected');
    } catch (error) {
      this.logger.error('Error disconnecting RabbitMQ Order Event Publisher:', error);
      throw error;
    }
  }

  private getRoutingKey(event: DomainEvent): string {
    const eventName = event.eventType
      .replace(/([A-Z])/g, '.$1')
      .toLowerCase()
      .substring(1);
    
    return `order.${eventName}`;
  }
} 