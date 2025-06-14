// Conteúdo do arquivo rabbitmq-client.ts 

import * as amqp from 'amqplib';
import { Logger } from '../../../shared/application/logging/logger';

export interface RabbitMQConfig {
  url: string;
  exchange: string;
  queue: string;
  routingKey: string;
}

export interface MessageHandler {
  handle(event: any): Promise<void>;
  getHandlerName(): string;
}

export class RabbitMQClient {
  private connection: any = null;
  private channel: any = null;
  private config: RabbitMQConfig;
  private logger: Logger;
  private messageHandlers: Map<string, MessageHandler> = new Map();
  private messageCount: number = 0;

  constructor(config: RabbitMQConfig, logger: Logger) {
    this.config = config;
    this.logger = logger;
  }

  registerHandler(queueName: string, handler: MessageHandler): void {
    this.messageHandlers.set(queueName, handler);
    this.logger.info(`Registered handler for queue: ${queueName}`, {
      handlerName: handler.getHandlerName()
    });
  }

  async connect(): Promise<void> {
    try {
      this.logger.info('Connecting to RabbitMQ...', {
        url: this.config.url.replace(/\/\/.*@/, '//***:***@') // Hide credentials in logs
      });

      this.connection = await amqp.connect(this.config.url);
      if (!this.connection) {
        throw new Error('Failed to establish RabbitMQ connection');
      }

      this.channel = await this.connection.createChannel();
      if (!this.channel) {
        throw new Error('Failed to create RabbitMQ channel');
      }
      
      // Setup exchange
      await this.channel.assertExchange(this.config.exchange, 'topic', { durable: true });
      this.logger.info(`Exchange configured: ${this.config.exchange}`);
      
      // Setup queue
      await this.channel.assertQueue(this.config.queue, { durable: true });
      this.logger.info(`Queue configured: ${this.config.queue}`);
      
      // Bind queue to exchange
      await this.channel.bindQueue(this.config.queue, this.config.exchange, this.config.routingKey);
      this.logger.info(`Queue bound to exchange`, {
        queue: this.config.queue,
        exchange: this.config.exchange,
        routingKey: this.config.routingKey
      });
      
      this.logger.info('RabbitMQ connection established successfully');
    } catch (error) {
      this.logger.error('Failed to connect to RabbitMQ', { error });
      throw error;
    }
  }

  async publish(message: any): Promise<void> {
    if (!this.channel) {
      throw new Error('Channel not initialized');
    }

    try {
      const content = Buffer.from(JSON.stringify(message));
      const published = this.channel.publish(this.config.exchange, this.config.routingKey, content);
      
      this.logger.info('Message published successfully', {
        exchange: this.config.exchange,
        routingKey: this.config.routingKey,
        messageSize: content.length,
        eventType: message.eventType || 'unknown',
        eventId: message.eventId || 'unknown'
      });

      if (!published) {
        this.logger.warn('Message may not have been published (channel buffer full)');
      }
    } catch (error) {
      this.logger.error('Failed to publish message', { error, message });
      throw error;
    }
  }

  async consume(handler: (message: any) => Promise<void>): Promise<void> {
    if (!this.channel) {
      throw new Error('Channel not initialized');
    }

    try {
      this.logger.info(`Starting consumer for queue: ${this.config.queue}`);

      await this.channel.consume(this.config.queue, async (msg: any) => {
        if (msg) {
          const messageId = ++this.messageCount;
          const startTime = Date.now();
          
          try {
            this.logger.info(`📨 Received message #${messageId}`, {
              queue: this.config.queue,
              messageSize: msg.content.length,
              routingKey: msg.fields.routingKey,
              exchange: msg.fields.exchange
            });

            const content = JSON.parse(msg.content.toString());
            
            this.logger.info(`🔄 Processing message #${messageId}`, {
              eventType: content.eventType || 'unknown',
              eventId: content.eventId || 'unknown',
              aggregateId: content.aggregateId || 'unknown'
            });

            await handler(content);
            
            const processingTime = Date.now() - startTime;
            this.logger.info(`✅ Message #${messageId} processed successfully`, {
              processingTimeMs: processingTime,
              eventType: content.eventType
            });

            this.channel?.ack(msg);
          } catch (error) {
            const processingTime = Date.now() - startTime;
            this.logger.error(`❌ Error processing message #${messageId}`, {
              error: error instanceof Error ? error.message : 'Unknown error',
              processingTimeMs: processingTime,
              stack: error instanceof Error ? error.stack : undefined
            });
            
            // Reject without requeue - message should already be in DLQ if retry failed
            // The RetryableMessageHandler handles retries and DLQ, so we don't requeue here
            this.logger.warn(`🚫 Rejecting message #${messageId} without requeue (already processed by retry mechanism)`);
            this.channel?.nack(msg, false, false); // requeue=false
          }
        }
      });
      
      this.logger.info('Consumer started successfully', {
        queue: this.config.queue
      });
    } catch (error) {
      this.logger.error('Failed to start consumer', { error });
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      this.logger.info('Disconnecting from RabbitMQ...');
      
      if (this.channel) {
        await this.channel.close();
        this.logger.info('RabbitMQ channel closed');
      }
      
      if (this.connection) {
        await this.connection.close();
        this.logger.info('RabbitMQ connection closed');
      }
      
      this.logger.info(`Total messages processed: ${this.messageCount}`);
    } catch (error) {
      this.logger.error('Error closing RabbitMQ connection', { error });
      throw error;
    }
  }
} 