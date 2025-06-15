import { DependencyContainer } from '../../bootstrap/DependencyContainer';
import { AppConfig } from '../../shared/infrastructure/config/AppConfig';
import { RabbitMQClient } from '../../shared/infrastructure/messaging/RabbitMQClient';
import { BatchProcessor } from '../../shared/infrastructure/batch/BatchProcessor';
import { RetryMechanism } from '../../shared/infrastructure/retry/RetryMechanism';
import { ConsoleLogger, Logger } from '../../shared/application/logging/logger';
import { OrderProcessingStrategy } from '../../order/infrastructure/event-processing/OrderProcessingStrategy';
import { NotificationObserver } from '../../shared/application/patterns/observer/NotificationObserver';
import { EventProcessingService } from '../../shared/infrastructure/event-processing/EventProcessingService';

describe('DependencyContainer', () => {
  let container: DependencyContainer;

  beforeEach(() => {
    container = DependencyContainer.getInstance();
  });

  it('should get AppConfig', () => {
    const config = container.get<AppConfig>('AppConfig');
    expect(config).toBeDefined();
    expect(config.app).toBeDefined();
    expect(config.rabbitmq).toBeDefined();
    expect(config.batch).toBeDefined();
    expect(config.retry).toBeDefined();
    expect(config.worker).toBeDefined();
    expect(config.database).toBeDefined();
  });

  it('should get RabbitMQClient', () => {
    const client = container.get<RabbitMQClient>('RabbitMQClient');
    expect(client).toBeDefined();
    expect(client).toBeInstanceOf(RabbitMQClient);
  });

  it('should get BatchProcessor', () => {
    const processor = container.get<BatchProcessor>('BatchProcessor');
    expect(processor).toBeDefined();
    expect(processor).toBeInstanceOf(BatchProcessor);
  });

  it('should get RetryMechanism', () => {
    const mechanism = container.get<RetryMechanism>('RetryMechanism');
    expect(mechanism).toBeDefined();
    expect(mechanism).toBeInstanceOf(RetryMechanism);
  });

  it('should get Logger', () => {
    const logger = container.get<Logger>('Logger');
    expect(logger).toBeDefined();
    expect(logger).toBeInstanceOf(ConsoleLogger);
  });

  it('should get OrderProcessingStrategy', () => {
    const strategy = container.get<OrderProcessingStrategy>('OrderProcessingStrategy');
    expect(strategy).toBeDefined();
    expect(strategy).toBeInstanceOf(OrderProcessingStrategy);
  });

  it('should get NotificationObserver', () => {
    const observer = container.get<NotificationObserver>('NotificationObserver');
    expect(observer).toBeDefined();
    expect(observer).toBeInstanceOf(NotificationObserver);
  });

  it('should get EventProcessingService', () => {
    const service = container.get<EventProcessingService>('EventProcessingService');
    expect(service).toBeDefined();
    expect(service).toBeInstanceOf(EventProcessingService);
  });

  it('should return the same instance for singleton services', () => {
    const logger1 = container.get<Logger>('Logger');
    const logger2 = container.get<Logger>('Logger');
    expect(logger1).toBe(logger2);
  });
}); 