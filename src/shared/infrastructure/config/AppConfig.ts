import { config } from 'dotenv';
import { RetryConfig } from '../retry/RetryMechanism';
import { RabbitMQConfig } from '../messaging/RabbitMQClient';
import { BatchProcessorConfig } from '../batch/BatchProcessor';
import { DeadLetterQueueConfig } from '../retry/DeadLetterQueueService';

// Load environment variables
config();

export interface AppConfig {
  app: {
    env: string;
    port: number;
    logLevel: string;
  };
  rabbitmq: RabbitMQConfig;
  batch: BatchProcessorConfig;
  retry: RetryConfig;
  dlq: DeadLetterQueueConfig;
  worker: {
    concurrency: number;
    prefetchCount: number;
  };
  database: {
    host: string;
    port: number;
    name: string;
    user: string;
    password: string;
    maxConnections: number;
  };
}

/**
 * Configuration Factory
 * 
 * Creates application configuration from environment variables
 * with sensible defaults and validation.
 */
export class ConfigFactory {
  static create(): AppConfig {
    return {
      app: {
        env: process.env.NODE_ENV || 'development',
        port: parseInt(process.env.PORT || '3000', 10),
        logLevel: process.env.LOG_LEVEL || 'info'
      },
      rabbitmq: {
        url: process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672',
        exchange: process.env.RABBITMQ_EXCHANGE || 'orders_exchange',
        queue: process.env.RABBITMQ_QUEUE || 'order_events',
        routingKey: process.env.RABBITMQ_ROUTING_KEY || 'order.*'
      },
      batch: {
        batchSize: parseInt(process.env.BATCH_SIZE || '3', 10),
        batchIntervalMs: parseInt(process.env.BATCH_INTERVAL_SECONDS || '10', 10) * 1000,
        maxWaitTimeMs: parseInt(process.env.MAX_BATCH_WAIT_SECONDS || '20', 10) * 1000
      },
      retry: {
        maxAttempts: parseInt(process.env.MAX_RETRY_ATTEMPTS || '3', 10),
        initialDelayMs: parseInt(process.env.RETRY_DELAY_MS || '1000', 10),
        maxDelayMs: parseInt(process.env.RETRY_MAX_DELAY_MS || '30000', 10),
        backoffFactor: parseInt(process.env.RETRY_BACKOFF_FACTOR || '2', 10)
      },
      dlq: {
        rabbitmqUrl: process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672',
        dlqExchange: process.env.RABBITMQ_EXCHANGE_DEAD_LETTER || 'dlx_exchange',
        dlqQueue: process.env.RABBITMQ_QUEUE_DEAD_LETTER || 'dead_letter_queue',
        dlqRoutingKey: process.env.RABBITMQ_DLQ_ROUTING_KEY || 'failed'
      },
      worker: {
        concurrency: parseInt(process.env.WORKER_CONCURRENCY || '5', 10),
        prefetchCount: parseInt(process.env.WORKER_PREFETCH_COUNT || '10', 10)
      },
      database: {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432', 10),
        name: process.env.DB_NAME || 'ecommerce_events',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS || '20', 10)
      }
    };
  }

  static validate(config: AppConfig): void {
    const errors: string[] = [];

    // Validate app config
    if (!config.app.env) {
      errors.push('APP_ENV is required');
    }

    if (config.app.port < 1 || config.app.port > 65535) {
      errors.push('PORT must be between 1 and 65535');
    }

    // Validate RabbitMQ config
    if (!config.rabbitmq.url) {
      errors.push('RABBITMQ_URL is required');
    }

    if (!config.rabbitmq.exchange) {
      errors.push('RABBITMQ_EXCHANGE is required');
    }

    if (!config.rabbitmq.queue) {
      errors.push('RABBITMQ_QUEUE is required');
    }

    if (!config.rabbitmq.routingKey) {
      errors.push('RABBITMQ_ROUTING_KEY is required');
    }

    // Validate batch config
    if (config.batch.batchSize < 1) {
      errors.push('BATCH_SIZE must be greater than 0');
    }

    if (config.batch.batchIntervalMs < 1000) {
      errors.push('BATCH_INTERVAL_SECONDS must be at least 1 second');
    }

    // Validate retry config
    if (config.retry.maxAttempts < 1) {
      errors.push('MAX_RETRY_ATTEMPTS must be greater than 0');
    }

    if (config.retry.initialDelayMs < 100) {
      errors.push('RETRY_DELAY_MS must be at least 100ms');
    }

    // Validate worker config
    if (config.worker.concurrency < 1) {
      errors.push('WORKER_CONCURRENCY must be greater than 0');
    }

    if (config.worker.prefetchCount < 1) {
      errors.push('WORKER_PREFETCH_COUNT must be greater than 0');
    }

    // Validate database config
    if (!config.database.host) {
      errors.push('DB_HOST is required');
    }

    if (config.database.port < 1 || config.database.port > 65535) {
      errors.push('DB_PORT must be between 1 and 65535');
    }

    if (!config.database.name) {
      errors.push('DB_NAME is required');
    }

    if (!config.database.user) {
      errors.push('DB_USER is required');
    }

    if (errors.length > 0) {
      throw new Error(`Configuration validation failed:\n${errors.join('\n')}`);
    }
  }
} 