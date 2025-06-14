import { IOrderRepository } from '@order/domain/repositories/IOrderRepository';
import { IOrderEventPublisher } from '@order/domain/repositories/IOrderEventPublisher';
import { Order } from '@order/domain/entities/Order';
import { Money } from '@order/domain/value-objects/Money';
import { Address } from '@order/domain/value-objects/Address';
import { OrderItem } from '@order/domain/value-objects/OrderItem';
import { CreateOrderDTO } from './CreateOrderDTO';
import { OrderResponseDTO } from './OrderResponseDTO';
import { Logger } from '@shared/application/logging/logger';
import { OrderCreatedEvent } from '@order/domain/events/OrderCreatedEvent';

export class CreateOrderUseCase {
  constructor(
    private readonly orderRepository: IOrderRepository,
    private readonly orderEventPublisher: IOrderEventPublisher,
    private readonly logger: Logger
  ) {}

  async execute(dto: CreateOrderDTO): Promise<OrderResponseDTO> {
    try {
      this.logger.info('Creating new order', { customerId: dto.customerId });

      // Create value objects
      const total = new Money(dto.total);
      const shippingAddress = new Address(dto.shippingAddress);
      const billingAddress = new Address(dto.billingAddress);
      const items = dto.items.map((item: { productId: string; quantity: number; unitPrice: number; totalPrice: number }) => 
        new OrderItem({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: new Money(item.unitPrice),
          totalPrice: new Money(item.totalPrice)
        })
      );

      // Create order
      const order = new Order({
        id: dto.id,
        customerId: dto.customerId,
        status: 'pending',
        total,
        items,
        shippingAddress,
        billingAddress
      });

      // Save order
      await this.orderRepository.save(order);

      // Publish events
      for (const event of order.events) {
        await this.orderEventPublisher.publish(event);
      }

      this.logger.info('Order created successfully', { orderId: order.id });

      // Return response
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
    } catch (error) {
      this.logger.error('Error creating order', { error, dto });
      throw error;
    }
  }
} 