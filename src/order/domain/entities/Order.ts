import { Money } from '../value-objects/Money';
import { Address } from '../value-objects/Address';
import { OrderItem } from '../value-objects/OrderItem';
import { OrderCreatedEvent } from '../events/OrderCreatedEvent';
import { OrderCancelledEvent } from '../events/OrderCancelledEvent';
import { OrderCompletedEvent } from '../events/OrderCompletedEvent';
import { DomainEvent } from '../../../shared/domain/events/DomainEvent';

export type OrderStatus = 'pending' | 'completed' | 'cancelled';

export interface OrderProps {
  id: string;
  customerId: string;
  status: OrderStatus;
  total: Money;
  items: OrderItem[];
  shippingAddress: Address;
  billingAddress: Address;
}

export class Order {
  private readonly _id: string;
  private readonly _customerId: string;
  private _status: OrderStatus;
  private readonly _total: Money;
  private readonly _items: OrderItem[];
  private readonly _shippingAddress: Address;
  private readonly _billingAddress: Address;
  private _events: DomainEvent[] = [];

  constructor(props: OrderProps) {
    this._id = props.id;
    this._customerId = props.customerId;
    this._status = props.status;
    this._total = props.total;
    this._items = props.items;
    this._shippingAddress = props.shippingAddress;
    this._billingAddress = props.billingAddress;
  }

  get id(): string {
    return this._id;
  }

  get customerId(): string {
    return this._customerId;
  }

  get status(): OrderStatus {
    return this._status;
  }

  get total(): Money {
    return this._total;
  }

  get items(): OrderItem[] {
    return this._items;
  }

  get shippingAddress(): Address {
    return this._shippingAddress;
  }

  get billingAddress(): Address {
    return this._billingAddress;
  }

  get events(): DomainEvent[] {
    return this._events;
  }

  create(): void {
    this._status = 'pending';
    this._events.push(new OrderCreatedEvent(this));
  }

  cancel(reason: string): void {
    if (this._status === 'cancelled') {
      throw new Error('Order is already cancelled');
    }
    if (this._status === 'completed') {
      throw new Error('Cannot cancel a completed order');
    }

    this._status = 'cancelled';
    this._events.push(new OrderCancelledEvent(this, reason));
  }

  complete(): void {
    if (this._status === 'completed') {
      throw new Error('Order is already completed');
    }
    if (this._status === 'cancelled') {
      throw new Error('Cannot complete a cancelled order');
    }

    this._status = 'completed';
    this._events.push(new OrderCompletedEvent(this));
  }
} 