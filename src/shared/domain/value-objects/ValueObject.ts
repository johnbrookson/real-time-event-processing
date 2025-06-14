export abstract class ValueObject<T> {
  protected readonly _value: T;

  constructor(value: T) {
    this._value = value;
  }

  getValue(): T {
    return this._value;
  }

  equals(other: ValueObject<T>): boolean {
    return this._value === other._value;
  }

  toString(): string {
    return String(this._value);
  }
} 