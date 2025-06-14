import { DomainEvent } from '@shared/domain/events/DomainEvent';
import { EventProcessingStrategy } from '@shared/application/patterns/strategy/event-processing-strategy';
import { Logger } from '@shared/application/logging/logger';

export interface BatchProcessorConfig {
  batchSize: number;
  batchIntervalMs: number;
  maxWaitTimeMs: number;
}

/**
 * Batch Processor for optimizing event processing performance
 * 
 * Collects events and processes them in batches to improve throughput
 * and reduce the overhead of individual event processing.
 * 
 * Features:
 * - Size-based batching: processes when batch reaches configured size
 * - Time-based batching: processes after configured interval
 * - Strategy-based processing: uses different strategies for different event types
 * - Error handling: continues processing even if some events fail
 */
export class BatchProcessor {
  private readonly logger: Logger;
  private readonly config: BatchProcessorConfig;
  private readonly strategies: Map<string, EventProcessingStrategy> = new Map();
  private readonly eventBatches: Map<string, DomainEvent[]> = new Map();
  private readonly batchTimers: Map<string, any> = new Map();
  private isProcessing = false;

  constructor(logger: Logger, config: BatchProcessorConfig) {
    this.logger = logger;
    this.config = config;
  }

  /**
   * Registers a processing strategy for specific event types
   */
  registerStrategy(eventType: string, strategy: EventProcessingStrategy): void {
    this.strategies.set(eventType, strategy);
    this.logger.info(`Registered strategy for event type: ${eventType}`, {
      strategyName: strategy.getStrategyName()
    });
  }

  /**
   * Adds an event to the appropriate batch for processing
   */
  async addEvent(event: DomainEvent): Promise<void> {
    const eventType = event.eventType;
    
    if (!this.strategies.has(eventType)) {
      this.logger.warn(`No strategy registered for event type: ${eventType}`, {
        eventId: event.eventId.value
      });
      return;
    }

    // Initialize batch if it doesn't exist
    if (!this.eventBatches.has(eventType)) {
      this.eventBatches.set(eventType, []);
    }

    const batch = this.eventBatches.get(eventType)!;
    batch.push(event);

    this.logger.debug(`Added event to batch`, {
      eventType,
      eventId: event.eventId.value,
      batchSize: batch.length
    });

    // Process if batch size is reached
    if (batch.length >= this.config.batchSize) {
      await this.processBatch(eventType);
    } else {
      // Set timer if not already set
      this.setTimerIfNeeded(eventType);
    }
  }

  /**
   * Forces processing of all pending batches
   */
  async flushAll(): Promise<void> {
    this.logger.info('Flushing all pending batches');
    
    const eventTypes = Array.from(this.eventBatches.keys());
    const processingPromises = eventTypes.map(eventType => this.processBatch(eventType));
    
    await Promise.allSettled(processingPromises);
    
    this.logger.info('All batches flushed');
  }

  /**
   * Gets current batch statistics
   */
  getBatchStats(): Record<string, number> {
    const stats: Record<string, number> = {};
    
    for (const [eventType, batch] of this.eventBatches.entries()) {
      stats[eventType] = batch.length;
    }
    
    return stats;
  }

  /**
   * Shuts down the batch processor gracefully
   */
  async shutdown(): Promise<void> {
    this.logger.info('Shutting down batch processor');
    
    // Clear all timers
    for (const timer of this.batchTimers.values()) {
      clearTimeout(timer);
    }
    this.batchTimers.clear();
    
    // Process remaining batches
    await this.flushAll();
    
    this.logger.info('Batch processor shutdown complete');
  }

  private async processBatch(eventType: string): Promise<void> {
    if (this.isProcessing) {
      this.logger.debug('Batch processing already in progress, skipping');
      return;
    }

    if (!this.strategies.has(eventType)) {
      this.logger.warn(`No strategy registered for event type: ${eventType}`, {
        eventType
      });
      return;
    }

    const strategy = this.strategies.get(eventType)!;
    const batch = this.eventBatches.get(eventType)!;

    this.isProcessing = true;
    try {
      await strategy.processBatch(batch);
    } catch (error) {
      this.logger.error('Error processing batch', {
        eventType,
        error: error instanceof Error ? error.message : error
      });
    } finally {
      this.isProcessing = false;
    }

    this.logger.info(`Processed batch of ${eventType} events`, {
      eventType,
      batchSize: batch.length
    });

    // Process next batch if any
    if (this.eventBatches.has(eventType)) {
      await this.processBatch(eventType);
    }
  }

  private setTimerIfNeeded(eventType: string): void {
    if (this.batchTimers.has(eventType)) {
      return;
    }

    const timer = setTimeout(async () => {
      await this.processBatch(eventType);
    }, this.config.batchIntervalMs);

    this.batchTimers.set(eventType, timer);
  }
}