import { GetOrderUseCase } from '../GetOrderUseCase';
import { GetOrderDTO } from '../GetOrderDTO';
import { IOrderRepository } from '@order/domain/repositories/IOrderRepository';
import { Logger } from '@shared/application/logging/logger';
import { Order } from '@order/domain/entities/Order';
import { Money } from '@order/domain/value-objects/Money';
import { Address } from '@order/domain/value-objects/Address';
import { OrderItem } from '@order/domain/value-objects/OrderItem';

describe('GetOrderUseCase', () => {
  let useCase: GetOrderUseCase;
  let mockOrderRepository: jest.Mocked<IOrderRepository>;
  let mockLogger: jest.Mocked<Logger>;

  const getOrderDTO: GetOrderDTO = {
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

    mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn()
    };

    useCase = new GetOrderUseCase(
      mockOrderRepository,
      mockLogger
    );
  });

  describe('execute', () => {
    it('should get order successfully', async () => {
      // Arrange
      const mockOrder = createMockOrder();
      mockOrderRepository.findById.mockResolvedValue(mockOrder);

      // Act
      const result = await useCase.execute(getOrderDTO);

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
          complement: undefined,
          neighborhood: 'Centro',
          city: 'São Paulo',
          state: 'SP',
          country: 'Brasil',
          zipCode: '01234-567'
        },
        billingAddress: {
          street: 'Rua das Flores',
          number: '123',
          complement: undefined,
          neighborhood: 'Centro',
          city: 'São Paulo',
          state: 'SP',
          country: 'Brasil',
          zipCode: '01234-567'
        }
      });

      expect(mockOrderRepository.findById).toHaveBeenCalledWith('order-123');
      expect(mockLogger.info).toHaveBeenCalledWith('Getting order', { orderId: 'order-123' });
      expect(mockLogger.info).toHaveBeenCalledWith('Order found', { orderId: 'order-123' });
    });

    it('should return null when order not found', async () => {
      // Arrange
      mockOrderRepository.findById.mockResolvedValue(null);

      // Act
      const result = await useCase.execute(getOrderDTO);

      // Assert
      expect(result).toBeNull();
      expect(mockOrderRepository.findById).toHaveBeenCalledWith('order-123');
      expect(mockLogger.info).toHaveBeenCalledWith('Getting order', { orderId: 'order-123' });
      expect(mockLogger.info).not.toHaveBeenCalledWith('Order found', expect.any(Object));
    });

    it('should handle repository error', async () => {
      // Arrange
      const repositoryError = new Error('Database connection failed');
      mockOrderRepository.findById.mockRejectedValue(repositoryError);

      // Act & Assert
      await expect(useCase.execute(getOrderDTO)).rejects.toThrow('Database connection failed');
      expect(mockLogger.error).toHaveBeenCalledWith('Error getting order', { 
        error: repositoryError, 
        dto: getOrderDTO 
      });
    });
  });
}); 