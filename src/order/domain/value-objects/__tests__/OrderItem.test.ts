import { OrderItem } from '../OrderItem';
import { Money } from '../Money';
import { ValueObject } from '../../../../shared/domain/value-objects/ValueObject';

describe('OrderItem', () => {
  const validUnitPrice = new Money(10.50);
  const validTotalPrice = new Money(31.50);
  
  const validOrderItemProps = {
    productId: 'product-123',
    quantity: 3,
    unitPrice: validUnitPrice,
    totalPrice: validTotalPrice
  };

  describe('constructor', () => {
    it('should create an OrderItem instance with valid props', () => {
      // Act
      const orderItem = new OrderItem(validOrderItemProps);

      // Assert
      expect(orderItem).toBeInstanceOf(OrderItem);
      expect(orderItem).toBeInstanceOf(ValueObject);
    });

    it('should throw error when productId is empty', () => {
      // Arrange
      const props = { ...validOrderItemProps, productId: '' };

      // Act & Assert
      expect(() => new OrderItem(props)).toThrow('Product ID is required');
    });

    it('should throw error when productId is not provided', () => {
      // Arrange
      const props = { ...validOrderItemProps };
      delete (props as any).productId;

      // Act & Assert
      expect(() => new OrderItem(props)).toThrow('Product ID is required');
    });

    it('should throw error when quantity is zero', () => {
      // Arrange
      const props = { ...validOrderItemProps, quantity: 0 };

      // Act & Assert
      expect(() => new OrderItem(props)).toThrow('Quantity must be greater than zero');
    });

    it('should throw error when quantity is negative', () => {
      // Arrange
      const props = { ...validOrderItemProps, quantity: -1 };

      // Act & Assert
      expect(() => new OrderItem(props)).toThrow('Quantity must be greater than zero');
    });

    it('should throw error when unitPrice is not provided', () => {
      // Arrange
      const props = { ...validOrderItemProps };
      delete (props as any).unitPrice;

      // Act & Assert
      expect(() => new OrderItem(props)).toThrow('Unit price is required');
    });

    it('should throw error when totalPrice is not provided', () => {
      // Arrange
      const props = { ...validOrderItemProps };
      delete (props as any).totalPrice;

      // Act & Assert
      expect(() => new OrderItem(props)).toThrow('Total price is required');
    });

    it('should accept minimum valid quantity', () => {
      // Arrange
      const props = { ...validOrderItemProps, quantity: 1 };

      // Act & Assert
      expect(() => new OrderItem(props)).not.toThrow();
    });

    it('should accept large quantities', () => {
      // Arrange
      const props = { ...validOrderItemProps, quantity: 999 };

      // Act & Assert
      expect(() => new OrderItem(props)).not.toThrow();
    });
  });

  describe('getters', () => {
    let orderItem: OrderItem;

    beforeEach(() => {
      orderItem = new OrderItem(validOrderItemProps);
    });

    it('should return correct productId', () => {
      // Act & Assert
      expect(orderItem.productId).toBe('product-123');
    });

    it('should return correct quantity', () => {
      // Act & Assert
      expect(orderItem.quantity).toBe(3);
    });

    it('should return correct unitPrice', () => {
      // Act & Assert
      expect(orderItem.unitPrice).toBe(validUnitPrice);
      expect(orderItem.unitPrice.getValue()).toBe(10.50);
    });

    it('should return correct totalPrice', () => {
      // Act & Assert
      expect(orderItem.totalPrice).toBe(validTotalPrice);
      expect(orderItem.totalPrice.getValue()).toBe(31.50);
    });
  });

  describe('toString', () => {
    it('should return formatted string with quantity, productId and totalPrice', () => {
      // Arrange
      const orderItem = new OrderItem(validOrderItemProps);

      // Act
      const result = orderItem.toString();

      // Assert
      expect(result).toBe('3x product-123 - 31.5');
    });

    it('should handle different quantities and prices', () => {
      // Arrange
      const unitPrice = new Money(25.99);
      const totalPrice = new Money(25.99);
      const props = {
        productId: 'special-item-456',
        quantity: 1,
        unitPrice,
        totalPrice
      };
      const orderItem = new OrderItem(props);

      // Act
      const result = orderItem.toString();

      // Assert
      expect(result).toBe('1x special-item-456 - 25.99');
    });

    it('should handle large quantities', () => {
      // Arrange
      const unitPrice = new Money(5.00);
      const totalPrice = new Money(500.00);
      const props = {
        productId: 'bulk-item-789',
        quantity: 100,
        unitPrice,
        totalPrice
      };
      const orderItem = new OrderItem(props);

      // Act
      const result = orderItem.toString();

      // Assert
      expect(result).toBe('100x bulk-item-789 - 500');
    });
  });

  describe('getValue', () => {
    it('should return the original props object', () => {
      // Arrange
      const orderItem = new OrderItem(validOrderItemProps);

      // Act
      const result = orderItem.getValue();

      // Assert
      expect(result).toEqual(validOrderItemProps);
      expect(result.productId).toBe('product-123');
      expect(result.quantity).toBe(3);
      expect(result.unitPrice).toBe(validUnitPrice);
      expect(result.totalPrice).toBe(validTotalPrice);
    });
  });

  describe('edge cases', () => {
    it('should handle very long product IDs', () => {
      // Arrange
      const longProductId = 'A'.repeat(100);
      const props = { ...validOrderItemProps, productId: longProductId };

      // Act & Assert
      expect(() => new OrderItem(props)).not.toThrow();
      const orderItem = new OrderItem(props);
      expect(orderItem.productId).toBe(longProductId);
    });

    it('should handle UUID-style product IDs', () => {
      // Arrange
      const uuidProductId = '550e8400-e29b-41d4-a716-446655440000';
      const props = { ...validOrderItemProps, productId: uuidProductId };

      // Act & Assert
      expect(() => new OrderItem(props)).not.toThrow();
      const orderItem = new OrderItem(props);
      expect(orderItem.productId).toBe(uuidProductId);
    });

    it('should handle special characters in product ID', () => {
      // Arrange
      const specialProductId = 'PROD-123_ABC@v2.0';
      const props = { ...validOrderItemProps, productId: specialProductId };

      // Act & Assert
      expect(() => new OrderItem(props)).not.toThrow();
      const orderItem = new OrderItem(props);
      expect(orderItem.productId).toBe(specialProductId);
    });

    it('should handle very small prices', () => {
      // Arrange
      const smallUnitPrice = new Money(0.01);
      const smallTotalPrice = new Money(0.03);
      const props = {
        ...validOrderItemProps,
        unitPrice: smallUnitPrice,
        totalPrice: smallTotalPrice
      };

      // Act & Assert
      expect(() => new OrderItem(props)).not.toThrow();
      const orderItem = new OrderItem(props);
      expect(orderItem.unitPrice.getValue()).toBe(0.01);
      expect(orderItem.totalPrice.getValue()).toBe(0.03);
    });

    it('should handle very large prices', () => {
      // Arrange
      const largeUnitPrice = new Money(9999.99);
      const largeTotalPrice = new Money(29999.97);
      const props = {
        ...validOrderItemProps,
        unitPrice: largeUnitPrice,
        totalPrice: largeTotalPrice
      };

      // Act & Assert
      expect(() => new OrderItem(props)).not.toThrow();
      const orderItem = new OrderItem(props);
      expect(orderItem.unitPrice.getValue()).toBe(9999.99);
      expect(orderItem.totalPrice.getValue()).toBe(29999.97);
    });

    it('should maintain immutability of Money objects', () => {
      // Arrange
      const originalUnitPrice = new Money(15.00);
      const originalTotalPrice = new Money(45.00);
      const props = {
        ...validOrderItemProps,
        unitPrice: originalUnitPrice,
        totalPrice: originalTotalPrice
      };
      const orderItem = new OrderItem(props);

      // Act
      const retrievedUnitPrice = orderItem.unitPrice;
      const retrievedTotalPrice = orderItem.totalPrice;

      // Assert
      expect(retrievedUnitPrice).toBe(originalUnitPrice);
      expect(retrievedTotalPrice).toBe(originalTotalPrice);
      expect(retrievedUnitPrice.getValue()).toBe(15.00);
      expect(retrievedTotalPrice.getValue()).toBe(45.00);
    });
  });

  describe('business logic scenarios', () => {
    it('should create order item for single quantity', () => {
      // Arrange
      const unitPrice = new Money(99.99);
      const totalPrice = new Money(99.99);
      const props = {
        productId: 'expensive-item',
        quantity: 1,
        unitPrice,
        totalPrice
      };

      // Act
      const orderItem = new OrderItem(props);

      // Assert
      expect(orderItem.quantity).toBe(1);
      expect(orderItem.unitPrice.getValue()).toBe(99.99);
      expect(orderItem.totalPrice.getValue()).toBe(99.99);
      expect(orderItem.toString()).toBe('1x expensive-item - 99.99');
    });

    it('should create order item for bulk purchase', () => {
      // Arrange
      const unitPrice = new Money(2.50);
      const totalPrice = new Money(250.00);
      const props = {
        productId: 'bulk-widget',
        quantity: 100,
        unitPrice,
        totalPrice
      };

      // Act
      const orderItem = new OrderItem(props);

      // Assert
      expect(orderItem.quantity).toBe(100);
      expect(orderItem.unitPrice.getValue()).toBe(2.50);
      expect(orderItem.totalPrice.getValue()).toBe(250.00);
      expect(orderItem.toString()).toBe('100x bulk-widget - 250');
    });

    it('should create order item with fractional quantity representation', () => {
      // Arrange
      // Simulating 2.5 kg of a product sold by weight
      const unitPrice = new Money(4.00); // per kg
      const totalPrice = new Money(10.00); // 2.5 * 4.00
      const props = {
        productId: 'weighted-product',
        quantity: 2, // We'll use 2 as the integer representation
        unitPrice,
        totalPrice
      };

      // Act
      const orderItem = new OrderItem(props);

      // Assert
      expect(orderItem.quantity).toBe(2);
      expect(orderItem.unitPrice.getValue()).toBe(4.00);
      expect(orderItem.totalPrice.getValue()).toBe(10.00);
    });
  });
}); 