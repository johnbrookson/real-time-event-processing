import { ProcessingStrategy } from './BatchProcessor';

/**
 * Interface for Batch Flush Strategy
 */
export interface IBatchFlushStrategy extends ProcessingStrategy {
  getStrategyName(): string;
} 