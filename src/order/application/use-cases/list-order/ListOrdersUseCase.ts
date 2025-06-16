import { IOrderRepository } from '@order/domain/repositories/IOrderRepository';
import { ListOrdersDTO } from './ListOrdersDTO';
import { OrderResponseDTO } from '@order/application/use-cases/create-order/OrderResponseDTO';
import { Logger } from '@shared/application/logging/logger';

export class ListOrdersUseCase {
  constructor(
    private readonly orderRepository: IOrderRepository,
    private readonly logger: Logger
  ) {}

  async execute(dto: ListOrdersDTO): Promise<OrderResponseDTO[]> {
    try {
      this.logger.info('Listing orders', { customerId: dto.customerId });

      // Find orders
      const orders = await this.orderRepository.findByCustomerId(dto.customerId);

      this.logger.info('Orders found', { count: orders.length });

      // Return response
      return orders.map((order) => ({
        id: order.id,
        customerId: order.customerId,
        status: order.status,
        total: order.total.getValue(),
        items: order.items.map((item) => ({
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
      }));
    } catch (error) {
      this.logger.error('Error listing orders', { error, dto });
      throw error;
    }
  }
} 