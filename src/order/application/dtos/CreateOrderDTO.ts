export interface CreateOrderDTO {
  customerId: string;
  items: Array<{
    productId: string;
    quantity: number;
    price: {
      amount: number;
      currency: string;
    };
  }>;
  address: {
    street: string;
    city: string;
    state: string;
    country: string;
    zipCode: string;
  };
} 