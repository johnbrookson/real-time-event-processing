import { IOrderRepository } from '../../domain/repositories/IOrderRepository';
import { Order } from '../../domain/entities/Order';
import { OrderModel } from '../persistence/OrderModel';
import { OrderMapper } from '../mappers/OrderMapper';
import { Logger } from '../../../shared/application/logging/logger';

export class PostgresOrderRepository implements IOrderRepository {
  constructor(
    private readonly logger: Logger,
    private readonly orderModel: typeof OrderModel,
    private readonly orderMapper: OrderMapper
  ) {}

  async findById(id: string): Promise<Order | null> {
    try {
      const orderModel = await this.orderModel.findByPk(id);
      if (!orderModel) {
        return null;
      }
      return this.orderMapper.toDomain(orderModel);
    } catch (error) {
      this.logger.error('Error finding order by ID', { error, id });
      throw error;
    }
  }

  async save(order: Order): Promise<void> {
    try {
      const orderData = this.orderMapper.toPersistence(order);
      await this.orderModel.create(orderData);
    } catch (error) {
      this.logger.error('Error saving order', { error, order });
      throw error;
    }
  }

  async update(order: Order): Promise<void> {
    try {
      const orderData = this.orderMapper.toPersistence(order);
      await this.orderModel.update(orderData, {
        where: { id: order.id }
      });
    } catch (error) {
      this.logger.error('Error updating order', { error, order });
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await this.orderModel.destroy({
        where: { id }
      });
    } catch (error) {
      this.logger.error('Error deleting order', { error, id });
      throw error;
    }
  }

  async findByCustomerId(customerId: string): Promise<Order[]> {
    try {
      const orderModels = await this.orderModel.findAll({
        where: { customerId }
      });
      return orderModels.map(model => this.orderMapper.toDomain(model));
    } catch (error) {
      this.logger.error('Error finding orders by customer ID', { error, customerId });
      throw error;
    }
  }
} 