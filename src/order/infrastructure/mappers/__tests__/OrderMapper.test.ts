import { OrderMapper } from '../OrderMapper';
import { Order } from '../../../domain/entities/Order';
import { OrderModel } from '../../persistence/OrderModel';
import { Money } from '../../../domain/value-objects/Money';
import { Address } from '../../../domain/value-objects/Address';
import { OrderItem } from '../../../domain/value-objects/OrderItem';

describe('OrderMapper', () => {
  let mapper: OrderMapper;
  let sampleOrderModel: OrderModel;
  let sampleOrder: Order;

  beforeEach(() => {
    mapper = new OrderMapper();

    // Sample OrderModel for testing toDomain
    sampleOrderModel = {
      id: 'order-123',
      customerId: 'customer-456',
      status: 'pending' as const,
      total: 199.99,
      items: [
        {
          productId: 'product-1',
          quantity: 2,
          unitPrice: 49.99,
          totalPrice: 99.98
        },
        {
          productId: 'product-2',
          quantity: 1,
          unitPrice: 100.01,
          totalPrice: 100.01
        }
      ],
      shippingAddress: {
        street: 'Main Street',
        number: '123',
        complement: 'Suite 100',
        neighborhood: 'Downtown',
        city: 'New York',
        state: 'NY',
        zipCode: '10001',
        country: 'USA'
      },
      billingAddress: {
        street: 'Billing Avenue',
        number: '456',
        complement: 'Apt 200',
        neighborhood: 'Uptown',
        city: 'New York',
        state: 'NY',
        zipCode: '10002',
        country: 'USA'
      },
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date('2023-01-02')
    };

    // Sample Order entity for testing toPersistence
    const shippingAddress = new Address({
      street: 'Main Street',
      number: '123',
      complement: 'Suite 100',
      neighborhood: 'Downtown',
      city: 'New York',
      state: 'NY',
      zipCode: '10001',
      country: 'USA'
    });

    const billingAddress = new Address({
      street: 'Billing Avenue',
      number: '456',  
      complement: 'Apt 200',
      neighborhood: 'Uptown',
      city: 'New York',
      state: 'NY',
      zipCode: '10002',
      country: 'USA'
    });

    const orderItems = [
      new OrderItem({
        productId: 'product-1',
        quantity: 2,
        unitPrice: new Money(49.99),
        totalPrice: new Money(99.98)
      }),
      new OrderItem({
        productId: 'product-2',
        quantity: 1,
        unitPrice: new Money(100.01),
        totalPrice: new Money(100.01)
      })
    ];

    sampleOrder = new Order({
      id: 'order-123',
      customerId: 'customer-456',
      status: 'pending',
      total: new Money(199.99),
      items: orderItems,
      shippingAddress,
      billingAddress
    });
  });

  describe('toDomain', () => {
    it('should map OrderModel to Order domain entity correctly', () => {
      // Act
      const result = mapper.toDomain(sampleOrderModel);

      // Assert
      expect(result).toBeInstanceOf(Order);
      expect(result.id).toBe('order-123');
      expect(result.customerId).toBe('customer-456');
      expect(result.status).toBe('pending');
      expect(result.total).toBeInstanceOf(Money);
      expect(result.total.getValue()).toBe(199.99);
    });

    it('should correctly map order items from model to domain', () => {
      // Act
      const result = mapper.toDomain(sampleOrderModel);

      // Assert
      expect(result.items).toHaveLength(2);
      expect(result.items[0]!).toBeInstanceOf(OrderItem);
      expect(result.items[0]!.productId).toBe('product-1');
      expect(result.items[0]!.quantity).toBe(2);
      expect(result.items[0]!.unitPrice.getValue()).toBe(49.99);
      expect(result.items[0]!.totalPrice.getValue()).toBe(99.98);
      
      expect(result.items[1]!).toBeInstanceOf(OrderItem);
      expect(result.items[1]!.productId).toBe('product-2');
      expect(result.items[1]!.quantity).toBe(1);
      expect(result.items[1]!.unitPrice.getValue()).toBe(100.01);
      expect(result.items[1]!.totalPrice.getValue()).toBe(100.01);
    });

    it('should correctly map addresses from model to domain', () => {
      // Act
      const result = mapper.toDomain(sampleOrderModel);

      // Assert - Shipping Address
      expect(result.shippingAddress).toBeInstanceOf(Address);
      expect(result.shippingAddress.street).toBe('Main Street');
      expect(result.shippingAddress.number).toBe('123');
      expect(result.shippingAddress.complement).toBe('Suite 100');
      expect(result.shippingAddress.neighborhood).toBe('Downtown');
      expect(result.shippingAddress.city).toBe('New York');
      expect(result.shippingAddress.state).toBe('NY');
      expect(result.shippingAddress.zipCode).toBe('10001');
      expect(result.shippingAddress.country).toBe('USA');

      // Assert - Billing Address
      expect(result.billingAddress).toBeInstanceOf(Address);
      expect(result.billingAddress.street).toBe('Billing Avenue');
      expect(result.billingAddress.number).toBe('456');
      expect(result.billingAddress.complement).toBe('Apt 200');
      expect(result.billingAddress.neighborhood).toBe('Uptown');
      expect(result.billingAddress.city).toBe('New York');
      expect(result.billingAddress.state).toBe('NY');
      expect(result.billingAddress.zipCode).toBe('10002');
      expect(result.billingAddress.country).toBe('USA');
    });

    it('should handle different order statuses correctly', () => {
      // Test completed status
      const completedOrderModel = { ...sampleOrderModel, status: 'completed' as const };
      const completedResult = mapper.toDomain(completedOrderModel);
      expect(completedResult.status).toBe('completed');

      // Test cancelled status
      const cancelledOrderModel = { ...sampleOrderModel, status: 'cancelled' as const };
      const cancelledResult = mapper.toDomain(cancelledOrderModel);
      expect(cancelledResult.status).toBe('cancelled');
    });

    it('should handle addresses without complement', () => {
      // Arrange
      const modelWithoutComplement = {
        ...sampleOrderModel,
        shippingAddress: {
          ...sampleOrderModel.shippingAddress,
          complement: undefined
        },
        billingAddress: {
          ...sampleOrderModel.billingAddress,
          complement: undefined
        }
      };

      // Act
      const result = mapper.toDomain(modelWithoutComplement);

      // Assert
      expect(result.shippingAddress.complement).toBeUndefined();
      expect(result.billingAddress.complement).toBeUndefined();
    });

    it('should handle empty items array', () => {
      // Arrange
      const modelWithNoItems = { ...sampleOrderModel, items: [] };

      // Act
      const result = mapper.toDomain(modelWithNoItems);

      // Assert
      expect(result.items).toHaveLength(0);
    });
  });

  describe('toPersistence', () => {
    it('should map Order domain entity to OrderModel correctly', () => {
      // Act
      const result = mapper.toPersistence(sampleOrder);

      // Assert
      expect(result.id).toBe('order-123');
      expect(result.customerId).toBe('customer-456');
      expect(result.status).toBe('pending');
      expect(result.total).toBe(199.99);
    });

    it('should correctly map order items from domain to persistence', () => {
      // Act
      const result = mapper.toPersistence(sampleOrder);

      // Assert
      expect(result.items).toHaveLength(2);
      expect(result.items![0]!.productId).toBe('product-1');
      expect(result.items![0]!.quantity).toBe(2);
      expect(result.items![0]!.unitPrice).toBe(49.99);
      expect(result.items![0]!.totalPrice).toBe(99.98);
      
      expect(result.items![1]!.productId).toBe('product-2');
      expect(result.items![1]!.quantity).toBe(1);
      expect(result.items![1]!.unitPrice).toBe(100.01);
      expect(result.items![1]!.totalPrice).toBe(100.01);
    });

    it('should correctly map addresses from domain to persistence', () => {
      // Act
      const result = mapper.toPersistence(sampleOrder);

      // Assert - Shipping Address
      expect(result.shippingAddress!.street).toBe('Main Street');
      expect(result.shippingAddress!.number).toBe('123');
      expect(result.shippingAddress!.complement).toBe('Suite 100');
      expect(result.shippingAddress!.neighborhood).toBe('Downtown');
      expect(result.shippingAddress!.city).toBe('New York');
      expect(result.shippingAddress!.state).toBe('NY');
      expect(result.shippingAddress!.zipCode).toBe('10001');
      expect(result.shippingAddress!.country).toBe('USA');

      // Assert - Billing Address
      expect(result.billingAddress!.street).toBe('Billing Avenue');
      expect(result.billingAddress!.number).toBe('456');
      expect(result.billingAddress!.complement).toBe('Apt 200');
      expect(result.billingAddress!.neighborhood).toBe('Uptown');
      expect(result.billingAddress!.city).toBe('New York');
      expect(result.billingAddress!.state).toBe('NY');
      expect(result.billingAddress!.zipCode).toBe('10002');
      expect(result.billingAddress!.country).toBe('USA');
    });

    it('should handle addresses without complement in persistence mapping', () => {
      // Arrange
      const addressWithoutComplement = new Address({
        street: 'Simple Street',
        number: '789',
        neighborhood: 'Center',
        city: 'Boston',
        state: 'MA',
        zipCode: '02101',
        country: 'USA'
      });

      const orderWithoutComplement = new Order({
        id: sampleOrder.id,
        customerId: sampleOrder.customerId,
        status: sampleOrder.status,
        total: sampleOrder.total,
        items: sampleOrder.items,
        shippingAddress: addressWithoutComplement,
        billingAddress: addressWithoutComplement
      });

      // Act
      const result = mapper.toPersistence(orderWithoutComplement);

      // Assert
      expect(result.shippingAddress!.complement).toBeUndefined();
      expect(result.billingAddress!.complement).toBeUndefined();
    });

    it('should handle orders with empty items array', () => {
      // Arrange
      const orderWithNoItems = new Order({
        id: sampleOrder.id,
        customerId: sampleOrder.customerId,
        status: sampleOrder.status,
        total: sampleOrder.total,
        items: [],
        shippingAddress: sampleOrder.shippingAddress,
        billingAddress: sampleOrder.billingAddress
      });

      // Act
      const result = mapper.toPersistence(orderWithNoItems);

      // Assert
      expect(result.items).toHaveLength(0);
    });
  });
}); 