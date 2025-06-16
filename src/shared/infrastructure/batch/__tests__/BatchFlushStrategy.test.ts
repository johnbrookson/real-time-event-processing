import { BatchFlushStrategy } from '../BatchFlushStrategy';
import { Logger } from '../../../application/logging/logger';
import { DomainEvent } from '../../../domain/events/DomainEvent';
import { EventId } from '../../../domain/value-objects/EventId';

// Mock Logger
jest.mock('../../../application/logging/logger');

describe('BatchFlushStrategy', () => {
  let strategy: BatchFlushStrategy;
  let mockLogger: jest.Mocked<Logger>;
  let sampleEvent: DomainEvent;

  beforeEach(() => {
    // Create mock logger
    mockLogger = {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      log: jest.fn()
    } as jest.Mocked<Logger>;

    // Create strategy instance
    strategy = new BatchFlushStrategy(mockLogger);

    // Create sample BatchFlush event with valid UUID
    sampleEvent = {
      eventId: new EventId('550e8400-e29b-41d4-a716-446655440000'),
      eventType: 'BatchFlush',
      aggregateId: 'batch-aggregate-456',
      data: { trigger: 'periodic' },
      version: 1,
      occurredOn: new Date()
    } as DomainEvent;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should create BatchFlushStrategy instance with logger', () => {
      // Act & Assert
      expect(strategy).toBeInstanceOf(BatchFlushStrategy);
      expect(strategy.getStrategyName()).toBe('BatchFlushStrategy');
    });
  });

  describe('getStrategyName', () => {
    it('should return correct strategy name', () => {
      // Act
      const strategyName = strategy.getStrategyName();

      // Assert
      expect(strategyName).toBe('BatchFlushStrategy');
    });
  });

  describe('process', () => {
    it('should process BatchFlush event successfully', async () => {
      // Act & Assert
      await expect(strategy.process(sampleEvent)).resolves.toBeUndefined();
    });

    it('should complete processing without errors', async () => {
      // Act & Assert
      await expect(strategy.process(sampleEvent)).resolves.toBeUndefined();
    });

    it('should handle event with minimal data', async () => {
      // Arrange
      const minimalEvent = {
        eventId: new EventId('550e8400-e29b-41d4-a716-446655440001'),
        eventType: 'BatchFlush',
        aggregateId: 'minimal-aggregate',
        data: {},
        version: 1,
        occurredOn: new Date()
      } as DomainEvent;

      // Act & Assert
      await expect(strategy.process(minimalEvent)).resolves.toBeUndefined();
    });

    it('should handle event with complex data structure', async () => {
      // Arrange
      const complexEvent = {
        eventId: new EventId('550e8400-e29b-41d4-a716-446655440002'),
        eventType: 'BatchFlush',
        aggregateId: 'complex-aggregate',
        data: {
          trigger: 'manual',
          reason: 'force_flush',
          metadata: {
            source: 'admin_panel',
            timestamp: new Date().toISOString()
          }
        },
        version: 2,
        occurredOn: new Date()
      } as DomainEvent;

      // Act & Assert
      await expect(strategy.process(complexEvent)).resolves.toBeUndefined();
    });
  });



  describe('interface compliance', () => {
    it('should implement ProcessingStrategy interface', () => {
      // Assert
      expect(typeof strategy.process).toBe('function');
      expect(typeof strategy.getStrategyName).toBe('function');
    });

    it('should implement IBatchFlushStrategy interface', () => {
      // Act & Assert
      expect(strategy).toHaveProperty('process');
      expect(strategy).toHaveProperty('getStrategyName');
    });
  });

  describe('performance', () => {
    it('should handle multiple events sequentially', async () => {
      // Arrange
      const events = [
        sampleEvent,
        { ...sampleEvent, eventId: new EventId('550e8400-e29b-41d4-a716-446655440003') },
        { ...sampleEvent, eventId: new EventId('550e8400-e29b-41d4-a716-446655440004') }
      ];

      // Act & Assert
      for (const event of events) {
        await expect(strategy.process(event as DomainEvent)).resolves.toBeUndefined();
      }
    });

    it('should process events quickly', async () => {
      // Arrange
      const startTime = Date.now();

      // Act
      await strategy.process(sampleEvent);
      const endTime = Date.now();

      // Assert
      const processingTime = endTime - startTime;
      expect(processingTime).toBeLessThan(100); // Should complete in less than 100ms
    });
  });
}); 