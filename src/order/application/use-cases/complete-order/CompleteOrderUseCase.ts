import { IOrderRepository } from '@order/domain/repositories/IOrderRepository';
import { IOrderEventPublisher } from '@order/domain/repositories/IOrderEventPublisher';
import { CompleteOrderDTO } from './CompleteOrderDTO';
import { OrderResponseDTO } from '@order/application/use-cases/create-order/OrderResponseDTO';
import { Logger } from '@shared/application/logging/logger';

export class CompleteOrderUseCase {
  constructor(
    private readonly orderRepository: IOrderRepository,
    private readonly orderEventPublisher: IOrderEventPublisher,
    private readonly logger: Logger
  ) {}

  async execute(dto: CompleteOrderDTO): Promise<OrderResponseDTO> {
    try {
      this.logger.info('Completing order', { orderId: dto.orderId });

      // Find order
      const order = await this.orderRepository.findById(dto.orderId);
      if (!order) {
        throw new Error(`Order not found: ${dto.orderId}`);
      }

      // Complete order
      order.complete();

      // Update order
      await this.orderRepository.update(order);

      // Publish events
      for (const event of order.events) {
        await this.orderEventPublisher.publish(event);
      }

      this.logger.info('Order completed successfully', { orderId: order.id });

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
      this.logger.error('Error completing order', { error, dto });
      throw error;
    }
  }
} 