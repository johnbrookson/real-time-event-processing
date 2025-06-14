import { DomainEvent } from '../../../domain/events/DomainEvent';

/**
 * Strategy Pattern Interface for Event Processing
 * 
 * This interface defines different strategies for processing domain events.
 * Each concrete strategy implements a specific way to handle events,
 * supporting async operations with Promises and async/await syntax.
 * 
 * Benefits:
 * - Separation of concerns: each strategy handles one type of processing
 * - Open/Closed Principle: easy to add new processing strategies
 * - Async support: all operations return Promises for non-blocking execution
 */
export interface EventProcessingStrategy {
  /**
   * Processes a single domain event asynchronously
   * @param event The domain event to process
   * @returns Promise that resolves when processing is complete
   */
  processEvent(event: DomainEvent): Promise<void>;

  /**
   * Processes multiple domain events in batch asynchronously
   * @param events Array of domain events to process
   * @returns Promise that resolves when all events are processed
   */
  processBatch(events: DomainEvent[]): Promise<void>;

  /**
   * Indicates if this strategy can handle the given event type
   * @param eventType The type of event to check
   * @returns true if this strategy can process the event type
   */
  canHandle(eventType: string): boolean;

  /**
   * Returns the strategy name for logging and debugging
   */
  getStrategyName(): string;
} 