import { v4 as uuidv4 } from 'uuid';
import { ValueObject } from './ValueObject';

export class EventId extends ValueObject<string> {
  constructor(value?: string) {
    super(value || uuidv4());
    this.validate();
  }

  private validate(): void {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(this.getValue())) {
      throw new Error('Invalid EventId format');
    }
  }

  get value(): string {
    return this.getValue();
  }

  override equals(other: EventId): boolean {
    return this.getValue() === other.getValue();
  }

  override toString(): string {
    return this.getValue();
  }

  static generate(): EventId {
    return new EventId();
  }

  static fromString(value: string): EventId {
    return new EventId(value);
  }
} 