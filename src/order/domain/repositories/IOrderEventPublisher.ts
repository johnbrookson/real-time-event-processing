import { DomainEvent } from '../../../shared/domain/events/DomainEvent';

export interface IOrderEventPublisher {
  publish(event: DomainEvent): Promise<void>;
} 