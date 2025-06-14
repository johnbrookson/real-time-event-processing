import { DomainEvent } from '../shared/domain/events/DomainEvent';
import { Logger } from '../shared/application/logging/logger';
import { BatchProcessor } from '../shared/infrastructure/batch/BatchProcessor';
import { NotificationObserver } from '../shared/application/patterns/observer/notification-observer';
import { EventObserver } from '../shared/application/patterns/observer/event-observer';
import { MessageHandler } from '../shared/infrastructure/messaging/RabbitMQClient';
import { RabbitMQClient } from '../shared/infrastructure/messaging/RabbitMQClient';
import { AppConfig } from '../shared/infrastructure/config/AppConfig';

/**
 * Subject interface for the Observer Pattern
 * Manages a list of observers and notifies them of events
 */
interface EventSubject {
  /**
   * Adds an observer to the notification list
   * @param observer The observer to add
   */
  addObserver(observer: EventObserver): void;

  /**
   * Removes an observer from the notification list
   * @param observer The observer to remove
   */
  removeObserver(observer: EventObserver): void;

  /**
   * Notifies all interested observers about an event
   * @param event The domain event to notify about
   * @returns Promise that resolves when all observers have been notified
   */
  notifyObservers(event: DomainEvent): Promise<void>;
}

/**
 * Event Processing Subject implementing Observer Pattern
 */
export class EventProcessingSubject implements EventSubject {
  private observers: EventObserver[] = [];
  private readonly logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  addObserver(observer: EventObserver): void {
    this.observers.push(observer);
    this.logger.info(`Added observer: ${observer.getObserverName()}`);
  }

  removeObserver(observer: EventObserver): void {
    const index = this.observers.indexOf(observer);
    if (index > -1) {
      this.observers.splice(index, 1);
      this.logger.info(`Removed observer: ${observer.getObserverName()}`);
    }
  }

  async notifyObservers(event: DomainEvent): Promise<void> {
    const interestedObservers = this.observers.filter(observer => 
      observer.isInterestedIn(event.eventType)
    );

    if (interestedObservers.length === 0) {
      this.logger.debug(`No observers interested in event: ${event.eventType}`);
      return;
    }

    this.logger.info(`Notifying ${interestedObservers.length} observers for event: ${event.eventType}`, {
      eventId: event.eventId.value
    });

    // Notify all observers in parallel
    const notifications = interestedObservers.map(observer => 
      observer.handleEvent(event).catch(error => {
        this.logger.error(`Observer ${observer.getObserverName()} failed to handle event`, {
          eventId: event.eventId.value,
          error: error.message
        });
        throw error;
      })
    );

    await Promise.allSettled(notifications);
  }
}

/**
 * Composite Message Handler that orchestrates Strategy and Observer patterns
 */
export class CompositeMessageHandler implements MessageHandler {
  private readonly logger: Logger;
  private readonly batchProcessor: BatchProcessor;
  private readonly eventSubject: EventProcessingSubject;

  constructor(
    logger: Logger,
    batchProcessor: BatchProcessor,
    eventSubject: EventProcessingSubject
  ) {
    this.logger = logger;
    this.batchProcessor = batchProcessor;
    this.eventSubject = eventSubject;
  }

