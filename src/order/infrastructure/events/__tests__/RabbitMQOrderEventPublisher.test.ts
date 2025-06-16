import { RabbitMQOrderEventPublisher } from '../RabbitMQOrderEventPublisher';
import { DomainEvent } from '../../../../shared/domain/events/DomainEvent';
import { OrderCreatedEvent } from '../../../domain/events/OrderCreatedEvent';
import { OrderCancelledEvent } from '../../../domain/events/OrderCancelledEvent';
import { OrderCompletedEvent } from '../../../domain/events/OrderCompletedEvent';
import { Order } from '../../../domain/entities/Order';
import { Address } from '../../../domain/value-objects/Address';
import { Money } from '../../../domain/value-objects/Money';
import { OrderItem } from '../../../domain/value-objects/OrderItem';
import { Logger } from '../../../../shared/application/logging/logger';
import * as amqp from 'amqplib';

// Mock amqplib
jest.mock('amqplib');
const mockAmqp = amqp as jest.Mocked<typeof amqp>;

// Mock ConfigFactory
jest.mock('../../../../shared/infrastructure/config/AppConfig', () => ({
  ConfigFactory: {
    create: jest.fn(() => ({
      rabbitmq: {
        url: 'amqp://localhost:5672'
      }
    }))
  }
}));

