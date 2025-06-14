import { BaseDomainEvent } from '../../../shared/domain/events/DomainEvent';
import { Order } from '../entities/Order';

export class OrderCreatedEvent extends BaseDomainEvent {
  constructor(order: Order) {
    super(
      'OrderCreated',
      order.id,
      {
        orderId: order.id,
        customerId: order.customerId,
        total: order.total.getValue(),
        items: order.items.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.unitPrice.getValue()
        }))
      }
    );
  }
} 