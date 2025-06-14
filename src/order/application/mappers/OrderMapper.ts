import { Order } from '@order/domain/entities/Order';
import { OrderModel } from '@order/infrastructure/persistence/OrderModel';
import { Money } from '@order/domain/value-objects/Money';
import { Address } from '@order/domain/value-objects/Address';
import { OrderItem } from '@order/domain/value-objects/OrderItem';

export class OrderMapper {
  toDomain(raw: OrderModel): Order {
    // Create value objects from raw data
    const total = new Money(raw.total);
    
    const shippingAddress = new Address({
      street: raw.shippingAddress.street,
      number: raw.shippingAddress.number,
      complement: raw.shippingAddress.complement,
      neighborhood: raw.shippingAddress.neighborhood,
      city: raw.shippingAddress.city,
      state: raw.shippingAddress.state,
      country: raw.shippingAddress.country,
      zipCode: raw.shippingAddress.zipCode
    });

    const billingAddress = new Address({
      street: raw.billingAddress.street,
      number: raw.billingAddress.number,
      complement: raw.billingAddress.complement,
      neighborhood: raw.billingAddress.neighborhood,
      city: raw.billingAddress.city,
      state: raw.billingAddress.state,
      country: raw.billingAddress.country,
      zipCode: raw.billingAddress.zipCode
    });

    const items = raw.items.map(item => new OrderItem({
      productId: item.productId,
      quantity: item.quantity,
      unitPrice: new Money(item.unitPrice),
      totalPrice: new Money(item.totalPrice)
    }));

    // Create Order entity using constructor (not static create method)
    return new Order({
      id: raw.id,
      customerId: raw.customerId,
      status: raw.status as 'pending' | 'completed' | 'cancelled',
      total,
      items,
      shippingAddress,
      billingAddress
    });
  }

  toPersistence(order: Order): Partial<OrderModel> {
    return {
      id: order.id,
      customerId: order.customerId,
      status: order.status,
      total: order.total.getValue(),
      items: order.items.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice.getValue(),
        totalPrice: item.totalPrice.getValue()
      })),
      shippingAddress: {
        street: order.shippingAddress.street,
        number: order.shippingAddress.number,
        complement: order.shippingAddress.complement,
        neighborhood: order.shippingAddress.neighborhood,
        city: order.shippingAddress.city,
        state: order.shippingAddress.state,
        country: order.shippingAddress.country,
        zipCode: order.shippingAddress.zipCode
      },
      billingAddress: {
        street: order.billingAddress.street,
        number: order.billingAddress.number,
        complement: order.billingAddress.complement,
        neighborhood: order.billingAddress.neighborhood,
        city: order.billingAddress.city,
        state: order.billingAddress.state,
        country: order.billingAddress.country,
        zipCode: order.billingAddress.zipCode
      }
    };
  }
} 