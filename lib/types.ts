export type UserRole = 'admin' | 'cashier';

export interface Profile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  is_archived: boolean;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  color: string;
  created_at: string;
}

export interface Product {
  id: string;
  name: string;
  category_id: string | null;
  price: number;
  unit_of_measure: string;
  tax: number;
  description: string | null;
  image_url: string | null;
  created_at: string;
}

export interface Floor {
  id: string;
  name: string;
  created_at: string;
}

export interface Table {
  id: string;
  floor_id: string;
  table_number: string;
  seats: number;
  is_active: boolean;
  created_at: string;
}

export interface Session {
  id: string;
  opened_by: string;
  opened_at: string;
  closed_at: string | null;
  opening_balance: number;
  closing_balance: number | null;
  status: 'open' | 'closed';
}

export interface Customer {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  created_at: string;
}

export type OrderStatus = 'draft' | 'paid' | 'cancelled';
export type PaymentMethodName = 'cash' | 'card' | 'upi';

export interface Order {
  id: string;
  session_id: string;
  table_id: string | null;
  customer_id: string | null;
  order_number: string;
  subtotal: number;
  tax: number;
  discount_amount: number;
  total: number;
  status: OrderStatus;
  payment_method: PaymentMethodName | null;
  payment_reference: string | null;
  created_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  quantity: number;
  unit_price: number;
  tax_rate: number;
  total_price: number;
  is_completed_in_kitchen: boolean;
  created_at: string;
}

export type KDSTicketStatus = 'to_cook' | 'preparing' | 'completed';

export interface KDSTicket {
  id: string;
  order_id: string;
  status: KDSTicketStatus;
  created_at: string;
}

export interface Coupon {
  id: string;
  code: string;
  discount_type: 'percentage' | 'fixed';
  value: number;
  is_active: boolean;
  created_at: string;
}

export interface Promotion {
  id: string;
  name: string;
  type: 'product' | 'order';
  trigger_product_id: string | null;
  min_quantity: number | null;
  min_order_amount: number | null;
  discount_type: 'percentage' | 'fixed';
  value: number;
  is_active: boolean;
  created_at: string;
}

export interface PaymentMethod {
  id: string;
  name: PaymentMethodName;
  is_enabled: boolean;
  upi_id: string | null;
  created_at: string;
}
