import { Order } from '../../domain/entities/Order';
import { IOrderRepository } from '../../domain/repositories/IOrderRepository';
import { OrderModel } from './OrderModel';
import { IOrderMapper } from '../mappers/IOrderMapper';

export class PostgresOrderRepository implements IOrderRepository {
  constructor(private readonly orderMapper: IOrderMapper) {}

  async save(order: Order): Promise<void> {
    try {
      const orderData = this.orderMapper.toPersistence(order);
      await OrderModel.create(orderData);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to save order: ${errorMessage}`);
    }
  }

  async findById(id: string): Promise<Order | null> {
    try {
      const orderModel = await OrderModel.findByPk(id);
      if (!orderModel) {
        return null;
      }
      return this.orderMapper.toDomain(orderModel);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to find order: ${errorMessage}`);
    }
  }

  async findByCustomerId(customerId: string): Promise<Order[]> {
    try {
      const orderModels = await OrderModel.findAll({
        where: { customerId }
      });
      return orderModels.map(model => this.orderMapper.toDomain(model));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to find orders by customer ID: ${errorMessage}`);
    }
  }

  async update(order: Order): Promise<void> {
    try {
      const orderData = this.orderMapper.toPersistence(order);
      await OrderModel.update(orderData, {
        where: { id: order.id }
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to update order: ${errorMessage}`);
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await OrderModel.destroy({
        where: { id }
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to delete order: ${errorMessage}`);
    }
  }
} 