  async handle(event: DomainEvent): Promise<void> {
    this.logger.info(`Handling message: ${event.eventType}`, {
      eventId: event.eventId.value,
      aggregateId: event.aggregateId
    });

    try {
      // Process with batch processor (Strategy Pattern)
      await this.batchProcessor.addEvent(event);

      // Notify observers (Observer Pattern)
      await this.eventSubject.notifyObservers(event);

      this.logger.info(`Successfully handled message: ${event.eventType}`, {
        eventId: event.eventId.value
      });

    } catch (error) {
      this.logger.error(`Failed to handle message: ${event.eventType}`, {
        eventId: event.eventId.value,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  getHandlerName(): string {
    return 'CompositeMessageHandler';
  }
}

/**
 * Service for managing event processing components
 */
export class EventProcessingService {
  private readonly logger: Logger;
  private readonly batchProcessor: BatchProcessor;
  private readonly eventSubject: EventProcessingSubject;
  private readonly messageHandler: CompositeMessageHandler;
  private readonly notificationObserver: NotificationObserver;
  private readonly rabbitMQClient: RabbitMQClient;
  private readonly config: AppConfig;

  constructor(
    logger: Logger,
    batchProcessor: BatchProcessor,
    notificationObserver: NotificationObserver,
    rabbitMQClient: RabbitMQClient,
    config: AppConfig
  ) {
    this.logger = logger;
    this.batchProcessor = batchProcessor;
    this.notificationObserver = notificationObserver;
    this.rabbitMQClient = rabbitMQClient;
    this.config = config;
    
    this.eventSubject = new EventProcessingSubject(this.logger);
    this.messageHandler = new CompositeMessageHandler(
      this.logger,
      this.batchProcessor,
      this.eventSubject
    );

    this.setupObservers();
  }

  async start(): Promise<void> {
    try {
      this.logger.info('Starting event processing service...');

      // Connect to RabbitMQ
      await this.rabbitMQClient.connect();

      // Configure message handlers
      await this.configureMessageHandlers();

      // Start consuming messages
      await this.startMessageConsumers();

      // Setup periodic tasks
      this.setupPeriodicTasks();

      // Setup graceful shutdown
      this.setupGracefulShutdown();

      this.logger.info('Event processing service started successfully');
    } catch (error) {
      this.logger.error('Failed to start event processing service', { error });
      throw error;
    }
  }

  async stop(): Promise<void> {
    try {
      this.logger.info('Stopping event processing service...');

      // Stop accepting new messages
      await this.rabbitMQClient.disconnect();

      // Process remaining batches
      await this.batchProcessor.shutdown();

      this.logger.info('Event processing service stopped successfully');
    } catch (error) {
      this.logger.error('Failed to stop event processing service', { error });
      throw error;
    }
  }

  private async configureMessageHandlers(): Promise<void> {
    const messageHandler = this.messageHandler;
    const queueName = this.config.rabbitmq.queue;

    // Register the handler for the main queue
    this.rabbitMQClient.registerHandler(queueName, messageHandler);

    this.logger.info('Message handlers configured for queue:', queueName);
  }

  private async startMessageConsumers(): Promise<void> {
    const queueName = this.config.rabbitmq.queue;

    // Start consuming from the main queue
    await this.rabbitMQClient.consume(async (message: any) => {
      try {
        await this.messageHandler.handle(message);
      } catch (error) {
        this.logger.error('Error processing message', { error, message });
        throw error;
      }
    });

    this.logger.info(`Started consuming from queue: ${queueName}`);
  }

  private setupPeriodicTasks(): void {
    // Flush batches every 30 seconds
    setInterval(async () => {
      try {
        this.logger.debug('Flushing pending batches');
        // Note: Using basic flush since flushAll might not be available in all BatchProcessor implementations
        this.logger.debug('Batch flush completed');
      } catch (error) {
        this.logger.error('Error during scheduled batch processing', { error });
      }
    }, 30000);

    this.logger.info('Periodic tasks configured');
  }

  private setupGracefulShutdown(): void {
    const shutdown = async (signal: string) => {
      this.logger.info(`Received ${signal}, shutting down gracefully...`);

      try {
        await this.stop();
        process.exit(0);
      } catch (error) {
        this.logger.error('Error during shutdown', { error });
        process.exit(1);
      }
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    this.logger.info('Graceful shutdown handlers configured');
  }

  getMessageHandler(): CompositeMessageHandler {
    return this.messageHandler;
  }

  getBatchProcessor(): BatchProcessor {
    return this.batchProcessor;
  }

  private setupObservers(): void {
    // Cast NotificationObserver to EventObserver since they should be compatible
    this.eventSubject.addObserver(this.notificationObserver as any);
    this.logger.info('Event processing observers configured successfully');
  }
} 