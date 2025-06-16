import { RetryableMessageHandler } from '../RetryableMessageHandler';
import { Logger } from '../../../application/logging/logger';
import { RetryMechanism } from '../../retry/RetryMechanism';
import { MessageHandler } from '../RabbitMQClient';
import { DomainEvent } from '../../../domain/events/DomainEvent';
import { EventId } from '../../../domain/value-objects/EventId';

// Mock dependencies
jest.mock('../../../application/logging/logger');
jest.mock('../../retry/RetryMechanism');

describe('RetryableMessageHandler', () => {
  let retryableHandler: RetryableMessageHandler;
  let mockLogger: jest.Mocked<Logger>;
  let mockRetryMechanism: jest.Mocked<RetryMechanism>;
  let mockBaseHandler: jest.Mocked<MessageHandler>;

  beforeEach(() => {
    // Create mock logger
    mockLogger = {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      log: jest.fn()
    } as jest.Mocked<Logger>;

    // Create mock retry mechanism
    mockRetryMechanism = {
      executeWithRetry: jest.fn()
    } as unknown as jest.Mocked<RetryMechanism>;

    // Create mock base handler
    mockBaseHandler = {
      handle: jest.fn(),
      getHandlerName: jest.fn().mockReturnValue('MockBaseHandler')
    } as jest.Mocked<MessageHandler>;

    // Create RetryableMessageHandler instance
    retryableHandler = new RetryableMessageHandler(
      mockLogger,
      mockRetryMechanism,
      mockBaseHandler
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should create RetryableMessageHandler instance with dependencies', () => {
      // Act & Assert
      expect(retryableHandler).toBeInstanceOf(RetryableMessageHandler);
      expect(retryableHandler.getHandlerName()).toBe('RetryableMessageHandler(MockBaseHandler)');
    });

    it('should accept different base handlers', () => {
      // Arrange
      const customBaseHandler = {
        handle: jest.fn(),
        getHandlerName: jest.fn().mockReturnValue('CustomHandler')
      } as jest.Mocked<MessageHandler>;

      // Act
      const customRetryableHandler = new RetryableMessageHandler(
        mockLogger,
        mockRetryMechanism,
        customBaseHandler
      );

      // Assert
      expect(customRetryableHandler.getHandlerName()).toBe('RetryableMessageHandler(CustomHandler)');
    });
  });

  describe('getHandlerName', () => {
    it('should return correct handler name format', () => {
      // Act
      const handlerName = retryableHandler.getHandlerName();

      // Assert
      expect(handlerName).toBe('RetryableMessageHandler(MockBaseHandler)');
    });

    it('should update name when base handler name changes', () => {
      // Arrange
      mockBaseHandler.getHandlerName.mockReturnValue('UpdatedHandler');

      // Act
      const handlerName = retryableHandler.getHandlerName();

      // Assert
      expect(handlerName).toBe('RetryableMessageHandler(UpdatedHandler)');
    });
  });

  describe('handle', () => {
    const sampleMessage = {
      eventType: 'OrderCreated',
      eventId: '550e8400-e29b-41d4-a716-446655440000',
      aggregateId: 'order-456',
      data: {
        customerId: 'customer-789',
        total: 100.50,
        items: [{ productId: 'product-1', quantity: 2 }]
      },
      version: 1,
      occurredOn: new Date().toISOString()
    };

    it('should handle message successfully', async () => {
      // Arrange
      mockRetryMechanism.executeWithRetry.mockResolvedValue(undefined);

      // Act
      await retryableHandler.handle(sampleMessage);

      // Assert
      expect(mockLogger.info).toHaveBeenCalledWith(
        '🔄 RETRYABLE HANDLER: Processing message',
        {
          eventType: 'OrderCreated',
          eventId: '550e8400-e29b-41d4-a716-446655440000',
          aggregateId: 'order-456'
        }
      );

      expect(mockRetryMechanism.executeWithRetry).toHaveBeenCalledWith(
        expect.any(Function),
        'MessageProcessing-OrderCreated',
        expect.objectContaining({
          eventType: 'OrderCreated',
          aggregateId: 'order-456'
        })
      );
    });

    it('should handle message without eventType', async () => {
      // Arrange
      const messageWithoutType = {
        eventId: '550e8400-e29b-41d4-a716-446655440001',
        aggregateId: 'aggregate-456',
        data: { some: 'data' }
      };
      mockRetryMechanism.executeWithRetry.mockResolvedValue(undefined);

      // Act
      await retryableHandler.handle(messageWithoutType);

      // Assert
      expect(mockRetryMechanism.executeWithRetry).toHaveBeenCalledWith(
        expect.any(Function),
        'MessageProcessing-Unknown',
        expect.objectContaining({
          eventType: 'UnknownEvent'
        })
      );
    });

    it('should handle message without eventId', async () => {
      // Arrange
      const messageWithoutId = {
        eventType: 'SomeEvent',
        aggregateId: 'aggregate-456',
        data: { some: 'data' }
      };
      mockRetryMechanism.executeWithRetry.mockResolvedValue(undefined);

      // Act
      await retryableHandler.handle(messageWithoutId);

      // Assert
      expect(mockRetryMechanism.executeWithRetry).toHaveBeenCalledWith(
        expect.any(Function),
        'MessageProcessing-SomeEvent',
        expect.objectContaining({
          eventType: 'SomeEvent',
          eventId: expect.any(EventId)
        })
      );
    });

    it('should handle message without aggregateId', async () => {
      // Arrange
      const messageWithoutAggregateId = {
        eventType: 'SomeEvent',
        eventId: '550e8400-e29b-41d4-a716-446655440002',
        data: { some: 'data' }
      };
      mockRetryMechanism.executeWithRetry.mockResolvedValue(undefined);

      // Act
      await retryableHandler.handle(messageWithoutAggregateId);

      // Assert
      expect(mockRetryMechanism.executeWithRetry).toHaveBeenCalledWith(
        expect.any(Function),
        'MessageProcessing-SomeEvent',
        expect.objectContaining({
          eventType: 'SomeEvent',
          aggregateId: 'unknown'
        })
      );
    });

    it('should call base handler through retry mechanism', async () => {
      // Arrange
      mockRetryMechanism.executeWithRetry.mockImplementation(async (fn) => {
        await fn();
      });

      // Act
      await retryableHandler.handle(sampleMessage);

      // Assert
      expect(mockBaseHandler.handle).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'OrderCreated',
          aggregateId: 'order-456'
        })
      );
    });

    it('should log when calling base handler', async () => {
      // Arrange
      mockRetryMechanism.executeWithRetry.mockImplementation(async (fn) => {
        await fn();
      });

      // Act
      await retryableHandler.handle(sampleMessage);

      // Assert
      expect(mockLogger.info).toHaveBeenCalledWith('🔄 RETRYABLE HANDLER: Calling base handler');
    });

    it('should throw error when retry mechanism fails', async () => {
      // Arrange
      const retryError = new Error('All retry attempts failed');
      mockRetryMechanism.executeWithRetry.mockRejectedValue(retryError);

      // Act & Assert
      await expect(retryableHandler.handle(sampleMessage)).rejects.toThrow('All retry attempts failed');

      expect(mockLogger.error).toHaveBeenCalledWith(
        '❌ Message processing failed after all retry attempts',
        expect.objectContaining({
          eventType: 'OrderCreated',
          eventId: '550e8400-e29b-41d4-a716-446655440000',
          error: 'All retry attempts failed'
        })
      );
    });

    it('should handle non-Error objects in failure', async () => {
      // Arrange
      mockRetryMechanism.executeWithRetry.mockRejectedValue('String error');

      // Act & Assert
      await expect(retryableHandler.handle(sampleMessage)).rejects.toBe('String error');

      expect(mockLogger.error).toHaveBeenCalledWith(
        '❌ Message processing failed after all retry attempts',
        expect.objectContaining({
          error: 'Unknown error'
        })
      );
    });
  });

  describe('convertToDomainEvent', () => {
    it('should convert message with all fields to domain event', async () => {
      // Arrange
      const completeMessage = {
        eventType: 'OrderCreated',
        eventId: '550e8400-e29b-41d4-a716-446655440003',
        aggregateId: 'order-456',
        data: { customerId: 'customer-789' },
        version: 2,
        occurredOn: '2023-01-01T12:00:00Z'
      };

      let convertedEvent: DomainEvent | undefined;
      mockRetryMechanism.executeWithRetry.mockImplementation(async (fn, operationName, event) => {
        convertedEvent = event;
        await fn();
      });

      // Act
      await retryableHandler.handle(completeMessage);

      // Assert
      expect(convertedEvent).toMatchObject({
        eventType: 'OrderCreated',
        aggregateId: 'order-456',
        version: 2
      });
      expect(convertedEvent!.eventId).toBeInstanceOf(EventId);
      expect(convertedEvent!.occurredOn).toBeInstanceOf(Date);
    });

    it('should set default values for missing fields', async () => {
      // Arrange
      const incompleteMessage = {
        eventType: 'IncompleteEvent'
      };

      let convertedEvent: DomainEvent | undefined;
      mockRetryMechanism.executeWithRetry.mockImplementation(async (fn, operationName, event) => {
        convertedEvent = event;
        await fn();
      });

      // Act
      await retryableHandler.handle(incompleteMessage);

      // Assert
      expect(convertedEvent).toMatchObject({
        eventType: 'IncompleteEvent',
        aggregateId: 'unknown',
        version: 1
      });
      expect(convertedEvent!.eventId).toBeInstanceOf(EventId);
      expect(convertedEvent!.occurredOn).toBeInstanceOf(Date);
    });
  });

  describe('interface compliance', () => {
    it('should implement MessageHandler interface', () => {
      // Assert
      expect(typeof retryableHandler.handle).toBe('function');
      expect(typeof retryableHandler.getHandlerName).toBe('function');
    });

    it('should implement IRetryableMessageHandler interface', () => {
      // Assert
      expect(retryableHandler).toHaveProperty('handle');
      expect(retryableHandler).toHaveProperty('getHandlerName');
    });
  });
}); 