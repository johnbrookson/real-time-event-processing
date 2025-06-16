import { OrderProcessingStrategy } from '../OrderProcessingStrategy';
import { OrderCreatedEvent } from '../../../domain/events/OrderCreatedEvent';
import { OrderCancelledEvent } from '../../../domain/events/OrderCancelledEvent';
import { OrderCompletedEvent } from '../../../domain/events/OrderCompletedEvent';
import { Order } from '../../../domain/entities/Order';
import { Address } from '../../../domain/value-objects/Address';
import { Money } from '../../../domain/value-objects/Money';
import { OrderItem } from '../../../domain/value-objects/OrderItem';
import { Logger } from '../../../../shared/application/logging/logger';
import { DomainEvent } from '../../../../shared/domain/events/DomainEvent';
import { EventId } from '../../../../shared/domain/value-objects/EventId';

// Mock setTimeout to speed up tests - simplified approach

describe('OrderProcessingStrategy', () => {
  let strategy: OrderProcessingStrategy;
  let mockLogger: jest.Mocked<Logger>;
  let sampleOrder: Order;
  let orderCreatedEvent: OrderCreatedEvent;
  let orderCancelledEvent: OrderCancelledEvent;
  let orderCompletedEvent: OrderCompletedEvent;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Mock setTimeout to resolve immediately for faster tests
    jest.spyOn(global, 'setTimeout').mockImplementation((callback: any) => {
      if (typeof callback === 'function') {
        callback();
      }
      return {} as any;
    });

    // Create mock logger
    mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn()
    };

    // Create strategy instance
    strategy = new OrderProcessingStrategy(mockLogger);

    // Create sample order
    const shippingAddress = new Address({
      street: 'Main St',
      number: '123',
      complement: 'Suite 100',
      neighborhood: 'Downtown',
      city: 'New York',
      state: 'NY',
      zipCode: '10001',
      country: 'USA'
    });

    const billingAddress = new Address({
      street: 'Billing St',
      number: '456',
      complement: 'Apt 200',
      neighborhood: 'Uptown',
      city: 'New York',
      state: 'NY',
      zipCode: '10002',
      country: 'USA'
    });

    const orderItem = new OrderItem({
      productId: 'product-123',
      quantity: 2,
      unitPrice: new Money(50.00),
      totalPrice: new Money(100.00)
    });

    sampleOrder = new Order({
      id: 'order-456',
      customerId: 'customer-789',
      status: 'pending',
      items: [orderItem],
      total: new Money(100.00),
      shippingAddress,
      billingAddress
    });

    // Create events
    orderCreatedEvent = new OrderCreatedEvent(sampleOrder);
    orderCancelledEvent = new OrderCancelledEvent(sampleOrder, 'Customer request');
    orderCompletedEvent = new OrderCompletedEvent(sampleOrder);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('getStrategyName', () => {
    it('should return correct strategy name', () => {
      // Act
      const result = strategy.getStrategyName();

      // Assert
      expect(result).toBe('OrderProcessingStrategy');
    });
  });

  describe('getTotalProcessed', () => {
    it('should return initial count as 0', () => {
      // Act
      const result = strategy.getTotalProcessed();

      // Assert
      expect(result).toBe(0);
    });

    it('should increment count after successful processing', async () => {
      // Act
      await strategy.process(orderCreatedEvent);

      // Assert
      expect(strategy.getTotalProcessed()).toBe(1);
    });

    it('should not increment count after failed processing', async () => {
      // Arrange
      const invalidEvent = new OrderCreatedEvent(sampleOrder);
      // Override data to make it invalid
      (invalidEvent as any).data = { ...invalidEvent.data, customerId: null };

      // Act & Assert
      await expect(strategy.process(invalidEvent)).rejects.toThrow();
      expect(strategy.getTotalProcessed()).toBe(0);
    });
  });

  describe('process', () => {
    it('should process OrderCreated event successfully', async () => {
      // Act
      await strategy.process(orderCreatedEvent);

      // Assert
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('Processing order event with strategy'),
        expect.objectContaining({
          eventType: 'OrderCreated',
          strategy: 'OrderProcessingStrategy'
        })
      );

      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('Order event processed successfully'),
        expect.objectContaining({
          eventType: 'OrderCreated',
          totalProcessed: 1
        })
      );

      expect(strategy.getTotalProcessed()).toBe(1);
    });

    it('should process OrderCancelled event successfully', async () => {
      // Act
      await strategy.process(orderCancelledEvent);

      // Assert
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('Processing order event with strategy'),
        expect.objectContaining({
          eventType: 'OrderCancelled',
          strategy: 'OrderProcessingStrategy'
        })
      );

      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('Order event processed successfully'),
        expect.objectContaining({
          eventType: 'OrderCancelled',
          totalProcessed: 1
        })
      );
    });

    it('should process OrderCompleted event successfully', async () => {
      // Act
      await strategy.process(orderCompletedEvent);

      // Assert
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('Processing order event with strategy'),
        expect.objectContaining({
          eventType: 'OrderCompleted',
          strategy: 'OrderProcessingStrategy'
        })
      );

      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('Order event processed successfully'),
        expect.objectContaining({
          eventType: 'OrderCompleted',
          totalProcessed: 1
        })
      );
    });

    it('should handle unhandled event types', async () => {
      // Arrange
      const unknownEvent: DomainEvent = {
        eventId: new EventId('550e8400-e29b-41d4-a716-446655440000'),
        eventType: 'UnknownEvent',
        aggregateId: 'test-aggregate',
        occurredOn: new Date(),
        version: 1,
        data: {}
      };

      // Act
      await strategy.process(unknownEvent);

      // Assert
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Unhandled event type in OrderProcessingStrategy',
        expect.objectContaining({
          eventType: 'UnknownEvent'
        })
      );

      expect(strategy.getTotalProcessed()).toBe(0);
    });

    it('should log error and rethrow when processing fails', async () => {
      // Arrange
      const invalidEvent = new OrderCreatedEvent(sampleOrder);
      // Override data to make it invalid
      (invalidEvent as any).data = { ...invalidEvent.data, customerId: null };

      // Act & Assert
      await expect(strategy.process(invalidEvent)).rejects.toThrow('Invalid order: customerId is required');

      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed to process order event'),
        expect.objectContaining({
          eventType: 'OrderCreated',
          error: 'Invalid order: customerId is required'
        })
      );

      expect(strategy.getTotalProcessed()).toBe(0);
    });
  });

  describe('handleOrderCreated', () => {
    it('should process valid OrderCreated event through all steps', async () => {
      // Act
      await strategy.process(orderCreatedEvent);

      // Assert - Check all processing steps were logged
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('Processing OrderCreated event'),
        expect.objectContaining({
          orderId: 'order-456',
          customerId: 'customer-789',
          total: 100
        })
      );

      expect(mockLogger.info).toHaveBeenCalledWith('🔍 Step 1/5: Validating order data...');
      expect(mockLogger.info).toHaveBeenCalledWith('📦 Step 2/5: Checking inventory availability...');
      expect(mockLogger.info).toHaveBeenCalledWith('🔒 Step 3/5: Reserving inventory...');
      expect(mockLogger.info).toHaveBeenCalledWith('💳 Step 4/5: Processing payment authorization...');
      expect(mockLogger.info).toHaveBeenCalledWith('📧 Step 5/5: Sending order confirmation...');

      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('Order creation processing completed'),
        expect.objectContaining({
          orderId: 'order-456',
          status: 'confirmed'
        })
      );
    });

    it('should throw error when customerId is null', async () => {
      // Arrange
      const invalidEvent = new OrderCreatedEvent(sampleOrder);
      (invalidEvent as any).data = { ...invalidEvent.data, customerId: null };

      // Act & Assert
      await expect(strategy.process(invalidEvent)).rejects.toThrow('Invalid order: customerId is required');

      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('VALIDATION FAILED: customerId is required'),
        expect.objectContaining({
          customerId: null
        })
      );
    });

    it('should throw error when customerId is empty string', async () => {
      // Arrange
      const invalidEvent = new OrderCreatedEvent(sampleOrder);
      (invalidEvent as any).data = { ...invalidEvent.data, customerId: '' };

      // Act & Assert
      await expect(strategy.process(invalidEvent)).rejects.toThrow('Invalid order: customerId is required');
    });

    it('should throw error when total is not a number', async () => {
      // Arrange
      const invalidEvent = new OrderCreatedEvent(sampleOrder);
      (invalidEvent as any).data = { ...invalidEvent.data, total: 'invalid' };

      // Act & Assert
      await expect(strategy.process(invalidEvent)).rejects.toThrow('Invalid order: total must be a positive number');

      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('VALIDATION FAILED: total must be a positive number'),
        expect.objectContaining({
          total: 'invalid',
          type: 'string'
        })
      );
    });

    it('should throw error when total is zero', async () => {
      // Arrange
      const invalidEvent = new OrderCreatedEvent(sampleOrder);
      (invalidEvent as any).data = { ...invalidEvent.data, total: 0 };

      // Act & Assert
      await expect(strategy.process(invalidEvent)).rejects.toThrow('Invalid order: total must be a positive number');
    });

    it('should throw error when total is negative', async () => {
      // Arrange
      const invalidEvent = new OrderCreatedEvent(sampleOrder);
      (invalidEvent as any).data = { ...invalidEvent.data, total: -100 };

      // Act & Assert
      await expect(strategy.process(invalidEvent)).rejects.toThrow('Invalid order: total must be a positive number');
    });

    it('should throw error when items is not an array', async () => {
      // Arrange
      const invalidEvent = new OrderCreatedEvent(sampleOrder);
      (invalidEvent as any).data = { ...invalidEvent.data, items: 'invalid' };

      // Act & Assert
      await expect(strategy.process(invalidEvent)).rejects.toThrow('Invalid order: items array is required and cannot be empty');

      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('VALIDATION FAILED: items array is required and cannot be empty'),
        expect.objectContaining({
          items: 'invalid',
          isArray: false
        })
      );
    });

    it('should throw error when items array is empty', async () => {
      // Arrange
      const invalidEvent = new OrderCreatedEvent(sampleOrder);
      (invalidEvent as any).data = { ...invalidEvent.data, items: [] };

      // Act & Assert
      await expect(strategy.process(invalidEvent)).rejects.toThrow('Invalid order: items array is required and cannot be empty');
    });

    it('should throw error when items is null', async () => {
      // Arrange
      const invalidEvent = new OrderCreatedEvent(sampleOrder);
      (invalidEvent as any).data = { ...invalidEvent.data, items: null };

      // Act & Assert
      await expect(strategy.process(invalidEvent)).rejects.toThrow('Invalid order: items array is required and cannot be empty');
    });
  });

  describe('handleOrderCancelled', () => {
    it('should process OrderCancelled event through all steps', async () => {
      // Act
      await strategy.process(orderCancelledEvent);

      // Assert
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('Processing OrderCancelled event'),
        expect.objectContaining({
          orderId: 'order-456',
          reason: 'Customer request'
        })
      );

      expect(mockLogger.info).toHaveBeenCalledWith('🔍 Step 1/4: Validating cancellation request...');
      expect(mockLogger.info).toHaveBeenCalledWith('📦 Step 2/4: Restoring inventory...');
      expect(mockLogger.info).toHaveBeenCalledWith('💰 Step 3/4: Processing refund...');
      expect(mockLogger.info).toHaveBeenCalledWith('📧 Step 4/4: Sending cancellation notification...');

      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('Order cancellation processing completed'),
        expect.objectContaining({
          orderId: 'order-456',
          status: 'cancelled'
        })
      );
    });

    it('should handle OrderCancelled event without reason', async () => {
      // Arrange
      const eventWithoutReason = new OrderCancelledEvent(sampleOrder, '');
      (eventWithoutReason as any).data = { ...eventWithoutReason.data, reason: undefined };

      // Act
      await strategy.process(eventWithoutReason);

      // Assert
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('Processing OrderCancelled event'),
        expect.objectContaining({
          reason: 'No reason provided'
        })
      );
    });
  });

  describe('handleOrderCompleted', () => {
    it('should process OrderCompleted event through all steps', async () => {
      // Act
      await strategy.process(orderCompletedEvent);

      // Assert
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('Processing OrderCompleted event'),
        expect.objectContaining({
          orderId: 'order-456',
          completedAt: expect.any(Date)
        })
      );

      expect(mockLogger.info).toHaveBeenCalledWith('📝 Step 1/4: Updating order status...');
      expect(mockLogger.info).toHaveBeenCalledWith('🧾 Step 2/4: Generating invoice...');
      expect(mockLogger.info).toHaveBeenCalledWith('⭐ Step 3/4: Updating customer loyalty points...');
      expect(mockLogger.info).toHaveBeenCalledWith('📧 Step 4/4: Sending completion notification...');

      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('Order completion processing completed'),
        expect.objectContaining({
          orderId: 'order-456',
          status: 'completed'
        })
      );
    });
  });



  describe('error handling with unknown error types', () => {
    it('should handle non-Error thrown objects', async () => {
      // Arrange
      const processingStrategy = new OrderProcessingStrategy(mockLogger);
      
      // Mock setTimeout to throw a non-Error object
      const originalSetTimeout = global.setTimeout;
      global.setTimeout = jest.fn(() => {
        throw 'String error';
      }) as any;

      try {
        // Act & Assert
        await expect(processingStrategy.process(orderCreatedEvent)).rejects.toBe('String error');

        expect(mockLogger.error).toHaveBeenCalledWith(
          expect.stringContaining('Failed to process order event'),
          expect.objectContaining({
            error: 'Unknown error'
          })
        );
      } finally {
        // Restore original setTimeout
        global.setTimeout = originalSetTimeout;
      }
    });
  });
}); 