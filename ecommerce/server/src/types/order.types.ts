import { Types } from 'mongoose';

export enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confiment',
  PROCESSING = 'processing',
  SHIPPED = 'shipped',
  OUT_FOR_DELIVERY = 'out_for_delivery',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
  RETURNED = 'returned',
  REFUNDED = 'refunded',
  FAILED ='failed'
}

export enum PaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded',
  PARTIALLY_REFUNDED = 'partially_refunded',
  REFUND_PENDING = 'refund_pending',
  EXPIRED = 'expired'
}

export enum PaymentMethod {
  CREDIT_CARD = 'credit_card',
  DEBIT_CARD = 'debit_card',
  NET_BANKING = 'net_banking',
  UPI = 'upi',
  WALLET = 'wallet',
  CASH_ON_DELIVERY = 'cash_on_delivery',
  BANK_TRANSFER = 'bank_transfer'
}

export enum ShippingStatus {
  NOT_SHIPPED = 'not_shipped',
  PREPARING = 'preparing',
  READY_TO_SHIP = 'ready_to_ship',
  SHIPPED = 'shipped',
  IN_TRANSIT = 'in_transit',
  OUT_FOR_DELIVERY = 'out_for_delivery',
  DELIVERED = 'delivered',
  RETURNED = 'returned',
  LOST = 'lost'
}

export interface Address {
  fullName: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone: string;
}

export interface OrderItem {
  product: Types.ObjectId;
  variant?: Types.ObjectId;
  name: string;
  sku: string;
  price: number;
  discountedPrice: number;
  quantity: number;
  totalPrice: number;
  image?: string;
  options?: Array<{
    name: string;
    value: string;
  }>;
}


export interface PaymentDetails {
  method: PaymentMethod;
  status: PaymentStatus;
  transactionId?: string;
  stripePaymentIntentId?: string;
  stripeSessionId?: string;
  paidAmount?: number;
  paidAt?: Date;
  failureReason?: string;
  refundAmount?: number;
  refundedAt?: Date;
  refundReason?: string;
}

export interface ShippingDetails {
  carrier?: string;
  trackingNumber?: string;
  estimatedDelivery?: Date;
  actualDelivery?: Date;
  shippingCost: number;
  status: ShippingStatus;
  shippedAt?: Date;
  deliveredAt?: Date;
}

export interface StatusHistoryEntry {
  status: OrderStatus;
  timestamp: Date;
  comment?: string;
  updatedBy?: Types.ObjectId;
}

export interface PricingBreakdown {
  subtotal: number;
  discount: number;
  tax: number;
  shipping: number;
  total: number;
}

export interface CouponDetails {
  code: string;
  discountAmount: number;
  discountType: 'percentage' | 'fixed';
}


export interface GuestDetails {
  email: string;
  phone: string;
}

export interface OrderDocument extends Document {
  _id: Types.ObjectId;
  orderNumber: string;
  user: Types.ObjectId;
  guest?: GuestDetails;
  items: OrderItem[];
  status: OrderStatus;
  statusHistory: StatusHistoryEntry[];
  shippingAddress: Address;
  billingAddress: Address;
  pricing: PricingBreakdown;
  payment: PaymentDetails;
  shipping: ShippingDetails;
  coupon?: CouponDetails;
  notes?: string;
  customerNotes?: string;
  tags?: string[];
  metadata?: Map<string, any>;
  cancelledAt?: Date;
  cancellationReason?: string;
  cancelledBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  

  orderAge?: number;
  

  updateStatus(
    newStatus: OrderStatus, 
    comment?: string, 
    updatedBy?: Types.ObjectId
  ): Promise<OrderDocument>;
  calculateTotals(): PricingBreakdown;
}


export interface CreateOrderDTO {
  items: Array<{
    productId: string;
    variantId?: string;
    quantity: number;
  }>;
  shippingAddress: Address;
  billingAddress?: Address; 
  paymentMethod: PaymentMethod;
  customerNotes?: string;
  couponCode?: string;
}

export interface ConfirmOrderDTO {
  orderId: string;
  paymentIntentId?: string;
  sessionId?: string;
  transactionId?: string;
}

export interface UpdateOrderStatusDTO {
  status: OrderStatus;
  comment?: string;
  trackingNumber?: string;
  carrier?: string;
}

export interface OrderListQuery {
  page?: number;
  limit?: number;
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  startDate?: string;
  endDate?: string;
  search?: string;
  sortBy?: 'createdAt' | 'total' | 'status';
  sortOrder?: 'asc' | 'desc';
}


export interface OrderSummary {
  _id: string;
  orderNumber: string;
  status: OrderStatus;
  total: number;
  itemCount: number;
  createdAt: Date;
  paymentStatus: PaymentStatus;
  shippingStatus: ShippingStatus;
}