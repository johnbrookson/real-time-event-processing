import { EventId } from '../value-objects/EventId';

export interface DomainEvent {
  readonly eventId: EventId;
  readonly eventType: string;
  readonly aggregateId: string;
  readonly occurredOn: Date;
  readonly version: number;
  readonly data: Record<string, any>;
}

export abstract class BaseDomainEvent implements DomainEvent {
  public readonly eventId: EventId;
  public readonly eventType: string;
  public readonly aggregateId: string;
  public readonly occurredOn: Date;
  public readonly version: number;
  public readonly data: Record<string, any>;

  constructor(
    eventType: string,
    aggregateId: string,
    data: Record<string, any>,
    version: number = 1,
    eventId?: EventId,
    occurredOn?: Date
  ) {
    this.eventId = eventId || new EventId();
    this.eventType = eventType;
    this.aggregateId = aggregateId;
    this.occurredOn = occurredOn || new Date();
    this.version = version;
    this.data = data;
  }
} 