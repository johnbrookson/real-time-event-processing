import { Logger } from '../../application/logging/logger';
import { DomainEvent } from '../../domain/events/DomainEvent';
import { ProcessingStrategy } from './BatchProcessor';
import { IBatchFlushStrategy } from './IBatchFlushStrategy';

/**
 * Strategy for handling BatchFlush events
 * This strategy is used to trigger batch processing without requiring actual event processing
 */
export class BatchFlushStrategy implements ProcessingStrategy, IBatchFlushStrategy {
  private readonly logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  async process(event: DomainEvent): Promise<void> {
    // BatchFlush events don't need actual processing
    // They are just triggers for batch processing

  }

  getStrategyName(): string {
    return 'BatchFlushStrategy';
  }
} 