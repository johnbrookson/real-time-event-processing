import { Order, OrderStatus } from '../../domain/entities/Order';
import { OrderModel } from '../persistence/OrderModel';
import { Money } from '../../domain/value-objects/Money';
import { Address } from '../../domain/value-objects/Address';
import { OrderItem } from '../../domain/value-objects/OrderItem';
import { IOrderMapper } from './IOrderMapper';

export class OrderMapper implements IOrderMapper {
  toDomain(model: OrderModel): Order {
    // Create value objects from raw data
    const total = new Money(model.total);
    
    const shippingAddress = new Address({
      street: model.shippingAddress.street,
      number: model.shippingAddress.number,
      complement: model.shippingAddress.complement,
      neighborhood: model.shippingAddress.neighborhood,
      city: model.shippingAddress.city,
      state: model.shippingAddress.state,
      zipCode: model.shippingAddress.zipCode,
      country: model.shippingAddress.country
    });

    const billingAddress = new Address({
      street: model.billingAddress.street,
      number: model.billingAddress.number,
      complement: model.billingAddress.complement,
      neighborhood: model.billingAddress.neighborhood,
      city: model.billingAddress.city,
      state: model.billingAddress.state,
      zipCode: model.billingAddress.zipCode,
      country: model.billingAddress.country
    });

    const items = model.items.map(item => new OrderItem({
      productId: item.productId,
      quantity: item.quantity,
      unitPrice: new Money(item.unitPrice),
      totalPrice: new Money(item.totalPrice)
    }));

    // Create Order entity
    return new Order({
      id: model.id,
      customerId: model.customerId,
      status: model.status as OrderStatus,
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
        zipCode: order.shippingAddress.zipCode,
        country: order.shippingAddress.country
      },
      billingAddress: {
        street: order.billingAddress.street,
        number: order.billingAddress.number,
        complement: order.billingAddress.complement,
        neighborhood: order.billingAddress.neighborhood,
        city: order.billingAddress.city,
        state: order.billingAddress.state,
        zipCode: order.billingAddress.zipCode,
        country: order.billingAddress.country
      }
    };
  }
} 