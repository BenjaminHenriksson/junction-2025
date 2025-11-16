export type OrderStatus = 'support_required' | 'action_required' | 'ai_resolving' | 'completed';

export interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  sku: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  customer: string;
  destination: string;
  status: OrderStatus;
  items: OrderItem[];
  totalValue: number;
  createdAt: string;
  notes?: string;
  aiSummary?: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai' | 'system' | 'customer';
  content: string;
  timestamp: string;
}