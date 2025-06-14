import { DomainEvent } from '../../../domain/events/DomainEvent';

/**
 * Observer Pattern Interface for Event Notifications
 * 
 * This interface defines observers that react to domain events.
 * All operations are async to support non-blocking I/O operations
 * like sending emails, webhooks, or database updates.
 * 
 * Benefits:
 * - Loose coupling: observers don't know about each other
 * - Dynamic subscription: observers can be added/removed at runtime
 * - Async support: notifications can perform I/O operations efficiently
 */
export interface EventObserver {
  /**
   * Handles a domain event notification asynchronously
   * @param event The domain event that occurred
   * @returns Promise that resolves when the observer has processed the event
   */
  handleEvent(event: DomainEvent): Promise<void>;

  /**
   * Indicates if this observer is interested in the given event type
   * @param eventType The type of event to check
   * @returns true if this observer should be notified of this event type
   */
  isInterestedIn(eventType: string): boolean;

  /**
   * Returns the observer name for logging and debugging
   */
  getObserverName(): string;
}

/**
 * Subject interface for the Observer Pattern
 * Manages a list of observers and notifies them of events
 */
export interface EventSubject {
  /**
   * Adds an observer to the notification list
   * @param observer The observer to add
   */
  addObserver(observer: EventObserver): void;

  /**
   * Removes an observer from the notification list
   * @param observer The observer to remove
   */
  removeObserver(observer: EventObserver): void;

  /**
   * Notifies all interested observers about an event
   * @param event The domain event to notify about
   * @returns Promise that resolves when all observers have been notified
   */
  notifyObservers(event: DomainEvent): Promise<void>;
}

/**
 * Concrete implementation of EventSubject
 * Manages observers and handles event notifications
 */
export class EventSubject implements EventSubject {
  private observers: EventObserver[] = [];

  addObserver(observer: EventObserver): void {
    this.observers.push(observer);
  }

  removeObserver(observer: EventObserver): void {
    const index = this.observers.indexOf(observer);
    if (index > -1) {
      this.observers.splice(index, 1);
    }
  }

  async notifyObservers(event: DomainEvent): Promise<void> {
    const interestedObservers = this.observers.filter(observer => 
      observer.isInterestedIn(event.eventType)
    );

    // Notify all interested observers in parallel
    const notifications = interestedObservers.map(observer => 
      observer.handleEvent(event)
    );

    await Promise.allSettled(notifications);
  }
} 