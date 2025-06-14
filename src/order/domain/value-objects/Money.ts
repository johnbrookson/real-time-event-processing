import { ValueObject } from '../../../shared/domain/value-objects/ValueObject';

export class Money extends ValueObject<number> {
  constructor(value: number) {
    super(value);
    this.validate();
  }

  private validate(): void {
    if (this.getValue() < 0) {
      throw new Error('Money value cannot be negative');
    }
  }

  add(money: Money): Money {
    return new Money(this.getValue() + money.getValue());
  }

  subtract(money: Money): Money {
    return new Money(this.getValue() - money.getValue());
  }

  multiply(multiplier: number): Money {
    return new Money(this.getValue() * multiplier);
  }

  override equals(other: ValueObject<number>): boolean {
    if (!(other instanceof Money)) {
      return false;
    }
    return this.getValue() === other.getValue();
  }

  override toString(): string {
    return this.getValue().toString();
  }
} 