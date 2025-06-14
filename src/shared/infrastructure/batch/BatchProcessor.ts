// Conteúdo do arquivo batch-processor.ts 

import { Logger } from '../../../shared/application/logging/logger';
import { DomainEvent } from '../../domain/events/DomainEvent';

export interface BatchProcessorConfig {
  batchSize: number;
  batchIntervalMs: number;
  maxWaitTimeMs: number;
}

export interface ProcessingStrategy {
  process(event: DomainEvent): Promise<void>;
  getStrategyName(): string;
}

export class BatchProcessor {
  private readonly logger: Logger;
  private readonly config: BatchProcessorConfig;
  private strategies: Map<string, ProcessingStrategy> = new Map();
  private eventBatch: DomainEvent[] = [];
  private batchTimer: NodeJS.Timeout | null = null;
  private isShuttingDown: boolean = false;
  private processedCount: number = 0;
  private batchCount: number = 0;

  constructor(logger: Logger, config: BatchProcessorConfig) {
    this.logger = logger;
    this.config = config;
    this.startBatchTimer();
  }

  registerStrategy(eventType: string, strategy: ProcessingStrategy): void {
    this.strategies.set(eventType, strategy);
    this.logger.info(`Registered strategy for event type: ${eventType}`, {
      strategyName: strategy.getStrategyName(),
      totalStrategies: this.strategies.size
    });
  }

  async addEvent(event: DomainEvent): Promise<void> {
    if (this.isShuttingDown) {
      this.logger.warn('Rejecting event - BatchProcessor is shutting down', {
        eventType: event.eventType,
        eventId: event.eventId.value
      });
      return;
    }

    this.eventBatch.push(event);
    
    this.logger.info(`📦 Event added to batch`, {
      eventType: event.eventType,
      eventId: event.eventId.value,
      aggregateId: event.aggregateId,
      batchSize: this.eventBatch.length,
      maxBatchSize: this.config.batchSize
    });

    // Process batch if it reaches the configured size
    if (this.eventBatch.length >= this.config.batchSize) {
      this.logger.info('🚀 Batch size limit reached, processing immediately');
      await this.processBatch();
    }
  }

  private async processBatch(): Promise<void> {
    if (this.eventBatch.length === 0) {
      this.logger.debug('No events in batch to process');
      return;
    }

    const currentBatch = [...this.eventBatch];
    this.eventBatch = [];
    this.batchCount++;

    const batchId = this.batchCount;
    const startTime = Date.now();

    this.logger.info(`🔄 Processing batch #${batchId}`, {
      batchSize: currentBatch.length,
      eventTypes: this.getEventTypeCounts(currentBatch)
    });

    let successCount = 0;
    let errorCount = 0;

    for (const event of currentBatch) {
      try {
        const strategy = this.strategies.get(event.eventType);
        
        if (!strategy) {
          this.logger.warn(`No strategy found for event type: ${event.eventType}`, {
            eventId: event.eventId.value,
            availableStrategies: Array.from(this.strategies.keys())
          });
          errorCount++;
          continue;
        }

        this.logger.debug(`Processing event with strategy`, {
          eventType: event.eventType,
          eventId: event.eventId.value,
          strategyName: strategy.getStrategyName()
        });

        await strategy.process(event);
        successCount++;
        this.processedCount++;

        this.logger.debug(`✅ Event processed successfully`, {
          eventType: event.eventType,
          eventId: event.eventId.value
        });

      } catch (error) {
        errorCount++;
        this.logger.error(`❌ Failed to process event`, {
          eventType: event.eventType,
          eventId: event.eventId.value,
          error: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined
        });
      }
    }

    const processingTime = Date.now() - startTime;
    
    this.logger.info(`✅ Batch #${batchId} processing completed`, {
      totalEvents: currentBatch.length,
      successCount,
      errorCount,
      processingTimeMs: processingTime,
      totalProcessed: this.processedCount
    });

    // Restart the batch timer
    this.startBatchTimer();
  }

  private getEventTypeCounts(events: DomainEvent[]): Record<string, number> {
    return events.reduce((counts, event) => {
      counts[event.eventType] = (counts[event.eventType] || 0) + 1;
      return counts;
    }, {} as Record<string, number>);
  }

  private startBatchTimer(): void {
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
    }

    if (this.isShuttingDown) {
      return;
    }

    this.batchTimer = setTimeout(async () => {
      if (this.eventBatch.length > 0) {
        this.logger.info('⏰ Batch timer expired, processing pending events');
        await this.processBatch();
      }
    }, this.config.batchIntervalMs);
  }

  async shutdown(): Promise<void> {
    this.logger.info('🛑 BatchProcessor shutdown initiated');
    this.isShuttingDown = true;

    // Clear the timer
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }

    // Process any remaining events
    if (this.eventBatch.length > 0) {
      this.logger.info(`Processing ${this.eventBatch.length} remaining events before shutdown`);
      await this.processBatch();
    }

    this.logger.info('BatchProcessor shutdown completed', {
      totalProcessed: this.processedCount,
      totalBatches: this.batchCount
    });
  }

  // Getter methods for monitoring
  getBatchSize(): number {
    return this.eventBatch.length;
  }

  getTotalProcessed(): number {
    return this.processedCount;
  }

  getTotalBatches(): number {
    return this.batchCount;
  }
} 