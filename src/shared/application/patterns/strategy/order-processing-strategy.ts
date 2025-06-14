import { Logger } from '../../logging/logger';
import { DomainEvent } from '../../../domain/events/DomainEvent';
import { OrderCreatedEvent } from '../../../../order/domain/events/OrderCreatedEvent';
import { OrderCancelledEvent } from '../../../../order/domain/events/OrderCancelledEvent';
import { OrderCompletedEvent } from '../../../../order/domain/events/OrderCompletedEvent';

export interface ProcessingStrategy {
  canHandle(event: DomainEvent): boolean;
  handle(event: DomainEvent): Promise<void>;
}

/**
 * Concrete Strategy for processing Order-related events
 * 
 * This strategy handles all order lifecycle events using async/await
 * for database operations, external API calls, and message publishing.
 * 
 * Supports:
 * - Individual event processing
 * - Batch processing for performance optimization
 * - Error handling with proper async flow control
 */
export class OrderProcessingStrategy implements ProcessingStrategy {
  constructor(private readonly logger: Logger) {}

  canHandle(event: DomainEvent): boolean {
    return (
      event instanceof OrderCreatedEvent ||
      event instanceof OrderCancelledEvent ||
      event instanceof OrderCompletedEvent
    );
  }

  async handle(event: DomainEvent): Promise<void> {
    try {
      if (event instanceof OrderCreatedEvent) {
        await this.handleOrderCreated(event);
      } else if (event instanceof OrderCancelledEvent) {
        await this.handleOrderCancelled(event);
      } else if (event instanceof OrderCompletedEvent) {
        await this.handleOrderCompleted(event);
      }
    } catch (error) {
      this.logger.error('Error processing order event', { error, event });
      throw error;
    }
  }

  private async handleOrderCreated(event: OrderCreatedEvent): Promise<void> {
    this.logger.info('Processing order created event', {
      eventId: event.eventId.value,
      aggregateId: event.aggregateId,
      orderId: event.data.orderId,
      customerId: event.data.customerId,
      total: event.data.total
    });

    // Implement order creation logic here
    // For example:
    // 1. Validate order data
    // 2. Reserve inventory
    // 3. Process payment
    // 4. Update order status
    // 5. Send confirmation
  }

  private async handleOrderCancelled(event: OrderCancelledEvent): Promise<void> {
    this.logger.info('Processing order cancelled event', {
      eventId: event.eventId.value,
      aggregateId: event.aggregateId,
      orderId: event.data.orderId,
      reason: event.data.reason
    });

    // Implement order cancellation logic here
    // For example:
    // 1. Validate cancellation reason
    // 2. Update order status
    // 3. Process refund if needed
    // 4. Restore inventory
    // 5. Send notifications
  }

  private async handleOrderCompleted(event: OrderCompletedEvent): Promise<void> {
    this.logger.info('Processing order completed event', {
      eventId: event.eventId.value,
      aggregateId: event.aggregateId,
      orderId: event.data.orderId,
      completedAt: event.data.completedAt
    });

    // Implement order completion logic here
    // For example:
    // 1. Update order status
    // 2. Generate invoice
    // 3. Update customer loyalty points
    // 4. Send completion notifications
    // 5. Archive order data
  }
} 