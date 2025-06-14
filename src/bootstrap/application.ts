import { ConfigFactory, AppConfig } from '../shared/infrastructure/config/AppConfig';
import { RabbitMQClient } from '../shared/infrastructure/messaging/RabbitMQClient';
import { BatchProcessor } from '../shared/infrastructure/batch/BatchProcessor';
import { RetryMechanism } from '../shared/infrastructure/retry/RetryMechanism';
import { ConsoleLogger, Logger } from '../shared/application/logging/logger';
import { OrderProcessingStrategy } from '../shared/application/patterns/strategy/order-processing-strategy';
import { NotificationObserver } from '../shared/application/patterns/observer/notification-observer';
import { EventProcessingService } from './event-processing-service';

/**
 * Main Application Bootstrap Class
 * 
 * Orchestrates the application startup, dependency resolution,
 * and graceful shutdown using the dependency container.
 */
export class Application {
  private readonly config: AppConfig;
  private readonly logger: Logger;
  private readonly rabbitMQClient: RabbitMQClient;
  private readonly batchProcessor: BatchProcessor;
  private readonly retryMechanism: RetryMechanism;
  private readonly orderProcessingStrategy: OrderProcessingStrategy;
  private readonly notificationObserver: NotificationObserver;
  private readonly eventProcessingService: EventProcessingService;

  constructor() {
    // Initialize configuration
    this.config = ConfigFactory.create();
    ConfigFactory.validate(this.config);

    // Initialize logger
    this.logger = new ConsoleLogger();

    // Initialize infrastructure services
    this.rabbitMQClient = new RabbitMQClient(this.config.rabbitmq, this.logger);
    this.batchProcessor = new BatchProcessor(this.logger, this.config.batch);
    this.retryMechanism = new RetryMechanism(this.logger, this.config.retry);

    // Initialize application services
    this.orderProcessingStrategy = new OrderProcessingStrategy(this.logger);
    this.notificationObserver = new NotificationObserver(this.logger);

    // Initialize event processing service
    this.eventProcessingService = new EventProcessingService(
      this.logger,
      this.batchProcessor,
      this.notificationObserver,
      this.rabbitMQClient,
      this.config
    );
  }

  /**
   * Starts the application and all its services
   */
  async start(): Promise<void> {
    try {
      this.logger.info('Starting application...');

      // Connect to RabbitMQ
      await this.rabbitMQClient.connect();

      // Register strategies with batch processor
      this.batchProcessor.registerStrategy('OrderCreated', this.orderProcessingStrategy);
      this.batchProcessor.registerStrategy('OrderCancelled', this.orderProcessingStrategy);
      this.batchProcessor.registerStrategy('OrderCompleted', this.orderProcessingStrategy);
      this.batchProcessor.registerStrategy('OrderConfirmed', this.orderProcessingStrategy);
      this.batchProcessor.registerStrategy('OrderShipped', this.orderProcessingStrategy);

      // Start event processing service
      await this.eventProcessingService.start();

      this.logger.info('Application started successfully');
    } catch (error) {
      this.logger.error('Failed to start application', { error });
      throw error;
    }
  }

  /**
   * Stops the application and all its services
   */
  async stop(): Promise<void> {
    try {
      this.logger.info('Stopping application...');

      // Stop event processing service
      await this.eventProcessingService.stop();

      // Disconnect from RabbitMQ
      await this.rabbitMQClient.disconnect();

      this.logger.info('Application stopped successfully');
    } catch (error) {
      this.logger.error('Failed to stop application', { error });
      throw error;
    }
  }
} 