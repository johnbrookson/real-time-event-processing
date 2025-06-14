export interface OrderResponseDTO {
  id: string;
  customerId: string;
  status: string;
  total: {
    amount: number;
    currency: string;
  };
  address: {
    street: string;
    city: string;
    state: string;
    country: string;
    zipCode: string;
  };
  items: Array<{
    productId: string;
    quantity: number;
    price: {
      amount: number;
      currency: string;
    };
  }>;
  createdAt: Date;
  updatedAt: Date;
} 