import { ConfigFactory, AppConfig } from '../shared/infrastructure/config/AppConfig';
import { RabbitMQClient } from '../shared/infrastructure/messaging/RabbitMQClient';
import { BatchProcessor } from '../shared/infrastructure/batch/BatchProcessor';
import { RetryMechanism } from '../shared/infrastructure/retry/RetryMechanism';
import { ConsoleLogger, Logger } from '../shared/application/logging/logger';
import { OrderProcessingStrategy } from '../shared/application/patterns/strategy/OrderProcessingStrategy';
import { NotificationObserver } from '../shared/application/patterns/observer/NotificationObserver';
import { EventProcessingService } from './EventProcessingService';

/**
 * Simple Dependency Injection Container
 * 
 * Manages application dependencies and their lifecycles using the Singleton pattern.
 * Provides a centralized way to register and resolve dependencies, following
 * Dependency Inversion Principle.
 * 
 * Benefits:
 * - Centralized dependency management
 * - Lazy initialization of dependencies
 * - Singleton pattern for shared instances
 * - Easy testing with dependency mocking
 * - Proper dependency ordering and lifecycle management
 */
export class DependencyContainer {
  private static instance: DependencyContainer;
  private dependencies: Map<string, any> = new Map();
  private initialized = false;

  private constructor() {}

  static getInstance(): DependencyContainer {
    if (!this.instance) {
      this.instance = new DependencyContainer();
    }
    return this.instance;
  }

  initialize(): void {
    if (this.initialized) {
      return;
    }

    // Initialize configuration
    const config = ConfigFactory.create();
    ConfigFactory.validate(config);
    this.dependencies.set('AppConfig', config);

    // Initialize logger
    const logger = new ConsoleLogger();
    this.dependencies.set('Logger', logger);
    this.dependencies.set('ConsoleLogger', logger);

    // Initialize infrastructure services
    const rabbitMQClient = new RabbitMQClient(config.rabbitmq, logger);
    this.dependencies.set('RabbitMQClient', rabbitMQClient);

    const batchProcessor = new BatchProcessor(logger, config.batch);
    this.dependencies.set('BatchProcessor', batchProcessor);

    const retryMechanism = new RetryMechanism(logger, config.retry);
    this.dependencies.set('RetryMechanism', retryMechanism);

    // Initialize application services
    const orderProcessingStrategy = new OrderProcessingStrategy(logger);
    this.dependencies.set('OrderProcessingStrategy', orderProcessingStrategy);

    const notificationObserver = new NotificationObserver(logger);
    this.dependencies.set('NotificationObserver', notificationObserver);

    // Initialize event processing service
    const eventProcessingService = new EventProcessingService(
      logger,
      batchProcessor,
      notificationObserver,
      rabbitMQClient,
      retryMechanism,
      config
    );
    this.dependencies.set('EventProcessingService', eventProcessingService);

    this.initialized = true;
  }

  get<T>(key: string): T {
    if (!this.initialized) {
      this.initialize();
    }

    const dependency = this.dependencies.get(key);
    if (!dependency) {
      throw new Error(`Dependency '${key}' not found in container`);
    }

    return dependency as T;
  }

  has(key: string): boolean {
    if (!this.initialized) {
      this.initialize();
    }
    return this.dependencies.has(key);
  }

  set<T>(key: string, value: T): void {
    this.dependencies.set(key, value);
  }

  clear(): void {
    this.dependencies.clear();
    this.initialized = false;
  }
}




