import { ValueObject } from '../../../shared/domain/value-objects/ValueObject';
import { Money } from './Money';

interface OrderItemProps {
  productId: string;
  quantity: number;
  unitPrice: Money;
  totalPrice: Money;
}

export class OrderItem extends ValueObject<OrderItemProps> {
  constructor(props: OrderItemProps) {
    super(props);
    this.validate();
  }

  private validate(): void {
    if (!this.getValue().productId) {
      throw new Error('Product ID is required');
    }
    if (this.getValue().quantity <= 0) {
      throw new Error('Quantity must be greater than zero');
    }
    if (!this.getValue().unitPrice) {
      throw new Error('Unit price is required');
    }
    if (!this.getValue().totalPrice) {
      throw new Error('Total price is required');
    }
  }

  get productId(): string {
    return this.getValue().productId;
  }

  get quantity(): number {
    return this.getValue().quantity;
  }

  get unitPrice(): Money {
    return this.getValue().unitPrice;
  }

  get totalPrice(): Money {
    return this.getValue().totalPrice;
  }

  override toString(): string {
    return `${this.quantity}x ${this.productId} - ${this.totalPrice}`;
  }
} 