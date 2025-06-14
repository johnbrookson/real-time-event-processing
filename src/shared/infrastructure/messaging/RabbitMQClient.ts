// Conteúdo do arquivo rabbitmq-client.ts 

import * as amqp from 'amqplib';
import { Logger } from '@shared/application/logging/logger';

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

  constructor(config: RabbitMQConfig, logger: Logger) {
    this.config = config;
    this.logger = logger;
  }

  registerHandler(queueName: string, handler: MessageHandler): void {
    this.messageHandlers.set(queueName, handler);
    this.logger.info(`Registered handler for queue: ${queueName}`);
  }

  async connect(): Promise<void> {
    try {
      this.connection = await amqp.connect(this.config.url);
      if (!this.connection) {
        throw new Error('Failed to establish RabbitMQ connection');
      }

      this.channel = await this.connection.createChannel();
      if (!this.channel) {
        throw new Error('Failed to create RabbitMQ channel');
      }
      
      await this.channel.assertExchange(this.config.exchange, 'topic', { durable: true });
      await this.channel.assertQueue(this.config.queue, { durable: true });
      await this.channel.bindQueue(this.config.queue, this.config.exchange, this.config.routingKey);
      
      this.logger.info('RabbitMQ connection established');
    } catch (error) {
      this.logger.error('Failed to connect to RabbitMQ', error);
      throw error;
    }
  }

  async publish(message: any): Promise<void> {
    if (!this.channel) {
      throw new Error('Channel not initialized');
    }

    try {
      const content = Buffer.from(JSON.stringify(message));
      this.channel.publish(this.config.exchange, this.config.routingKey, content);
      this.logger.info('Message published successfully');
    } catch (error) {
      this.logger.error('Failed to publish message', error);
      throw error;
    }
  }

  async consume(handler: (message: any) => Promise<void>): Promise<void> {
    if (!this.channel) {
      throw new Error('Channel not initialized');
    }

    try {
      await this.channel.consume(this.config.queue, async (msg: any) => {
        if (msg) {
          try {
            const content = JSON.parse(msg.content.toString());
            await handler(content);
            this.channel?.ack(msg);
          } catch (error) {
            this.logger.error('Error processing message', error);
            this.channel?.nack(msg);
          }
        }
      });
      this.logger.info('Consumer started successfully');
    } catch (error) {
      this.logger.error('Failed to start consumer', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      if (this.channel) {
        await this.channel.close();
      }
      if (this.connection) {
        await this.connection.close();
      }
      this.logger.info('RabbitMQ connection closed');
    } catch (error) {
      this.logger.error('Error closing RabbitMQ connection', error);
      throw error;
    }
  }
} 