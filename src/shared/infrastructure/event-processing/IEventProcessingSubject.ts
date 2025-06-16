import { EventObserver } from '../../application/patterns/observer/EventObserver';
import { DomainEvent } from '../../domain/events/DomainEvent';

/**
 * Interface for Event Processing Subject (Observer Pattern)
 */
export interface IEventProcessingSubject {
  addObserver(observer: EventObserver): void;
  removeObserver(observer: EventObserver): void;
  notifyObservers(event: DomainEvent): Promise<void>;
} 