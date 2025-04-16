export enum OrderStatus {
    PENDING = 'pending',
    PROCESSING = 'processing',
    SHIPPED = 'shipped',
    DELIVERED = 'delivered',
    CANCELLED = 'cancelled',
    RETURNED = 'returned',
    REFUNDED = 'refunded'
  }
  
  export enum PaymentStatus {
    PENDING = 'pending',
    COMPLETED = 'completed',
    FAILED = 'failed',
    REFUNDED = 'refunded'
  }
  
  export enum PaymentMethod {
    CREDIT_CARD = 'credit_card',
    PAYPAL = 'paypal',
    BANK_TRANSFER = 'bank_transfer',
    CASH_ON_DELIVERY = 'cash_on_delivery'
  }
  
  export interface OrderItem {
    product: string;
    variant?: string;
    name: string;
    sku: string;
    price: number;
    quantity: number;
    totalPrice: number;
    image?: string;
    options?: {
      name: string;
      value: string;
    }[];
  }
  
  export interface OrderDocument {
    _id: string;
    orderNumber: string;
    user: string;
    items: OrderItem[];
    billing: {
      address: {
        fullName: string;
        addressLine1: string;
        addressLine2?: string;
        city: string;
        state: string;
        postalCode: string;
        country: string;
        phone: string;
      };
      email: string;
    };
    shipping: {
      address: {
        fullName: string;
        addressLine1: string;
        addressLine2?: string;
        city: string;
        state: string;
        postalCode: string;
        country: string;
        phone: string;
      };
      method: string;
      cost: number;
      trackingNumber?: string;
      trackingUrl?: string;
      estimatedDelivery?: Date;
    };
    payment: {
      method: PaymentMethod;
      transactionId?: string;
      status: PaymentStatus;
      amount: number;
      currency: string;
    };
    summary: {
      subtotal: number;
      tax: number;
      discount: number;
      shipping: number;
      total: number;
    };
    status: OrderStatus;
    notes?: string;
    couponCode?: string;
    discount?: {
      code: string;
      amount: number;
      type: 'percentage' | 'fixed';
    };
    invoiceUrl?: string;
    createdAt: Date;
    updatedAt: Date;
  }