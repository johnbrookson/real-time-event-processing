import { CompleteOrderUseCase } from '../CompleteOrderUseCase';
import { CompleteOrderDTO } from '../CompleteOrderDTO';
import { IOrderRepository } from '@order/domain/repositories/IOrderRepository';
import { IOrderEventPublisher } from '@order/domain/repositories/IOrderEventPublisher';
import { Logger } from '@shared/application/logging/logger';
import { Order } from '@order/domain/entities/Order';
import { Money } from '@order/domain/value-objects/Money';
import { Address } from '@order/domain/value-objects/Address';
import { OrderItem } from '@order/domain/value-objects/OrderItem';
import { OrderCompletedEvent } from '@order/domain/events/OrderCompletedEvent';

describe('CompleteOrderUseCase', () => {
  let useCase: CompleteOrderUseCase;
  let mockOrderRepository: jest.Mocked<IOrderRepository>;
  let mockOrderEventPublisher: jest.Mocked<IOrderEventPublisher>;
  let mockLogger: jest.Mocked<Logger>;

  const completeOrderDTO: CompleteOrderDTO = {
    orderId: 'order-123'
  };

  const createMockOrder = () => new Order({
    id: 'order-123',
    customerId: 'customer-456',
    status: 'pending',
    total: new Money(299.99),
    items: [
      new OrderItem({
        productId: 'product-1',
        quantity: 2,
        unitPrice: new Money(149.995),
        totalPrice: new Money(299.99)
      })
    ],
    shippingAddress: new Address({
      street: 'Rua das Flores',
      number: '123',
      neighborhood: 'Centro',
      city: 'São Paulo',
      state: 'SP',
      country: 'Brasil',
      zipCode: '01234-567'
    }),
    billingAddress: new Address({
      street: 'Rua das Flores',
      number: '123',
      neighborhood: 'Centro',
      city: 'São Paulo',
      state: 'SP',
      country: 'Brasil',
      zipCode: '01234-567'
    })
  });

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

    useCase = new CompleteOrderUseCase(
      mockOrderRepository,
      mockOrderEventPublisher,
      mockLogger
    );
  });

  describe('execute', () => {
    it('should complete order successfully', async () => {
      // Arrange
      const mockOrder = createMockOrder();
      mockOrderRepository.findById.mockResolvedValue(mockOrder);
      mockOrderRepository.update.mockResolvedValue();
      mockOrderEventPublisher.publish.mockResolvedValue();

      // Act
      const result = await useCase.execute(completeOrderDTO);

      // Assert
      expect(result.status).toBe('completed');
      expect(mockOrderRepository.findById).toHaveBeenCalledWith('order-123');
      expect(mockOrderRepository.update).toHaveBeenCalledTimes(1);
      expect(mockOrderEventPublisher.publish).toHaveBeenCalledTimes(1);
      expect(mockLogger.info).toHaveBeenCalledWith('Completing order', { orderId: 'order-123' });
      expect(mockLogger.info).toHaveBeenCalledWith('Order completed successfully', { orderId: 'order-123' });
    });

    it('should throw error when order not found', async () => {
      // Arrange
      mockOrderRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(useCase.execute(completeOrderDTO)).rejects.toThrow('Order not found: order-123');
      expect(mockLogger.error).toHaveBeenCalledWith('Error completing order', { 
        error: expect.any(Error), 
        dto: completeOrderDTO 
      });
    });

    it('should handle repository update error', async () => {
      // Arrange
      const mockOrder = createMockOrder();
      mockOrderRepository.findById.mockResolvedValue(mockOrder);
      const updateError = new Error('Database update failed');
      mockOrderRepository.update.mockRejectedValue(updateError);

      // Act & Assert
      await expect(useCase.execute(completeOrderDTO)).rejects.toThrow('Database update failed');
      expect(mockLogger.error).toHaveBeenCalledWith('Error completing order', { 
        error: updateError, 
        dto: completeOrderDTO 
      });
    });

    it('should handle event publisher error', async () => {
      // Arrange
      const mockOrder = createMockOrder();
      mockOrderRepository.findById.mockResolvedValue(mockOrder);
      mockOrderRepository.update.mockResolvedValue();
      const publishError = new Error('Event publishing failed');
      mockOrderEventPublisher.publish.mockRejectedValue(publishError);

      // Act & Assert
      await expect(useCase.execute(completeOrderDTO)).rejects.toThrow('Event publishing failed');
      expect(mockLogger.error).toHaveBeenCalledWith('Error completing order', { 
        error: publishError, 
        dto: completeOrderDTO 
      });
    });

    it('should publish order completed event', async () => {
      // Arrange
      const mockOrder = createMockOrder();
      mockOrderRepository.findById.mockResolvedValue(mockOrder);
      mockOrderRepository.update.mockResolvedValue();
      mockOrderEventPublisher.publish.mockResolvedValue();

      // Act
      await useCase.execute(completeOrderDTO);

      // Assert
      expect(mockOrderEventPublisher.publish).toHaveBeenCalledWith(
        expect.any(OrderCompletedEvent)
      );
    });
  });
}); 