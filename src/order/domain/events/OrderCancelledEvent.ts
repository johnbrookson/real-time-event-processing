import { BaseDomainEvent } from '../../../shared/domain/events/DomainEvent';
import { Order } from '../entities/Order';

export class OrderCancelledEvent extends BaseDomainEvent {
  constructor(order: Order, reason: string) {
    super(
      'OrderCancelled',
      order.id,
      {
        orderId: order.id,
        customerId: order.customerId,
        reason,
        cancelledAt: new Date().toISOString()
      }
    );
  }
} 