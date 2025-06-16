import { CreateOrderUseCase } from '../CreateOrderUseCase';
import { CreateOrderDTO } from '../CreateOrderDTO';
import { IOrderRepository } from '@order/domain/repositories/IOrderRepository';
import { IOrderEventPublisher } from '@order/domain/repositories/IOrderEventPublisher';
import { Logger } from '@shared/application/logging/logger';
import { Order } from '@order/domain/entities/Order';
import { OrderCreatedEvent } from '@order/domain/events/OrderCreatedEvent';
import { Money } from '@order/domain/value-objects/Money';
import { Address } from '@order/domain/value-objects/Address';
import { OrderItem } from '@order/domain/value-objects/OrderItem';

describe('CreateOrderUseCase', () => {
  let useCase: CreateOrderUseCase;
  let mockOrderRepository: jest.Mocked<IOrderRepository>;
  let mockOrderEventPublisher: jest.Mocked<IOrderEventPublisher>;
  let mockLogger: jest.Mocked<Logger>;

  const validCreateOrderDTO: CreateOrderDTO = {
    id: 'order-123',
    customerId: 'customer-456',
    total: 299.99,
    items: [
      {
        productId: 'product-1',
        quantity: 2,
        unitPrice: 149.995,
        totalPrice: 299.99
      }
    ],
    shippingAddress: {
      street: 'Rua das Flores',
      number: '123',
      complement: 'Apto 45',
      neighborhood: 'Centro',
      city: 'São Paulo',
      state: 'SP',
      country: 'Brasil',
      zipCode: '01234-567'
    },
    billingAddress: {
      street: 'Rua das Flores',
      number: '123',
      complement: 'Apto 45',
      neighborhood: 'Centro',
      city: 'São Paulo',
      state: 'SP',
      country: 'Brasil',
      zipCode: '01234-567'
    }
  };

  beforeEach(() => {
    mockOrderRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findByCustomerId: jest.fn(),
      update: jest.fn(),
      delete: jest.fn()
    };

    mockOrderEventPublisher = {
      publish: jest.fn()
    };

    mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn()
    };

    useCase = new CreateOrderUseCase(
      mockOrderRepository,
      mockOrderEventPublisher,
      mockLogger
    );
  });

  describe('execute', () => {
    it('should create order successfully', async () => {
      // Arrange
      mockOrderRepository.save.mockResolvedValue();
      mockOrderEventPublisher.publish.mockResolvedValue();

      // Act
      const result = await useCase.execute(validCreateOrderDTO);

      // Assert
      expect(result).toEqual({
        id: 'order-123',
        customerId: 'customer-456',
        status: 'pending',
        total: 299.99,
        items: [
          {
            productId: 'product-1',
            quantity: 2,
            unitPrice: 149.995,
            totalPrice: 299.99
          }
        ],
        shippingAddress: {
          street: 'Rua das Flores',
          number: '123',
          complement: 'Apto 45',
          neighborhood: 'Centro',
          city: 'São Paulo',
          state: 'SP',
          country: 'Brasil',
          zipCode: '01234-567'
        },
        billingAddress: {
          street: 'Rua das Flores',
          number: '123',
          complement: 'Apto 45',
          neighborhood: 'Centro',
          city: 'São Paulo',
          state: 'SP',
          country: 'Brasil',
          zipCode: '01234-567'
        }
      });

      expect(mockOrderRepository.save).toHaveBeenCalledTimes(1);
      expect(mockOrderEventPublisher.publish).toHaveBeenCalledTimes(1);
      expect(mockLogger.info).toHaveBeenCalledWith('Creating new order', { customerId: 'customer-456' });
      expect(mockLogger.info).toHaveBeenCalledWith('Order created successfully', { orderId: 'order-123' });
    });

    it('should handle repository save error', async () => {
      // Arrange
      const saveError = new Error('Database connection failed');
      mockOrderRepository.save.mockRejectedValue(saveError);

      // Act & Assert
      await expect(useCase.execute(validCreateOrderDTO)).rejects.toThrow('Database connection failed');
      expect(mockLogger.error).toHaveBeenCalledWith('Error creating order', { 
        error: saveError, 
        dto: validCreateOrderDTO 
      });
    });

    it('should handle event publisher error', async () => {
      // Arrange
      mockOrderRepository.save.mockResolvedValue();
      const publishError = new Error('Event publishing failed');
      mockOrderEventPublisher.publish.mockRejectedValue(publishError);

      // Act & Assert
      await expect(useCase.execute(validCreateOrderDTO)).rejects.toThrow('Event publishing failed');
      expect(mockLogger.error).toHaveBeenCalledWith('Error creating order', { 
        error: publishError, 
        dto: validCreateOrderDTO 
      });
    });

    it('should create value objects correctly', async () => {
      // Arrange
      mockOrderRepository.save.mockResolvedValue();
      mockOrderEventPublisher.publish.mockResolvedValue();

      // Act
      await useCase.execute(validCreateOrderDTO);

      // Assert
      expect(mockOrderRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'order-123',
          customerId: 'customer-456',
          status: 'pending',
          total: expect.any(Money),
          items: expect.arrayContaining([expect.any(OrderItem)]),
          shippingAddress: expect.any(Address),
          billingAddress: expect.any(Address)
        })
      );
    });

    it('should publish all order events', async () => {
      // Arrange
      mockOrderRepository.save.mockResolvedValue();
      mockOrderEventPublisher.publish.mockResolvedValue();

      // Act
      await useCase.execute(validCreateOrderDTO);

      // Assert
      expect(mockOrderEventPublisher.publish).toHaveBeenCalledWith(
        expect.any(OrderCreatedEvent)
      );
    });
  });
}); 