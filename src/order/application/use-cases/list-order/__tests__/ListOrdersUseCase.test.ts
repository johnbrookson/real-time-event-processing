import { ListOrdersUseCase } from '../ListOrdersUseCase';
import { ListOrdersDTO } from '../ListOrdersDTO';
import { IOrderRepository } from '@order/domain/repositories/IOrderRepository';
import { Logger } from '@shared/application/logging/logger';
import { Order } from '@order/domain/entities/Order';
import { Money } from '@order/domain/value-objects/Money';
import { Address } from '@order/domain/value-objects/Address';
import { OrderItem } from '@order/domain/value-objects/OrderItem';

describe('ListOrdersUseCase', () => {
  let useCase: ListOrdersUseCase;
  let mockOrderRepository: jest.Mocked<IOrderRepository>;
  let mockLogger: jest.Mocked<Logger>;

  const listOrdersDTO: ListOrdersDTO = {
    customerId: 'customer-456'
  };

  const createMockOrders = () => [
    new Order({
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
    }),
    new Order({
      id: 'order-456',
      customerId: 'customer-456',
      status: 'completed',
      total: new Money(599.98),
      items: [
        new OrderItem({
          productId: 'product-2',
          quantity: 1,
          unitPrice: new Money(599.98),
          totalPrice: new Money(599.98)
        })
      ],
      shippingAddress: new Address({
        street: 'Av. Paulista',
        number: '1000',
        neighborhood: 'Bela Vista',
        city: 'São Paulo',
        state: 'SP',
        country: 'Brasil',
        zipCode: '01310-100'
      }),
      billingAddress: new Address({
        street: 'Av. Paulista',
        number: '1000',
        neighborhood: 'Bela Vista',
        city: 'São Paulo',
        state: 'SP',
        country: 'Brasil',
        zipCode: '01310-100'
      })
    })
  ];

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

    useCase = new ListOrdersUseCase(
      mockOrderRepository,
      mockLogger
    );
  });

  describe('execute', () => {
    it('should list orders successfully', async () => {
      // Arrange
      const mockOrders = createMockOrders();
      mockOrderRepository.findByCustomerId.mockResolvedValue(mockOrders);

      // Act
      const result = await useCase.execute(listOrdersDTO);

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
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

      expect(mockOrderRepository.findByCustomerId).toHaveBeenCalledWith('customer-456');
      expect(mockLogger.info).toHaveBeenCalledWith('Listing orders', { customerId: 'customer-456' });
      expect(mockLogger.info).toHaveBeenCalledWith('Orders found', { count: 2 });
    });

    it('should return empty array when no orders found', async () => {
      // Arrange
      mockOrderRepository.findByCustomerId.mockResolvedValue([]);

      // Act
      const result = await useCase.execute(listOrdersDTO);

      // Assert
      expect(result).toEqual([]);
      expect(mockOrderRepository.findByCustomerId).toHaveBeenCalledWith('customer-456');
      expect(mockLogger.info).toHaveBeenCalledWith('Listing orders', { customerId: 'customer-456' });
      expect(mockLogger.info).toHaveBeenCalledWith('Orders found', { count: 0 });
    });

    it('should handle repository error', async () => {
      // Arrange
      const repositoryError = new Error('Database connection failed');
      mockOrderRepository.findByCustomerId.mockRejectedValue(repositoryError);

      // Act & Assert
      await expect(useCase.execute(listOrdersDTO)).rejects.toThrow('Database connection failed');
      expect(mockLogger.error).toHaveBeenCalledWith('Error listing orders', { 
        error: repositoryError, 
        dto: listOrdersDTO 
      });
    });
  });
}); 