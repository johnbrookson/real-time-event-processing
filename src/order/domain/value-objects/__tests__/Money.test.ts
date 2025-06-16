import { Money } from '../Money';
import { ValueObject } from '../../../../shared/domain/value-objects/ValueObject';

describe('Money', () => {
  describe('constructor', () => {
    it('should create a Money instance with valid positive value', () => {
      // Act
      const money = new Money(100.50);

      // Assert
      expect(money).toBeInstanceOf(Money);
      expect(money).toBeInstanceOf(ValueObject);
      expect(money.getValue()).toBe(100.50);
    });

    it('should create a Money instance with zero value', () => {
      // Act
      const money = new Money(0);

      // Assert
      expect(money.getValue()).toBe(0);
    });

    it('should create a Money instance with decimal value', () => {
      // Act
      const money = new Money(99.99);

      // Assert
      expect(money.getValue()).toBe(99.99);
    });

    it('should throw error when value is negative', () => {
      // Act & Assert
      expect(() => new Money(-1)).toThrow('Money value cannot be negative');
      expect(() => new Money(-0.01)).toThrow('Money value cannot be negative');
      expect(() => new Money(-100)).toThrow('Money value cannot be negative');
    });
  });

  describe('add', () => {
    it('should add two positive money values correctly', () => {
      // Arrange
      const money1 = new Money(50.25);
      const money2 = new Money(25.75);

      // Act
      const result = money1.add(money2);

      // Assert
      expect(result).toBeInstanceOf(Money);
      expect(result.getValue()).toBe(76.00);
      expect(result).not.toBe(money1); // Should return new instance
      expect(result).not.toBe(money2); // Should return new instance
    });

    it('should add zero to money value', () => {
      // Arrange
      const money1 = new Money(100);
      const money2 = new Money(0);

      // Act
      const result = money1.add(money2);

      // Assert
      expect(result.getValue()).toBe(100);
    });

    it('should add decimal money values precisely', () => {
      // Arrange
      const money1 = new Money(10.99);
      const money2 = new Money(5.01);

      // Act
      const result = money1.add(money2);

      // Assert
      expect(result.getValue()).toBe(16.00);
    });
  });

  describe('subtract', () => {
    it('should subtract money values correctly', () => {
      // Arrange
      const money1 = new Money(100.50);
      const money2 = new Money(25.25);

      // Act
      const result = money1.subtract(money2);

      // Assert
      expect(result).toBeInstanceOf(Money);
      expect(result.getValue()).toBe(75.25);
      expect(result).not.toBe(money1); // Should return new instance
      expect(result).not.toBe(money2); // Should return new instance
    });

    it('should subtract zero from money value', () => {
      // Arrange
      const money1 = new Money(50);
      const money2 = new Money(0);

      // Act
      const result = money1.subtract(money2);

      // Assert
      expect(result.getValue()).toBe(50);
    });

    it('should subtract equal values to get zero', () => {
      // Arrange
      const money1 = new Money(25.50);
      const money2 = new Money(25.50);

      // Act
      const result = money1.subtract(money2);

      // Assert
      expect(result.getValue()).toBe(0);
    });

    it('should throw error when subtraction results in negative value', () => {
      // Arrange
      const money1 = new Money(10);
      const money2 = new Money(20);

      // Act & Assert
      expect(() => money1.subtract(money2)).toThrow('Money value cannot be negative');
    });

    it('should throw error when subtracting larger decimal from smaller', () => {
      // Arrange
      const money1 = new Money(5.99);
      const money2 = new Money(6.00);

      // Act & Assert
      expect(() => money1.subtract(money2)).toThrow('Money value cannot be negative');
    });
  });

  describe('multiply', () => {
    it('should multiply money by positive integer correctly', () => {
      // Arrange
      const money = new Money(25.50);

      // Act
      const result = money.multiply(3);

      // Assert
      expect(result).toBeInstanceOf(Money);
      expect(result.getValue()).toBe(76.50);
      expect(result).not.toBe(money); // Should return new instance
    });

    it('should multiply money by decimal multiplier correctly', () => {
      // Arrange
      const money = new Money(100);

      // Act
      const result = money.multiply(0.5);

      // Assert
      expect(result.getValue()).toBe(50);
    });

    it('should multiply money by zero to get zero', () => {
      // Arrange
      const money = new Money(999.99);

      // Act
      const result = money.multiply(0);

      // Assert
      expect(result.getValue()).toBe(0);
    });

    it('should multiply money by one to get same value', () => {
      // Arrange
      const money = new Money(123.45);

      // Act
      const result = money.multiply(1);

      // Assert
      expect(result.getValue()).toBe(123.45);
    });

    it('should throw error when multiplication results in negative value', () => {
      // Arrange
      const money = new Money(50);

      // Act & Assert
      expect(() => money.multiply(-1)).toThrow('Money value cannot be negative');
      expect(() => money.multiply(-0.5)).toThrow('Money value cannot be negative');
    });
  });

  describe('equals', () => {
    it('should return true for equal money values', () => {
      // Arrange
      const money1 = new Money(100.50);
      const money2 = new Money(100.50);

      // Act & Assert
      expect(money1.equals(money2)).toBe(true);
      expect(money2.equals(money1)).toBe(true);
    });

    it('should return false for different money values', () => {
      // Arrange
      const money1 = new Money(100.50);
      const money2 = new Money(100.51);

      // Act & Assert
      expect(money1.equals(money2)).toBe(false);
      expect(money2.equals(money1)).toBe(false);
    });

    it('should return true for zero values', () => {
      // Arrange
      const money1 = new Money(0);
      const money2 = new Money(0);

      // Act & Assert
      expect(money1.equals(money2)).toBe(true);
    });

    it('should return false when comparing with non-Money ValueObject', () => {
      // Arrange
      const money = new Money(100);
      const nonMoneyValueObject = new (class extends ValueObject<number> {
        constructor() {
          super(100);
        }
      })();

      // Act & Assert
      expect(money.equals(nonMoneyValueObject)).toBe(false);
    });

    it('should return false when comparing with different types', () => {
      // Arrange
      const money = new Money(100);
      const stringValueObject = new (class extends ValueObject<string> {
        constructor() {
          super('100');
        }
      })();

      // Act & Assert
      expect(money.equals(stringValueObject as any)).toBe(false);
    });
  });

  describe('toString', () => {
    it('should convert money to string correctly', () => {
      // Arrange
      const money = new Money(123.45);

      // Act
      const result = money.toString();

      // Assert
      expect(result).toBe('123.45');
      expect(typeof result).toBe('string');
    });

    it('should convert zero money to string', () => {
      // Arrange
      const money = new Money(0);

      // Act
      const result = money.toString();

      // Assert
      expect(result).toBe('0');
    });

    it('should convert integer money to string', () => {
      // Arrange
      const money = new Money(100);

      // Act
      const result = money.toString();

      // Assert
      expect(result).toBe('100');
    });

    it('should convert decimal money to string with precision', () => {
      // Arrange
      const money = new Money(99.99);

      // Act
      const result = money.toString();

      // Assert
      expect(result).toBe('99.99');
    });
  });

  describe('getValue', () => {
    it('should return the correct money value', () => {
      // Arrange
      const money = new Money(250.75);

      // Act
      const result = money.getValue();

      // Assert
      expect(result).toBe(250.75);
      expect(typeof result).toBe('number');
    });

    it('should return zero for zero money', () => {
      // Arrange
      const money = new Money(0);

      // Act
      const result = money.getValue();

      // Assert
      expect(result).toBe(0);
    });
  });

  describe('complex operations', () => {
    it('should handle chained operations correctly', () => {
      // Arrange
      const money1 = new Money(100);
      const money2 = new Money(50);
      const money3 = new Money(25);

      // Act
      const result = money1.add(money2).subtract(money3).multiply(2);

      // Assert
      expect(result.getValue()).toBe(250); // (100 + 50 - 25) * 2
    });

    it('should maintain immutability in operations', () => {
      // Arrange
      const originalMoney = new Money(100);
      const addMoney = new Money(50);

      // Act
      const result = originalMoney.add(addMoney);

      // Assert
      expect(originalMoney.getValue()).toBe(100); // Original unchanged
      expect(addMoney.getValue()).toBe(50); // Operand unchanged
      expect(result.getValue()).toBe(150); // Result is new instance
    });

    it('should work with very small decimal values', () => {
      // Arrange
      const money1 = new Money(0.01);
      const money2 = new Money(0.02);

      // Act
      const result = money1.add(money2);

      // Assert
      expect(result.getValue()).toBe(0.03);
    });
  });
}); 