import { Address } from '../Address';
import { ValueObject } from '../../../../shared/domain/value-objects/ValueObject';

describe('Address', () => {
  const validAddressProps = {
    street: 'Main Street',
    number: '123',
    complement: 'Suite 100',
    neighborhood: 'Downtown',
    city: 'New York',
    state: 'NY',
    country: 'USA',
    zipCode: '10001'
  };

  describe('constructor', () => {
    it('should create an Address instance with valid props', () => {
      // Act
      const address = new Address(validAddressProps);

      // Assert
      expect(address).toBeInstanceOf(Address);
      expect(address).toBeInstanceOf(ValueObject);
    });

    it('should create an Address instance without complement', () => {
      // Arrange
      const { complement, ...props } = validAddressProps;

      // Act
      const address = new Address(props);

      // Assert
      expect(address.complement).toBeUndefined();
    });

    it('should throw error when street is empty', () => {
      // Arrange
      const props = { ...validAddressProps, street: '' };

      // Act & Assert
      expect(() => new Address(props)).toThrow('Street is required');
    });

    it('should throw error when street is not provided', () => {
      // Arrange
      const props = { ...validAddressProps };
      delete (props as any).street;

      // Act & Assert
      expect(() => new Address(props)).toThrow('Street is required');
    });

    it('should throw error when street is too short', () => {
      // Arrange
      const props = { ...validAddressProps, street: 'AB' };

      // Act & Assert
      expect(() => new Address(props)).toThrow('Street must be at least 3 characters long');
    });

    it('should throw error when number is empty', () => {
      // Arrange
      const props = { ...validAddressProps, number: '' };

      // Act & Assert
      expect(() => new Address(props)).toThrow('Number is required');
    });

    it('should throw error when number is not provided', () => {
      // Arrange
      const props = { ...validAddressProps };
      delete (props as any).number;

      // Act & Assert
      expect(() => new Address(props)).toThrow('Number is required');
    });

    it('should throw error when neighborhood is empty', () => {
      // Arrange
      const props = { ...validAddressProps, neighborhood: '' };

      // Act & Assert
      expect(() => new Address(props)).toThrow('Neighborhood is required');
    });

    it('should throw error when neighborhood is not provided', () => {
      // Arrange
      const props = { ...validAddressProps };
      delete (props as any).neighborhood;

      // Act & Assert
      expect(() => new Address(props)).toThrow('Neighborhood is required');
    });

    it('should throw error when city is empty', () => {
      // Arrange
      const props = { ...validAddressProps, city: '' };

      // Act & Assert
      expect(() => new Address(props)).toThrow('City is required');
    });

    it('should throw error when city is not provided', () => {
      // Arrange
      const props = { ...validAddressProps };
      delete (props as any).city;

      // Act & Assert
      expect(() => new Address(props)).toThrow('City is required');
    });

    it('should throw error when state is empty', () => {
      // Arrange
      const props = { ...validAddressProps, state: '' };

      // Act & Assert
      expect(() => new Address(props)).toThrow('State is required');
    });

    it('should throw error when state is not provided', () => {
      // Arrange
      const props = { ...validAddressProps };
      delete (props as any).state;

      // Act & Assert
      expect(() => new Address(props)).toThrow('State is required');
    });

    it('should throw error when country is empty', () => {
      // Arrange
      const props = { ...validAddressProps, country: '' };

      // Act & Assert
      expect(() => new Address(props)).toThrow('Country is required');
    });

    it('should throw error when country is not provided', () => {
      // Arrange
      const props = { ...validAddressProps };
      delete (props as any).country;

      // Act & Assert
      expect(() => new Address(props)).toThrow('Country is required');
    });

    it('should throw error when zipCode is empty', () => {
      // Arrange
      const props = { ...validAddressProps, zipCode: '' };

      // Act & Assert
      expect(() => new Address(props)).toThrow('Zip code is required');
    });

    it('should throw error when zipCode is not provided', () => {
      // Arrange
      const props = { ...validAddressProps };
      delete (props as any).zipCode;

      // Act & Assert
      expect(() => new Address(props)).toThrow('Zip code is required');
    });

    it('should throw error when zipCode is too short', () => {
      // Arrange
      const props = { ...validAddressProps, zipCode: '1234' };

      // Act & Assert
      expect(() => new Address(props)).toThrow('Zip code must be at least 5 characters long');
    });

    it('should accept minimum valid street length', () => {
      // Arrange
      const props = { ...validAddressProps, street: 'ABC' };

      // Act & Assert
      expect(() => new Address(props)).not.toThrow();
    });

    it('should accept minimum valid zipCode length', () => {
      // Arrange
      const props = { ...validAddressProps, zipCode: '12345' };

      // Act & Assert
      expect(() => new Address(props)).not.toThrow();
    });
  });

  describe('getters', () => {
    let address: Address;

    beforeEach(() => {
      address = new Address(validAddressProps);
    });

    it('should return correct street', () => {
      // Act & Assert
      expect(address.street).toBe('Main Street');
    });

    it('should return correct number', () => {
      // Act & Assert
      expect(address.number).toBe('123');
    });

    it('should return correct complement', () => {
      // Act & Assert
      expect(address.complement).toBe('Suite 100');
    });

    it('should return undefined for complement when not provided', () => {
      // Arrange
      const { complement, ...props } = validAddressProps;
      const addressWithoutComplement = new Address(props);

      // Act & Assert
      expect(addressWithoutComplement.complement).toBeUndefined();
    });

    it('should return correct neighborhood', () => {
      // Act & Assert
      expect(address.neighborhood).toBe('Downtown');
    });

    it('should return correct city', () => {
      // Act & Assert
      expect(address.city).toBe('New York');
    });

    it('should return correct state', () => {
      // Act & Assert
      expect(address.state).toBe('NY');
    });

    it('should return correct country', () => {
      // Act & Assert
      expect(address.country).toBe('USA');
    });

    it('should return correct zipCode', () => {
      // Act & Assert
      expect(address.zipCode).toBe('10001');
    });
  });

  describe('toString', () => {
    it('should return formatted address string with all fields', () => {
      // Arrange
      const address = new Address(validAddressProps);

      // Act
      const result = address.toString();

      // Assert
      expect(result).toBe('Main Street, 123, Suite 100, Downtown, New York, NY, USA, 10001');
    });

    it('should return formatted address string without complement', () => {
      // Arrange
      const { complement, ...props } = validAddressProps;
      const address = new Address(props);

      // Act
      const result = address.toString();

      // Assert
      expect(result).toBe('Main Street, 123, Downtown, New York, NY, USA, 10001');
    });

    it('should handle empty complement correctly', () => {
      // Arrange
      const props = { ...validAddressProps, complement: '' };
      const address = new Address(props);

      // Act
      const result = address.toString();

      // Assert
      expect(result).toBe('Main Street, 123, Downtown, New York, NY, USA, 10001');
    });

    it('should handle different address formats', () => {
      // Arrange
      const brazilianAddress = {
        street: 'Rua das Flores',
        number: '456',
        complement: 'Apto 301',
        neighborhood: 'Centro',
        city: 'São Paulo',
        state: 'SP',
        country: 'Brazil',
        zipCode: '01310-100'
      };
      const address = new Address(brazilianAddress);

      // Act
      const result = address.toString();

      // Assert
      expect(result).toBe('Rua das Flores, 456, Apto 301, Centro, São Paulo, SP, Brazil, 01310-100');
    });
  });

  describe('getValue', () => {
    it('should return the original props object', () => {
      // Arrange
      const address = new Address(validAddressProps);

      // Act
      const result = address.getValue();

      // Assert
      expect(result).toEqual(validAddressProps);
      expect(result.street).toBe('Main Street');
      expect(result.number).toBe('123');
      expect(result.complement).toBe('Suite 100');
      expect(result.neighborhood).toBe('Downtown');
      expect(result.city).toBe('New York');
      expect(result.state).toBe('NY');
      expect(result.country).toBe('USA');
      expect(result.zipCode).toBe('10001');
    });
  });

  describe('edge cases', () => {
    it('should handle very long street names', () => {
      // Arrange
      const longStreetName = 'A'.repeat(100);
      const props = { ...validAddressProps, street: longStreetName };

      // Act & Assert
      expect(() => new Address(props)).not.toThrow();
      const address = new Address(props);
      expect(address.street).toBe(longStreetName);
    });

    it('should handle numeric street numbers', () => {
      // Arrange
      const props = { ...validAddressProps, number: '999999' };

      // Act & Assert
      expect(() => new Address(props)).not.toThrow();
      const address = new Address(props);
      expect(address.number).toBe('999999');
    });

    it('should handle alphanumeric zip codes', () => {
      // Arrange
      const props = { ...validAddressProps, zipCode: 'SW1A 1AA' };

      // Act & Assert
      expect(() => new Address(props)).not.toThrow();
      const address = new Address(props);
      expect(address.zipCode).toBe('SW1A 1AA');
    });

    it('should handle special characters in complement', () => {
      // Arrange
      const props = { ...validAddressProps, complement: 'Apt #123-B (Rear)' };

      // Act & Assert
      expect(() => new Address(props)).not.toThrow();
      const address = new Address(props);
      expect(address.complement).toBe('Apt #123-B (Rear)');
    });

    it('should handle international address formats', () => {
      // Arrange
      const internationalAddress = {
        street: 'Avenue des Champs-Élysées',
        number: '101',
        neighborhood: '8e arrondissement',
        city: 'Paris',
        state: 'Île-de-France',
        country: 'France',
        zipCode: '75008'
      };

      // Act & Assert
      expect(() => new Address(internationalAddress)).not.toThrow();
      const address = new Address(internationalAddress);
      expect(address.street).toBe('Avenue des Champs-Élysées');
      expect(address.city).toBe('Paris');
      expect(address.country).toBe('France');
    });
  });
}); 