import { ConfigFactory, AppConfig } from '../shared/infrastructure/config/AppConfig';
import { RabbitMQClient } from '../shared/infrastructure/messaging/RabbitMQClient';
import { BatchProcessor } from '../shared/infrastructure/batch/BatchProcessor';
import { RetryMechanism } from '../shared/infrastructure/retry/RetryMechanism';
import { RabbitMQDeadLetterQueueService } from '../shared/infrastructure/retry/DeadLetterQueueService';
import { ConsoleLogger, Logger } from '../shared/application/logging/logger';
import { OrderProcessingStrategy } from '../order/infrastructure/event-processing/OrderProcessingStrategy';
import { NotificationObserver } from '../shared/application/patterns/observer/NotificationObserver';
import { EventProcessingService } from '../shared/infrastructure/event-processing/EventProcessingService';
import { DependencyContainer } from './DependencyContainer';

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
  private readonly dlqService: RabbitMQDeadLetterQueueService;
  private readonly orderProcessingStrategy: OrderProcessingStrategy;
  private readonly notificationObserver: NotificationObserver;
  private readonly eventProcessingService: EventProcessingService;
  private readonly container: DependencyContainer;

  constructor() {
    // Initialize dependency container
    this.container = DependencyContainer.getInstance();
    this.container.initialize();

    // Resolve dependencies from container
    this.config = this.container.get<AppConfig>('AppConfig');
    this.logger = this.container.get<Logger>('Logger');
    this.rabbitMQClient = this.container.get<RabbitMQClient>('RabbitMQClient');
    this.batchProcessor = this.container.get<BatchProcessor>('BatchProcessor');
    this.retryMechanism = this.container.get<RetryMechanism>('RetryMechanism');
    this.dlqService = this.container.get<RabbitMQDeadLetterQueueService>('DeadLetterQueueService');
    this.orderProcessingStrategy = this.container.get<OrderProcessingStrategy>('OrderProcessingStrategy');
    this.notificationObserver = this.container.get<NotificationObserver>('NotificationObserver');
    this.eventProcessingService = this.container.get<EventProcessingService>('EventProcessingService');
  }

  /**
   * Starts the application and all its services
   */
  async start(): Promise<void> {
    try {
      this.logger.info('Starting application...');

      // Connect to RabbitMQ
      await this.rabbitMQClient.connect();

      // Initialize Dead Letter Queue Service
      await this.dlqService.initialize();

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