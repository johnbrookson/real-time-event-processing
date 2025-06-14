import { BaseDomainEvent } from '../../../shared/domain/events/DomainEvent';
import { Order } from '../entities/Order';

export class OrderCompletedEvent extends BaseDomainEvent {
  constructor(order: Order) {
    super(
      'OrderCompleted',
      order.id,
      {
        orderId: order.id,
        customerId: order.customerId,
        total: order.total.getValue(),
        completedAt: new Date().toISOString()
      }
    );
  }
} 