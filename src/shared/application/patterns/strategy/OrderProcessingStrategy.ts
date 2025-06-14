import { Logger } from '../../logging/logger';
import { DomainEvent } from '../../../domain/events/DomainEvent';
import { OrderCreatedEvent } from '../../../../order/domain/events/OrderCreatedEvent';
import { OrderCancelledEvent } from '../../../../order/domain/events/OrderCancelledEvent';
import { OrderCompletedEvent } from '../../../../order/domain/events/OrderCompletedEvent';
import { ProcessingStrategy } from '../../../infrastructure/batch/BatchProcessor';

export class OrderProcessingStrategy implements ProcessingStrategy {
  private readonly logger: Logger;
  private processedCount: number = 0;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  getStrategyName(): string {
    return 'OrderProcessingStrategy';
  }

  async process(event: DomainEvent): Promise<void> {
    const startTime = Date.now();
    
    this.logger.info(`🎯 Processing order event with strategy`, {
      eventType: event.eventType,
      eventId: event.eventId.value,
      aggregateId: event.aggregateId,
      strategy: this.getStrategyName()
    });

    try {
      switch (event.eventType) {
        case 'OrderCreated':
          await this.handleOrderCreated(event as OrderCreatedEvent);
          break;
        case 'OrderCancelled':
          await this.handleOrderCancelled(event as OrderCancelledEvent);
          break;
        case 'OrderCompleted':
          await this.handleOrderCompleted(event as OrderCompletedEvent);
          break;
        default:
          this.logger.warn(`Unhandled event type in OrderProcessingStrategy`, {
            eventType: event.eventType,
            eventId: event.eventId.value
          });
          return;
      }

      this.processedCount++;
      const processingTime = Date.now() - startTime;
      
      this.logger.info(`✅ Order event processed successfully`, {
        eventType: event.eventType,
        eventId: event.eventId.value,
        processingTimeMs: processingTime,
        totalProcessed: this.processedCount
      });

    } catch (error) {
      const processingTime = Date.now() - startTime;
      this.logger.error(`❌ Failed to process order event`, {
        eventType: event.eventType,
        eventId: event.eventId.value,
        processingTimeMs: processingTime,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  }

  private async handleOrderCreated(event: OrderCreatedEvent): Promise<void> {
    this.logger.info(`📝 Processing OrderCreated event`, {
      orderId: event.data.orderId,
      customerId: event.data.customerId,
      total: event.data.total,
      itemCount: event.data.items?.length || 0
    });

    // Step 1: Validate order data
    this.logger.info(`🔍 Step 1/5: Validating order data...`);
    
    // Debug: Log the actual data values
    this.logger.info(`🔍 DEBUG - Validation data:`, {
      customerId: event.data.customerId,
      customerIdType: typeof event.data.customerId,
      customerIdIsNull: event.data.customerId === null,
      total: event.data.total,
      totalType: typeof event.data.total,
      items: event.data.items,
      itemsIsArray: Array.isArray(event.data.items),
      itemsLength: event.data.items?.length
    });
    
    // Check for invalid data that should trigger retry and DLQ
    if (!event.data.customerId || event.data.customerId === null) {
      this.logger.error(`❌ VALIDATION FAILED: customerId is required`, {
        customerId: event.data.customerId,
        type: typeof event.data.customerId
      });
      throw new Error('Invalid order: customerId is required');
    }
    
    if (typeof event.data.total !== 'number' || event.data.total <= 0) {
      this.logger.error(`❌ VALIDATION FAILED: total must be a positive number`, {
        total: event.data.total,
        type: typeof event.data.total
      });
      throw new Error('Invalid order: total must be a positive number');
    }
    
    if (!Array.isArray(event.data.items) || event.data.items.length === 0) {
      this.logger.error(`❌ VALIDATION FAILED: items array is required and cannot be empty`, {
        items: event.data.items,
        isArray: Array.isArray(event.data.items),
        length: event.data.items?.length
      });
      throw new Error('Invalid order: items array is required and cannot be empty');
    }
    
    await this.simulateProcessing('order validation', 800);

    // Step 2: Check inventory
    this.logger.info(`📦 Step 2/5: Checking inventory availability...`);
    await this.simulateProcessing('inventory check', 1200);

    // Step 3: Reserve inventory
    this.logger.info(`🔒 Step 3/5: Reserving inventory...`);
    await this.simulateProcessing('inventory reservation', 600);

    // Step 4: Process payment authorization
    this.logger.info(`💳 Step 4/5: Processing payment authorization...`);
    await this.simulateProcessing('payment authorization', 1500);

    // Step 5: Send confirmation
    this.logger.info(`📧 Step 5/5: Sending order confirmation...`);
    await this.simulateProcessing('confirmation email', 400);
    
    this.logger.info(`✅ Order creation processing completed`, {
      orderId: event.data.orderId,
      status: 'confirmed'
    });
  }

  private async handleOrderCancelled(event: OrderCancelledEvent): Promise<void> {
    this.logger.info(`❌ Processing OrderCancelled event`, {
      orderId: event.data.orderId,
      reason: event.data.reason || 'No reason provided'
    });

    // Step 1: Validate cancellation
    this.logger.info(`🔍 Step 1/4: Validating cancellation request...`);
    await this.simulateProcessing('cancellation validation', 500);

    // Step 2: Restore inventory
    this.logger.info(`📦 Step 2/4: Restoring inventory...`);
    await this.simulateProcessing('inventory restoration', 800);

    // Step 3: Process refund
    this.logger.info(`💰 Step 3/4: Processing refund...`);
    await this.simulateProcessing('refund processing', 1200);

    // Step 4: Send notification
    this.logger.info(`📧 Step 4/4: Sending cancellation notification...`);
    await this.simulateProcessing('cancellation notification', 300);
    
    this.logger.info(`✅ Order cancellation processing completed`, {
      orderId: event.data.orderId,
      status: 'cancelled'
    });
  }

  private async handleOrderCompleted(event: OrderCompletedEvent): Promise<void> {
    this.logger.info(`🎉 Processing OrderCompleted event`, {
      orderId: event.data.orderId,
      completedAt: event.occurredOn
    });

    // Step 1: Update order status
    this.logger.info(`📝 Step 1/4: Updating order status...`);
    await this.simulateProcessing('status update', 400);

    // Step 2: Generate invoice
    this.logger.info(`🧾 Step 2/4: Generating invoice...`);
    await this.simulateProcessing('invoice generation', 900);

    // Step 3: Update loyalty points
    this.logger.info(`⭐ Step 3/4: Updating customer loyalty points...`);
    await this.simulateProcessing('loyalty points update', 600);

    // Step 4: Send completion notification
    this.logger.info(`📧 Step 4/4: Sending completion notification...`);
    await this.simulateProcessing('completion notification', 350);
    
    this.logger.info(`✅ Order completion processing completed`, {
      orderId: event.data.orderId,
      status: 'completed'
    });
  }

  private async simulateProcessing(operation: string, delayMs: number): Promise<void> {
    this.logger.debug(`⏳ Simulating ${operation} processing (${delayMs}ms)...`);
    await new Promise(resolve => setTimeout(resolve, delayMs));
    this.logger.debug(`✅ ${operation} completed`);
  }

  // Monitoring methods
  getTotalProcessed(): number {
    return this.processedCount;
  }
} 