import { Order } from '../../domain/entities/Order';

export interface IOrderMapper {
  toDomain(persistenceModel: any): Order;
  toPersistence(domainEntity: Order): any;
} 