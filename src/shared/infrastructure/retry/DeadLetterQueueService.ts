import { Logger } from '../../application/logging/logger';
import { DomainEvent } from '../../domain/events/DomainEvent';
import { DeadLetterQueueService } from './RetryMechanism';
import * as amqp from 'amqplib';

export interface DeadLetterQueueConfig {
  rabbitmqUrl: string;
  dlqExchange: string;
  dlqQueue: string;
  dlqRoutingKey: string;
}

export class RabbitMQDeadLetterQueueService implements DeadLetterQueueService {
  private connection: any = null;
  private channel: any = null;
  private readonly logger: Logger;
  private readonly config: DeadLetterQueueConfig;

  constructor(logger: Logger, config: DeadLetterQueueConfig) {
    this.logger = logger;
    this.config = config;
  }

  async initialize(): Promise<void> {
    try {
      this.logger.info('🔧 Initializing Dead Letter Queue Service...');

      this.connection = await amqp.connect(this.config.rabbitmqUrl);
      if (!this.connection) {
        throw new Error('Failed to establish RabbitMQ connection for DLQ');
      }

      this.channel = await this.connection.createChannel();
      if (!this.channel) {
        throw new Error('Failed to create RabbitMQ channel for DLQ');
      }

      // Setup DLQ exchange
      await this.channel.assertExchange(this.config.dlqExchange, 'direct', { durable: true });
      this.logger.info(`📮 DLQ Exchange configured: ${this.config.dlqExchange}`);

      // Setup DLQ queue
      await this.channel.assertQueue(this.config.dlqQueue, { 
        durable: true,
        arguments: {
          'x-message-ttl': 7 * 24 * 60 * 60 * 1000, // 7 days TTL
          'x-max-length': 10000 // Max 10k messages
        }
      });
      this.logger.info(`📮 DLQ Queue configured: ${this.config.dlqQueue}`);

      // Bind DLQ queue to exchange
      await this.channel.bindQueue(this.config.dlqQueue, this.config.dlqExchange, this.config.dlqRoutingKey);
      this.logger.info(`📮 DLQ Queue bound to exchange`);

      this.logger.info('✅ Dead Letter Queue Service initialized successfully');
    } catch (error) {
      this.logger.error('❌ Failed to initialize Dead Letter Queue Service', { error });
      throw error;
    }
  }

  async sendToDeadLetterQueue(event: DomainEvent, error: Error, retryCount: number): Promise<void> {
    if (!this.channel) {
      await this.initialize();
    }

    if (!this.channel) {
      throw new Error('Failed to initialize DLQ channel');
    }

    try {
      const dlqMessage = {
        originalEvent: {
          eventId: event.eventId?.value,
          eventType: event.eventType,
          aggregateId: event.aggregateId,
          data: event.data,
          version: event.version,
          occurredOn: event.occurredOn
        },
        failureInfo: {
          errorMessage: error.message,
          errorStack: error.stack,
          retryCount,
          failedAt: new Date().toISOString(),
          processingAttempts: retryCount
        },
        metadata: {
          dlqTimestamp: new Date().toISOString(),
          source: 'RetryMechanism',
          canRetry: false // Mark as non-retryable since it already failed max attempts
        }
      };

      const messageBuffer = Buffer.from(JSON.stringify(dlqMessage));

      // Publish to DLQ
      const published = this.channel.publish(
        this.config.dlqExchange,
        this.config.dlqRoutingKey,
        messageBuffer,
        {
          persistent: true,
          headers: {
            'x-original-event-type': event.eventType,
            'x-failure-reason': error.message,
            'x-retry-count': retryCount,
            'x-failed-at': new Date().toISOString()
          }
        }
      );

      if (!published) {
        throw new Error('Failed to publish message to DLQ - channel buffer full');
      }

      this.logger.info('📮 Event successfully sent to Dead Letter Queue', {
        eventType: event.eventType,
        eventId: event.eventId?.value,
        aggregateId: event.aggregateId,
        retryCount,
        errorMessage: error.message,
        dlqExchange: this.config.dlqExchange,
        dlqQueue: this.config.dlqQueue
      });

      // Also log to database for persistence (optional)
      await this.logToDatabaseDLQ(event, error, retryCount);

    } catch (dlqError) {
      this.logger.error('❌ Failed to send event to Dead Letter Queue', {
        eventType: event.eventType,
        eventId: event.eventId?.value,
        originalError: error.message,
        dlqError: dlqError instanceof Error ? dlqError.message : 'Unknown DLQ error'
      });
      throw dlqError;
    }
  }

  private async logToDatabaseDLQ(event: DomainEvent, error: Error, retryCount: number): Promise<void> {
    try {
      // TODO: Implement database logging
      // This would insert into the dead_letter_queue table created in init-db.sql
      this.logger.debug('📝 DLQ event logged to database', {
        eventType: event.eventType,
        eventId: event.eventId?.value,
        retryCount
      });
    } catch (dbError) {
      this.logger.warn('⚠️ Failed to log DLQ event to database', {
        eventType: event.eventType,
        eventId: event.eventId?.value,
        dbError: dbError instanceof Error ? dbError.message : 'Unknown DB error'
      });
      // Don't throw - DLQ to RabbitMQ is more important than DB logging
    }
  }

  async disconnect(): Promise<void> {
    try {
      this.logger.info('🔌 Disconnecting Dead Letter Queue Service...');

      if (this.channel) {
        await this.channel.close();
        this.channel = null;
        this.logger.info('📮 DLQ channel closed');
      }

      if (this.connection) {
        await this.connection.close();
        this.connection = null;
        this.logger.info('📮 DLQ connection closed');
      }

      this.logger.info('✅ Dead Letter Queue Service disconnected');
    } catch (error) {
      this.logger.error('❌ Error disconnecting Dead Letter Queue Service', { error });
      throw error;
    }
  }
} 