describe('RabbitMQOrderEventPublisher', () => {
  let publisher: RabbitMQOrderEventPublisher;
  let mockLogger: jest.Mocked<Logger>;
  let mockConnection: any;
  let mockChannel: any;
  let sampleEvent: DomainEvent;
  let sampleOrder: Order;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Create mock logger
    mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn()
    };

    // Create mock channel and connection
    mockChannel = {
      assertExchange: jest.fn().mockResolvedValue({}),
      assertQueue: jest.fn().mockResolvedValue({}),
      bindQueue: jest.fn().mockResolvedValue({}),
      publish: jest.fn().mockResolvedValue(true),
      close: jest.fn().mockResolvedValue({})
    };

    mockConnection = {
      createChannel: jest.fn().mockResolvedValue(mockChannel),
      close: jest.fn().mockResolvedValue({})
    };

    mockAmqp.connect.mockResolvedValue(mockConnection as any);

    // Create publisher instance
    publisher = new RabbitMQOrderEventPublisher(mockLogger);

    // Create sample order and event
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

    sampleEvent = new OrderCreatedEvent(sampleOrder);
  });

  describe('initialize', () => {
    it('should initialize successfully', async () => {
      // Act
      await publisher.initialize();

      // Assert
      expect(mockAmqp.connect).toHaveBeenCalledWith('amqp://localhost:5672');
      expect(mockConnection.createChannel).toHaveBeenCalled();
      expect(mockChannel.assertExchange).toHaveBeenCalledWith('order.events', 'topic', { durable: true });
      expect(mockChannel.assertQueue).toHaveBeenCalledWith('order.created', { durable: true });
      expect(mockChannel.assertQueue).toHaveBeenCalledWith('order.cancelled', { durable: true });
      expect(mockChannel.assertQueue).toHaveBeenCalledWith('order.completed', { durable: true });
      expect(mockChannel.bindQueue).toHaveBeenCalledWith('order.created', 'order.events', 'order.created');
      expect(mockChannel.bindQueue).toHaveBeenCalledWith('order.cancelled', 'order.events', 'order.cancelled');
      expect(mockChannel.bindQueue).toHaveBeenCalledWith('order.completed', 'order.events', 'order.completed');
      expect(mockLogger.info).toHaveBeenCalledWith('RabbitMQ Order Event Publisher initialized successfully');
    });

    it('should throw error when connection fails', async () => {
      // Arrange
      const connectionError = new Error('Connection failed');
      mockAmqp.connect.mockRejectedValue(connectionError);

      // Act & Assert
      await expect(publisher.initialize()).rejects.toThrow('Connection failed');
      expect(mockLogger.error).toHaveBeenCalledWith('Failed to initialize RabbitMQ Order Event Publisher:', connectionError);
    });

    it('should throw error when connection is null', async () => {
      // Arrange
      mockAmqp.connect.mockResolvedValue(null as any);

      // Act & Assert
      await expect(publisher.initialize()).rejects.toThrow('Failed to establish RabbitMQ connection');
      expect(mockLogger.error).toHaveBeenCalledWith('Failed to initialize RabbitMQ Order Event Publisher:', expect.any(Error));
    });

    it('should throw error when channel creation fails', async () => {
      // Arrange
      mockConnection.createChannel.mockResolvedValue(null);

      // Act & Assert
      await expect(publisher.initialize()).rejects.toThrow('Failed to create RabbitMQ channel');
      expect(mockLogger.error).toHaveBeenCalledWith('Failed to initialize RabbitMQ Order Event Publisher:', expect.any(Error));
    });

    it('should throw error when channel creation throws', async () => {
      // Arrange
      const channelError = new Error('Channel creation failed');
      mockConnection.createChannel.mockRejectedValue(channelError);

      // Act & Assert
      await expect(publisher.initialize()).rejects.toThrow('Channel creation failed');
      expect(mockLogger.error).toHaveBeenCalledWith('Failed to initialize RabbitMQ Order Event Publisher:', channelError);
    });

    it('should throw error when exchange assertion fails', async () => {
      // Arrange
      const exchangeError = new Error('Exchange assertion failed');
      mockChannel.assertExchange.mockRejectedValue(exchangeError);

      // Act & Assert
      await expect(publisher.initialize()).rejects.toThrow('Exchange assertion failed');
      expect(mockLogger.error).toHaveBeenCalledWith('Failed to initialize RabbitMQ Order Event Publisher:', exchangeError);
    });
  });

  describe('publish', () => {
    it('should publish event successfully when channel exists', async () => {
      // Arrange
      await publisher.initialize();

      // Act
      await publisher.publish(sampleEvent);

      // Assert
      expect(mockChannel.publish).toHaveBeenCalledWith(
        'order.events',
        'order.order.created',
        expect.any(Buffer),
        { persistent: true }
      );

      // Verify the message content
      const publishCall = mockChannel.publish.mock.calls[0];
      const messageBuffer = publishCall[2];
      const message = JSON.parse(messageBuffer.toString());
      
      expect(message).toEqual({
        eventId: expect.any(String),
        eventType: 'OrderCreated',
        aggregateId: 'order-456',
        occurredOn: expect.any(String),
        version: 1,
        data: {
          orderId: 'order-456',
          customerId: 'customer-789',
          total: 100,
          items: expect.arrayContaining([
            expect.objectContaining({
              productId: 'product-123',
              quantity: 2,
              price: 50
            })
          ])
        }
      });

      expect(mockLogger.info).toHaveBeenCalledWith('Published event: OrderCreated', {
        eventId: expect.any(String),
        routingKey: 'order.order.created'
      });
    });

    it('should initialize channel when channel is null', async () => {
      // Arrange
      // Don't initialize first, so channel is null

      // Act
      await publisher.publish(sampleEvent);

      // Assert
      expect(mockAmqp.connect).toHaveBeenCalled();
      expect(mockChannel.publish).toHaveBeenCalled();
    });

    it('should throw error when initialization fails during publish', async () => {
      // Arrange
      const initError = new Error('Initialization failed');
      mockAmqp.connect.mockRejectedValue(initError);

      // Act & Assert
      await expect(publisher.publish(sampleEvent)).rejects.toThrow('Initialization failed');
    });

    it('should throw error when channel is still null after initialization', async () => {
      // Arrange
      mockConnection.createChannel.mockResolvedValue(null);

      // Act & Assert
      await expect(publisher.publish(sampleEvent)).rejects.toThrow('Failed to create RabbitMQ channel');
    });

    it('should throw error when publish fails', async () => {
      // Arrange
      await publisher.initialize();
      const publishError = new Error('Publish failed');
      mockChannel.publish.mockRejectedValue(publishError);

      // Act & Assert
      await expect(publisher.publish(sampleEvent)).rejects.toThrow('Publish failed');
      expect(mockLogger.error).toHaveBeenCalledWith('Failed to publish event:', {
        eventType: 'OrderCreated',
        eventId: expect.any(String),
        error: 'Publish failed'
      });
    });

    it('should handle unknown error types in publish', async () => {
      // Arrange
      await publisher.initialize();
      const unknownError = 'Unknown error string';
      mockChannel.publish.mockRejectedValue(unknownError);

      // Act & Assert
      await expect(publisher.publish(sampleEvent)).rejects.toBe(unknownError);
      expect(mockLogger.error).toHaveBeenCalledWith('Failed to publish event:', {
        eventType: 'OrderCreated',
        eventId: expect.any(String),
        error: 'Unknown error'
      });
    });

    it('should generate correct routing key for different event types', async () => {
      // Arrange
      await publisher.initialize();
      const cancelledEvent = new OrderCancelledEvent(sampleOrder, 'Customer request');

      // Act
      await publisher.publish(cancelledEvent);

      // Assert
      expect(mockChannel.publish).toHaveBeenCalledWith(
        'order.events',
        'order.order.cancelled',
        expect.any(Buffer),
        { persistent: true }
      );
    });

    it('should generate routing key for complex event types', async () => {
      // Arrange
      await publisher.initialize();
      const completedEvent = new OrderCompletedEvent(sampleOrder);

      // Act
      await publisher.publish(completedEvent);

      // Assert
      expect(mockChannel.publish).toHaveBeenCalledWith(
        'order.events',
        'order.order.completed',
        expect.any(Buffer),
        { persistent: true }
      );
    });
  });

  describe('disconnect', () => {
    it('should disconnect successfully when both channel and connection exist', async () => {
      // Arrange
      await publisher.initialize();

      // Act
      await publisher.disconnect();

      // Assert
      expect(mockChannel.close).toHaveBeenCalled();
      expect(mockConnection.close).toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith('RabbitMQ Order Event Publisher disconnected');
    });

    it('should disconnect successfully when only connection exists', async () => {
      // Arrange
      await publisher.initialize();
      // Simulate channel being null
      (publisher as any).channel = null;

      // Act
      await publisher.disconnect();

      // Assert
      expect(mockChannel.close).not.toHaveBeenCalled();
      expect(mockConnection.close).toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith('RabbitMQ Order Event Publisher disconnected');
    });

    it('should handle disconnect when nothing is connected', async () => {
      // Act - disconnect without initializing
      await publisher.disconnect();

      // Assert
      expect(mockChannel.close).not.toHaveBeenCalled();
      expect(mockConnection.close).not.toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith('RabbitMQ Order Event Publisher disconnected');
    });

    it('should throw error when channel close fails', async () => {
      // Arrange
      await publisher.initialize();
      const closeError = new Error('Channel close failed');
      mockChannel.close.mockRejectedValue(closeError);

      // Act & Assert
      await expect(publisher.disconnect()).rejects.toThrow('Channel close failed');
      expect(mockLogger.error).toHaveBeenCalledWith('Error disconnecting RabbitMQ Order Event Publisher:', closeError);
    });

    it('should throw error when connection close fails', async () => {
      // Arrange
      await publisher.initialize();
      const connectionCloseError = new Error('Connection close failed');
      mockConnection.close.mockRejectedValue(connectionCloseError);

      // Act & Assert
      await expect(publisher.disconnect()).rejects.toThrow('Connection close failed');
      expect(mockLogger.error).toHaveBeenCalledWith('Error disconnecting RabbitMQ Order Event Publisher:', connectionCloseError);
    });
  });

  describe('getRoutingKey (private method testing)', () => {
    it('should generate correct routing keys for different event types', async () => {
      // Arrange
      await publisher.initialize();
      
      const createdEvent = new OrderCreatedEvent(sampleOrder);
      const cancelledEvent = new OrderCancelledEvent(sampleOrder, 'Test cancellation');
      const completedEvent = new OrderCompletedEvent(sampleOrder);

      // Act & Assert for OrderCreated
      await publisher.publish(createdEvent);
      expect(mockChannel.publish).toHaveBeenCalledWith(
        'order.events',
        'order.order.created',
        expect.any(Buffer),
        { persistent: true }
      );

      mockChannel.publish.mockClear();

      // Act & Assert for OrderCancelled
      await publisher.publish(cancelledEvent);
      expect(mockChannel.publish).toHaveBeenCalledWith(
        'order.events',
        'order.order.cancelled',
        expect.any(Buffer),
        { persistent: true }
      );

      mockChannel.publish.mockClear();

      // Act & Assert for OrderCompleted
      await publisher.publish(completedEvent);
      expect(mockChannel.publish).toHaveBeenCalledWith(
        'order.events',
        'order.order.completed',
        expect.any(Buffer),
        { persistent: true }
      );
    });
  });
}); 