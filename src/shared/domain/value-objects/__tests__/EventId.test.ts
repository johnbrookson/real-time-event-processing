import { EventId } from '../EventId';
import { ValueObject } from '../ValueObject';
import { v4 as uuidv4 } from 'uuid';

// Mock uuid to control generation for testing
jest.mock('uuid');
const mockUuidv4 = uuidv4 as jest.MockedFunction<typeof uuidv4>;

describe('EventId', () => {
  const validUuid = '550e8400-e29b-41d4-a716-446655440000';
  const anotherValidUuid = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should create EventId with provided valid UUID', () => {
      // Act
      const eventId = new EventId(validUuid);

      // Assert
      expect(eventId).toBeInstanceOf(EventId);
      expect(eventId).toBeInstanceOf(ValueObject);
      expect(eventId.value).toBe(validUuid);
    });

    it('should create EventId with generated UUID when no value provided', () => {
      // Arrange
      mockUuidv4.mockReturnValue(validUuid);

      // Act
      const eventId = new EventId();

      // Assert
      expect(eventId.value).toBe(validUuid);
      expect(mockUuidv4).toHaveBeenCalledTimes(1);
    });

    it('should create EventId with generated UUID when undefined provided', () => {
      // Arrange
      mockUuidv4.mockReturnValue(validUuid);

      // Act
      const eventId = new EventId(undefined);

      // Assert
      expect(eventId.value).toBe(validUuid);
      expect(mockUuidv4).toHaveBeenCalledTimes(1);
    });

    it('should throw error for invalid UUID format - too short', () => {
      // Arrange
      const invalidUuid = '123';

      // Act & Assert
      expect(() => new EventId(invalidUuid)).toThrow('Invalid EventId format');
    });

    it('should throw error for invalid UUID format - wrong pattern', () => {
      // Arrange
      const invalidUuid = 'not-a-uuid-at-all-invalid';

      // Act & Assert
      expect(() => new EventId(invalidUuid)).toThrow('Invalid EventId format');
    });

    it('should throw error for invalid UUID format - missing hyphens', () => {
      // Arrange
      const invalidUuid = '550e8400e29b41d4a716446655440000';

      // Act & Assert
      expect(() => new EventId(invalidUuid)).toThrow('Invalid EventId format');
    });

    it('should throw error for invalid UUID format - wrong version', () => {
      // Arrange
      const invalidUuid = '550e8400-e29b-71d4-a716-446655440000'; // version 7 instead of 1-5

      // Act & Assert
      expect(() => new EventId(invalidUuid)).toThrow('Invalid EventId format');
    });

    it('should throw error for invalid UUID format - wrong variant', () => {
      // Arrange
      const invalidUuid = '550e8400-e29b-41d4-f716-446655440000'; // variant f instead of 8-b

      // Act & Assert
      expect(() => new EventId(invalidUuid)).toThrow('Invalid EventId format');
    });

    it('should accept various valid UUID versions', () => {
      // Arrange
      const validUuids = [
        '550e8400-e29b-11d4-a716-446655440000', // version 1
        '550e8400-e29b-21d4-a716-446655440000', // version 2
        '550e8400-e29b-31d4-a716-446655440000', // version 3
        '550e8400-e29b-41d4-a716-446655440000', // version 4
        '550e8400-e29b-51d4-a716-446655440000'  // version 5
      ];

      // Act & Assert
      validUuids.forEach(uuid => {
        expect(() => new EventId(uuid)).not.toThrow();
        const eventId = new EventId(uuid);
        expect(eventId.value).toBe(uuid);
      });
    });

    it('should accept various valid UUID variants', () => {
      // Arrange
      const validUuids = [
        '550e8400-e29b-41d4-8716-446655440000', // variant 8
        '550e8400-e29b-41d4-9716-446655440000', // variant 9
        '550e8400-e29b-41d4-a716-446655440000', // variant a
        '550e8400-e29b-41d4-b716-446655440000'  // variant b
      ];

      // Act & Assert
      validUuids.forEach(uuid => {
        expect(() => new EventId(uuid)).not.toThrow();
        const eventId = new EventId(uuid);
        expect(eventId.value).toBe(uuid);
      });
    });
  });

  describe('value getter', () => {
    it('should return the UUID value', () => {
      // Arrange
      const eventId = new EventId(validUuid);

      // Act
      const value = eventId.value;

      // Assert
      expect(value).toBe(validUuid);
    });

    it('should return the same value as getValue()', () => {
      // Arrange
      const eventId = new EventId(validUuid);

      // Act & Assert
      expect(eventId.value).toBe(eventId.getValue());
    });
  });

  describe('equals', () => {
    it('should return true for EventIds with same UUID', () => {
      // Arrange
      const eventId1 = new EventId(validUuid);
      const eventId2 = new EventId(validUuid);

      // Act
      const result = eventId1.equals(eventId2);

      // Assert
      expect(result).toBe(true);
    });

    it('should return false for EventIds with different UUIDs', () => {
      // Arrange
      const eventId1 = new EventId(validUuid);
      const eventId2 = new EventId(anotherValidUuid);

      // Act
      const result = eventId1.equals(eventId2);

      // Assert
      expect(result).toBe(false);
    });

    it('should return true when comparing with itself', () => {
      // Arrange
      const eventId = new EventId(validUuid);

      // Act
      const result = eventId.equals(eventId);

      // Assert
      expect(result).toBe(true);
    });
  });

  describe('toString', () => {
    it('should return the UUID as string', () => {
      // Arrange
      const eventId = new EventId(validUuid);

      // Act
      const result = eventId.toString();

      // Assert
      expect(result).toBe(validUuid);
    });

    it('should return the same value as getValue()', () => {
      // Arrange
      const eventId = new EventId(validUuid);

      // Act & Assert
      expect(eventId.toString()).toBe(eventId.getValue());
    });

    it('should return the same value as value getter', () => {
      // Arrange
      const eventId = new EventId(validUuid);

      // Act & Assert
      expect(eventId.toString()).toBe(eventId.value);
    });
  });

  describe('static generate', () => {
    it('should generate new EventId with UUID', () => {
      // Arrange
      mockUuidv4.mockReturnValue(validUuid);

      // Act
      const eventId = EventId.generate();

      // Assert
      expect(eventId).toBeInstanceOf(EventId);
      expect(eventId.value).toBe(validUuid);
      expect(mockUuidv4).toHaveBeenCalledTimes(1);
    });

    it('should generate different EventIds on multiple calls', () => {
      // Arrange
      mockUuidv4
        .mockReturnValueOnce(validUuid)
        .mockReturnValueOnce(anotherValidUuid);

      // Act
      const eventId1 = EventId.generate();
      const eventId2 = EventId.generate();

      // Assert
      expect(eventId1.value).toBe(validUuid);
      expect(eventId2.value).toBe(anotherValidUuid);
      expect(eventId1.equals(eventId2)).toBe(false);
      expect(mockUuidv4).toHaveBeenCalledTimes(2);
    });
  });

  describe('static fromString', () => {
    it('should create EventId from valid UUID string', () => {
      // Act
      const eventId = EventId.fromString(validUuid);

      // Assert
      expect(eventId).toBeInstanceOf(EventId);
      expect(eventId.value).toBe(validUuid);
    });

    it('should throw error for invalid UUID string', () => {
      // Arrange
      const invalidUuid = 'invalid-uuid';

      // Act & Assert
      expect(() => EventId.fromString(invalidUuid)).toThrow('Invalid EventId format');
    });

    it('should create different EventIds from different valid UUIDs', () => {
      // Act
      const eventId1 = EventId.fromString(validUuid);
      const eventId2 = EventId.fromString(anotherValidUuid);

      // Assert
      expect(eventId1.value).toBe(validUuid);
      expect(eventId2.value).toBe(anotherValidUuid);
      expect(eventId1.equals(eventId2)).toBe(false);
    });
  });

  describe('ValueObject inheritance', () => {
    it('should extend ValueObject correctly', () => {
      // Arrange
      const eventId = new EventId(validUuid);

      // Act & Assert
      expect(eventId).toBeInstanceOf(ValueObject);
      expect(eventId.getValue()).toBe(validUuid);
    });

    it('should work with ValueObject equals method', () => {
      // Arrange
      const eventId1 = new EventId(validUuid);
      const eventId2 = new EventId(validUuid);
      const eventId3 = new EventId(anotherValidUuid);

      // Act & Assert
      expect(eventId1.equals(eventId2)).toBe(true);
      expect(eventId1.equals(eventId3)).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('should handle UUID with uppercase letters', () => {
      // Arrange
      const uppercaseUuid = '550E8400-E29B-41D4-A716-446655440000';

      // Act & Assert
      expect(() => new EventId(uppercaseUuid)).not.toThrow();
      const eventId = new EventId(uppercaseUuid);
      expect(eventId.value).toBe(uppercaseUuid);
    });

    it('should handle UUID with mixed case', () => {
      // Arrange
      const mixedCaseUuid = '550e8400-E29b-41D4-a716-446655440000';

      // Act & Assert
      expect(() => new EventId(mixedCaseUuid)).not.toThrow();
      const eventId = new EventId(mixedCaseUuid);
      expect(eventId.value).toBe(mixedCaseUuid);
    });

    it('should handle empty string by generating UUID', () => {
      // Arrange
      mockUuidv4.mockReturnValue(validUuid);

      // Act
      const eventId = new EventId('');

      // Assert
      expect(eventId.value).toBe(validUuid);
      expect(mockUuidv4).toHaveBeenCalledTimes(1);
    });

    it('should handle null-like values', () => {
      // Arrange
      mockUuidv4.mockReturnValue(validUuid);

      // Act & Assert
      expect(() => new EventId(null as any)).not.toThrow(); // null becomes generated UUID
      expect(() => new EventId(undefined)).not.toThrow(); // undefined becomes generated UUID
    });
  });

  describe('immutability', () => {
    it('should be immutable after creation', () => {
      // Arrange
      const eventId = new EventId(validUuid);
      const originalValue = eventId.value;

      // Act - try to modify (should not be possible due to ValueObject design)
      // No direct way to modify, but we can verify it stays the same
      const valueAfter = eventId.value;

      // Assert
      expect(valueAfter).toBe(originalValue);
      expect(eventId.value).toBe(validUuid);
    });
  });
});