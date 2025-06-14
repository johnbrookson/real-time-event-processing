import { Order, OrderStatus } from '../Order';
import { OrderCreatedEvent } from '../../events/OrderCreatedEvent';
import { OrderCancelledEvent } from '../../events/OrderCancelledEvent';
import { OrderCompletedEvent } from '../../events/OrderCompletedEvent';
import { Money } from '../../value-objects/Money';
import { Address } from '../../value-objects/Address';
import { OrderItem } from '../../value-objects/OrderItem';

describe('Order Entity', () => {
  const orderId = '123';
  const customerId = '456';
  const total = new Money(100);
  const items = [
    new OrderItem({
      productId: '789',
      quantity: 2,
      unitPrice: new Money(50),
      totalPrice: new Money(100)
    })
  ];
  const shippingAddress = new Address({
    street: 'Rua A',
    number: '123',
    neighborhood: 'Centro',
    city: 'São Paulo',
    state: 'SP',
    country: 'Brasil',
    zipCode: '01234-567'
  });
  const billingAddress = new Address({
    street: 'Rua B',
    number: '456',
    neighborhood: 'Centro',
    city: 'São Paulo',
    state: 'SP',
    country: 'Brasil',
    zipCode: '01234-567'
  });

  it('should create a new order', () => {
    const order = new Order({
      id: orderId,
      customerId,
      status: 'pending',
      total,
      items,
      shippingAddress,
      billingAddress
    });

    order.create();

    expect(order.id).toBe(orderId);
    expect(order.customerId).toBe(customerId);
    expect(order.status).toBe('pending');
    expect(order.total).toBe(total);
    expect(order.items).toEqual(items);
    expect(order.shippingAddress).toBe(shippingAddress);
    expect(order.billingAddress).toBe(billingAddress);
    expect(order.events).toHaveLength(1);
    expect(order.events[0]).toBeInstanceOf(OrderCreatedEvent);
  });

  it('should cancel an order', () => {
    const order = new Order({
      id: orderId,
      customerId,
      status: 'pending',
      total,
      items,
      shippingAddress,
      billingAddress
    });

    order.cancel('Customer requested cancellation');

    expect(order.status).toBe('cancelled');
    expect(order.events).toHaveLength(1);
    expect(order.events[0]).toBeInstanceOf(OrderCancelledEvent);
  });

  it('should complete an order', () => {
    const order = new Order({
      id: orderId,
      customerId,
      status: 'pending',
      total,
      items,
      shippingAddress,
      billingAddress
    });

    order.complete();

    expect(order.status).toBe('completed');
    expect(order.events).toHaveLength(1);
    expect(order.events[0]).toBeInstanceOf(OrderCompletedEvent);
  });

  it('should not cancel a completed order', () => {
    const order = new Order({
      id: orderId,
      customerId,
      status: 'completed',
      total,
      items,
      shippingAddress,
      billingAddress
    });

    expect(() => order.cancel('Customer requested cancellation')).toThrow('Cannot cancel a completed order');
  });

  it('should not complete a cancelled order', () => {
    const order = new Order({
      id: orderId,
      customerId,
      status: 'cancelled',
      total,
      items,
      shippingAddress,
      billingAddress
    });

    expect(() => order.complete()).toThrow('Cannot complete a cancelled order');
  });

  it('should not cancel an already cancelled order', () => {
    const order = new Order({
      id: orderId,
      customerId,
      status: 'cancelled',
      total,
      items,
      shippingAddress,
      billingAddress
    });

    expect(() => order.cancel('Customer requested cancellation')).toThrow('Order is already cancelled');
  });

  it('should not complete an already completed order', () => {
    const order = new Order({
      id: orderId,
      customerId,
      status: 'completed',
      total,
      items,
      shippingAddress,
      billingAddress
    });

    expect(() => order.complete()).toThrow('Order is already completed');
  });
}); 