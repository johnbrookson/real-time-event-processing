import { PostgresOrderRepository } from '../PostgresOrderRepository';
import { IOrderMapper } from '../../mappers/IOrderMapper';
import { OrderModel } from '../OrderModel';
import { Order } from '../../../domain/entities/Order';
import { Address } from '../../../domain/value-objects/Address';
import { Money } from '../../../domain/value-objects/Money';
import { OrderItem } from '../../../domain/value-objects/OrderItem';

// Mock OrderModel
jest.mock('../OrderModel');
const mockOrderModel = OrderModel as jest.Mocked<typeof OrderModel>;

describe('PostgresOrderRepository', () => {
  let repository: PostgresOrderRepository;
  let mockMapper: jest.Mocked<IOrderMapper>;
  let sampleOrder: Order;
  let sampleOrderModel: any;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Create mock mapper
    mockMapper = {
      toPersistence: jest.fn(),
      toDomain: jest.fn()
    };

    // Create repository instance
    repository = new PostgresOrderRepository(mockMapper);

    // Create sample Order domain entity
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
      id: 'order-123',
      customerId: 'customer-456',
      status: 'pending',
      items: [orderItem],
      total: new Money(100.00),
      shippingAddress,
      billingAddress
    });

    // Sample order model data
    sampleOrderModel = {
      id: 'order-123',
      customerId: 'customer-456',
      status: 'pending',
      total: 100.00,
      items: [{
        productId: 'product-123',
        quantity: 2,
        unitPrice: 50.00,
        totalPrice: 100.00
      }],
      shippingAddress: {
        street: 'Main St',
        number: '123',
        complement: 'Suite 100',
        neighborhood: 'Downtown',
        city: 'New York',
        state: 'NY',
        zipCode: '10001',
        country: 'USA'
      },
      billingAddress: {
        street: 'Billing St',
        number: '456',
        complement: 'Apt 200',
        neighborhood: 'Uptown',
        city: 'New York',
        state: 'NY',
        zipCode: '10002',
        country: 'USA'
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };
  });

  describe('save', () => {
    it('should save order successfully', async () => {
      // Arrange
      const persistenceData = { ...sampleOrderModel };
      mockMapper.toPersistence.mockReturnValue(persistenceData);
      mockOrderModel.create.mockResolvedValue(persistenceData);

      // Act
      await repository.save(sampleOrder);

      // Assert
      expect(mockMapper.toPersistence).toHaveBeenCalledWith(sampleOrder);
      expect(mockOrderModel.create).toHaveBeenCalledWith(persistenceData);
    });

    it('should throw error when mapper fails', async () => {
      // Arrange
      const error = new Error('Mapper error');
      mockMapper.toPersistence.mockImplementation(() => {
        throw error;
      });

      // Act & Assert
      await expect(repository.save(sampleOrder)).rejects.toThrow('Failed to save order: Mapper error');
    });

    it('should throw error when database create fails', async () => {
      // Arrange
      const persistenceData = { ...sampleOrderModel };
      mockMapper.toPersistence.mockReturnValue(persistenceData);
      const dbError = new Error('Database connection failed');
      mockOrderModel.create.mockRejectedValue(dbError);

      // Act & Assert
      await expect(repository.save(sampleOrder)).rejects.toThrow('Failed to save order: Database connection failed');
    });

    it('should handle unknown error types', async () => {
      // Arrange
      const persistenceData = { ...sampleOrderModel };
      mockMapper.toPersistence.mockReturnValue(persistenceData);
      mockOrderModel.create.mockRejectedValue('Unknown error string');

      // Act & Assert
      await expect(repository.save(sampleOrder)).rejects.toThrow('Failed to save order: Unknown error');
    });
  });

  describe('findById', () => {
    it('should find order by id successfully', async () => {
      // Arrange
      mockOrderModel.findByPk.mockResolvedValue(sampleOrderModel);
      mockMapper.toDomain.mockReturnValue(sampleOrder);

      // Act
      const result = await repository.findById('order-123');

      // Assert
      expect(result).toBe(sampleOrder);
      expect(mockOrderModel.findByPk).toHaveBeenCalledWith('order-123');
      expect(mockMapper.toDomain).toHaveBeenCalledWith(sampleOrderModel);
    });

    it('should return null when order not found', async () => {
      // Arrange
      mockOrderModel.findByPk.mockResolvedValue(null);

      // Act
      const result = await repository.findById('non-existent-id');

      // Assert
      expect(result).toBeNull();
      expect(mockOrderModel.findByPk).toHaveBeenCalledWith('non-existent-id');
      expect(mockMapper.toDomain).not.toHaveBeenCalled();
    });

    it('should throw error when database query fails', async () => {
      // Arrange
      const dbError = new Error('Database query failed');
      mockOrderModel.findByPk.mockRejectedValue(dbError);

      // Act & Assert
      await expect(repository.findById('order-123')).rejects.toThrow('Failed to find order: Database query failed');
    });

    it('should throw error when mapper fails', async () => {
      // Arrange
      mockOrderModel.findByPk.mockResolvedValue(sampleOrderModel);
      const mapperError = new Error('Mapper error');
      mockMapper.toDomain.mockImplementation(() => {
        throw mapperError;
      });

      // Act & Assert
      await expect(repository.findById('order-123')).rejects.toThrow('Failed to find order: Mapper error');
    });
  });

  describe('findByCustomerId', () => {
    it('should find orders by customer id successfully', async () => {
      // Arrange
      const secondOrderModel = { ...sampleOrderModel, id: 'order-456' };
      const orderModels = [sampleOrderModel, secondOrderModel];
      
      const secondOrder = new Order({
        id: 'order-456',
        customerId: 'customer-456',
        status: 'pending',
        items: sampleOrder.items,
        total: sampleOrder.total,
        shippingAddress: sampleOrder.shippingAddress,
        billingAddress: sampleOrder.billingAddress
      });
      const orders: Order[] = [sampleOrder, secondOrder];
      
      mockOrderModel.findAll.mockResolvedValue(orderModels);
      mockMapper.toDomain
        .mockReturnValueOnce(sampleOrder)
        .mockReturnValueOnce(secondOrder);

      // Act
      const result = await repository.findByCustomerId('customer-456');

      // Assert
      expect(result).toEqual(orders);
      expect(mockOrderModel.findAll).toHaveBeenCalledWith({
        where: { customerId: 'customer-456' }
      });
      expect(mockMapper.toDomain).toHaveBeenCalledTimes(2);
    });

    it('should return empty array when no orders found', async () => {
      // Arrange
      mockOrderModel.findAll.mockResolvedValue([]);

      // Act
      const result = await repository.findByCustomerId('customer-456');

      // Assert
      expect(result).toEqual([]);
      expect(mockOrderModel.findAll).toHaveBeenCalledWith({
        where: { customerId: 'customer-456' }
      });
      expect(mockMapper.toDomain).not.toHaveBeenCalled();
    });

    it('should throw error when database query fails', async () => {
      // Arrange
      const dbError = new Error('Database query failed');
      mockOrderModel.findAll.mockRejectedValue(dbError);

      // Act & Assert
      await expect(repository.findByCustomerId('customer-456')).rejects.toThrow('Failed to find orders by customer ID: Database query failed');
    });

    it('should throw error when mapper fails for one of the orders', async () => {
      // Arrange
      const orderModels = [sampleOrderModel];
      mockOrderModel.findAll.mockResolvedValue(orderModels);
      const mapperError = new Error('Mapper error');
      mockMapper.toDomain.mockImplementation(() => {
        throw mapperError;
      });

      // Act & Assert
      await expect(repository.findByCustomerId('customer-456')).rejects.toThrow('Failed to find orders by customer ID: Mapper error');
    });
  });

  describe('update', () => {
    it('should update order successfully', async () => {
      // Arrange
      const persistenceData = { ...sampleOrderModel };
      mockMapper.toPersistence.mockReturnValue(persistenceData);
      mockOrderModel.update.mockResolvedValue();

      // Act
      await repository.update(sampleOrder);

      // Assert
      expect(mockMapper.toPersistence).toHaveBeenCalledWith(sampleOrder);
      expect(mockOrderModel.update).toHaveBeenCalledWith(persistenceData, {
        where: { id: sampleOrder.id }
      });
    });

    it('should throw error when mapper fails', async () => {
      // Arrange
      const error = new Error('Mapper error');
      mockMapper.toPersistence.mockImplementation(() => {
        throw error;
      });

      // Act & Assert
      await expect(repository.update(sampleOrder)).rejects.toThrow('Failed to update order: Mapper error');
    });

    it('should throw error when database update fails', async () => {
      // Arrange
      const persistenceData = { ...sampleOrderModel };
      mockMapper.toPersistence.mockReturnValue(persistenceData);
      const dbError = new Error('Database update failed');
      mockOrderModel.update.mockRejectedValue(dbError);

      // Act & Assert
      await expect(repository.update(sampleOrder)).rejects.toThrow('Failed to update order: Database update failed');
    });
  });

  describe('delete', () => {
    it('should delete order successfully', async () => {
      // Arrange
      mockOrderModel.destroy.mockResolvedValue();

      // Act
      await repository.delete('order-123');

      // Assert
      expect(mockOrderModel.destroy).toHaveBeenCalledWith({
        where: { id: 'order-123' }
      });
    });

    it('should throw error when database delete fails', async () => {
      // Arrange
      const dbError = new Error('Database delete failed');
      mockOrderModel.destroy.mockRejectedValue(dbError);

      // Act & Assert
      await expect(repository.delete('order-123')).rejects.toThrow('Failed to delete order: Database delete failed');
    });

    it('should handle unknown error types in delete', async () => {
      // Arrange
      mockOrderModel.destroy.mockRejectedValue('Unknown error string');

      // Act & Assert
      await expect(repository.delete('order-123')).rejects.toThrow('Failed to delete order: Unknown error');
    });
  });

  describe('error handling edge cases', () => {
    it('should handle null error in save', async () => {
      // Arrange
      const persistenceData = { ...sampleOrderModel };
      mockMapper.toPersistence.mockReturnValue(persistenceData);
      mockOrderModel.create.mockRejectedValue(null);

      // Act & Assert
      await expect(repository.save(sampleOrder)).rejects.toThrow('Failed to save order: Unknown error');
    });

    it('should handle undefined error in findById', async () => {
      // Arrange
      mockOrderModel.findByPk.mockRejectedValue(undefined);

      // Act & Assert
      await expect(repository.findById('order-123')).rejects.toThrow('Failed to find order: Unknown error');
    });

    it('should handle non-Error object in findByCustomerId', async () => {
      // Arrange
      mockOrderModel.findAll.mockRejectedValue({ message: 'Custom error object' });

      // Act & Assert
      await expect(repository.findByCustomerId('customer-456')).rejects.toThrow('Failed to find orders by customer ID: Unknown error');
    });

    it('should handle empty string error in update', async () => {
      // Arrange
      const persistenceData = { ...sampleOrderModel };
      mockMapper.toPersistence.mockReturnValue(persistenceData);
      mockOrderModel.update.mockRejectedValue('');

      // Act & Assert
      await expect(repository.update(sampleOrder)).rejects.toThrow('Failed to update order: Unknown error');
    });

    it('should handle number error in delete', async () => {
      // Arrange
      mockOrderModel.destroy.mockRejectedValue(404);

      // Act & Assert
      await expect(repository.delete('order-123')).rejects.toThrow('Failed to delete order: Unknown error');
    });
  });

  describe('additional success scenarios', () => {
    it('should handle mapper returning different data types', async () => {
      // Arrange
      const customPersistenceData = {
        ...sampleOrderModel,
        customField: 'custom value',
        total: 150.50
      };
      mockMapper.toPersistence.mockReturnValue(customPersistenceData);
      mockOrderModel.create.mockResolvedValue(customPersistenceData);

      // Act
      await repository.save(sampleOrder);

      // Assert
      expect(mockMapper.toPersistence).toHaveBeenCalledWith(sampleOrder);
      expect(mockOrderModel.create).toHaveBeenCalledWith(customPersistenceData);
    });

    it('should handle complex order data in update', async () => {
      // Arrange
      const complexOrder = new Order({
        id: sampleOrder.id,
        customerId: sampleOrder.customerId,
        status: 'completed' as const,
        items: sampleOrder.items,
        total: new Money(250.75),
        shippingAddress: sampleOrder.shippingAddress,
        billingAddress: sampleOrder.billingAddress
      });
      
      const complexPersistenceData = {
        ...sampleOrderModel,
        status: 'completed',
        total: 250.75
      };
      
      mockMapper.toPersistence.mockReturnValue(complexPersistenceData);
      mockOrderModel.update.mockResolvedValue(undefined); // Some databases return affected rows count

      // Act
      await repository.update(complexOrder);

      // Assert
      expect(mockMapper.toPersistence).toHaveBeenCalledWith(complexOrder);
      expect(mockOrderModel.update).toHaveBeenCalledWith(complexPersistenceData, {
        where: { id: complexOrder.id }
      });
    });

    it('should handle empty results in findByCustomerId gracefully', async () => {
      // Arrange
      mockOrderModel.findAll.mockResolvedValue([]);

      // Act
      const result = await repository.findByCustomerId('non-existent-customer');

      // Assert
      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
      expect(mockOrderModel.findAll).toHaveBeenCalledWith({
        where: { customerId: 'non-existent-customer' }
      });
    });

    it('should handle special characters in IDs', async () => {
      // Arrange
      const specialId = 'order-123-@#$%^&*()';
      mockOrderModel.findByPk.mockResolvedValue(null);

      // Act
      const result = await repository.findById(specialId);

      // Assert
      expect(result).toBeNull();
      expect(mockOrderModel.findByPk).toHaveBeenCalledWith(specialId);
    });

    it('should handle deletion of non-existent order', async () => {
      // Arrange
      mockOrderModel.destroy.mockResolvedValue(undefined); // No rows affected

      // Act
      await repository.delete('non-existent-order');

      // Assert
      expect(mockOrderModel.destroy).toHaveBeenCalledWith({
        where: { id: 'non-existent-order' }
      });
    });
  });
}); 