// API client for connecting to backend services

// In production (built files), use relative paths that go through nginx proxy
// In development, use explicit localhost URLs
const getApiBase = (envVar: string | undefined, prodPath: string, devPort: string) => {
  if (envVar) return envVar;
  // Check if we're in production build (Vite sets this during build)
  if (import.meta.env.PROD) {
    return prodPath;
  }
  return `http://localhost:${devPort}`;
};

const DB_API_BASE = getApiBase(import.meta.env.VITE_DB_API_URL, '/api/products', '8000');
const STATS_API_BASE = getApiBase(import.meta.env.VITE_STATS_API_URL, '/api/stats', '8001');
const ORDERS_API_BASE = getApiBase(import.meta.env.VITE_ORDERS_API_URL, '/api/orders', '8002');

import { ProductResponse, SimilarProduct, ProductSearchResult } from '../types/product';

// Database Backend API
export const dbApi = {
  async getProducts(limit = 100, offset = 0): Promise<ProductResponse[]> {
    // In production, DB_API_BASE is '/api/products', so we need to add '/products'
    // In development, DB_API_BASE is 'http://localhost:8000', so we add '/products'
    const url = DB_API_BASE.endsWith('/') 
      ? `${DB_API_BASE}products?limit=${limit}&offset=${offset}`
      : `${DB_API_BASE}/products?limit=${limit}&offset=${offset}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch products: ${response.statusText}`);
    }
    return response.json();
  },

  async getProduct(gtin: string): Promise<ProductResponse> {
    const url = DB_API_BASE.endsWith('/')
      ? `${DB_API_BASE}products/${gtin}`
      : `${DB_API_BASE}/products/${gtin}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch product: ${response.statusText}`);
    }
    return response.json();
  },

  async getSimilarProducts(gtin: string, limit = 10): Promise<SimilarProduct[]> {
    const url = DB_API_BASE.endsWith('/')
      ? `${DB_API_BASE}products/${gtin}/similar?limit=${limit}`
      : `${DB_API_BASE}/products/${gtin}/similar?limit=${limit}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch similar products: ${response.statusText}`);
    }
    return response.json();
  },

  async searchProducts(query: string, limit = 20): Promise<ProductSearchResult[]> {
    const url = DB_API_BASE.endsWith('/')
      ? `${DB_API_BASE}search?q=${encodeURIComponent(query)}&limit=${limit}`
      : `${DB_API_BASE}/search?q=${encodeURIComponent(query)}&limit=${limit}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to search products: ${response.statusText}`);
    }
    return response.json();
  },
};

// Stats Backend API
export interface PredictionRequest {
  product_code: string;
  order_qty: number;
  sales_unit: string;
  plant: string;
  storage_location: string;
  order_dow: string;
  delivery_dow: string;
  lead_time: number;
  month: string;
  coinciding_delivery: string;
}

export interface PredictionResponse {
  n: number;
  predictions: Array<{
    prob_failure: number;
    predicted_failure: number;
  }>;
}

export const statsApi = {
  async ping(): Promise<{ status: string; model_loaded: boolean }> {
    const response = await fetch(`${STATS_API_BASE}/ping`);
    if (!response.ok) {
      throw new Error(`Stats API ping failed: ${response.statusText}`);
    }
    return response.json();
  },

  async predict(data: PredictionRequest[]): Promise<PredictionResponse> {
    const response = await fetch(`${STATS_API_BASE}/predict`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: response.statusText }));
      throw new Error(`Prediction failed: ${error.error || response.statusText}`);
    }
    return response.json();
  },
};

// Orders API
import { Order } from '../types/order';

export const ordersApi = {
  async getOrders(limit = 100, offset = 0, status?: string): Promise<Order[]> {
    const statusParam = status && status !== 'all' ? `&status=${status}` : '';
    const url = ORDERS_API_BASE.endsWith('/')
      ? `${ORDERS_API_BASE}orders?limit=${limit}&offset=${offset}${statusParam}`
      : `${ORDERS_API_BASE}/orders?limit=${limit}&offset=${offset}${statusParam}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch orders: ${response.statusText}`);
    }
    return response.json();
  },

  async getOrder(orderId: string): Promise<Order> {
    const url = ORDERS_API_BASE.endsWith('/')
      ? `${ORDERS_API_BASE}orders/${orderId}`
      : `${ORDERS_API_BASE}/orders/${orderId}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch order: ${response.statusText}`);
    }
    return response.json();
  },

  async getOrdersCount(status?: string): Promise<{ count: number }> {
    const statusParam = status && status !== 'all' ? `?status=${status}` : '';
    const url = ORDERS_API_BASE.endsWith('/')
      ? `${ORDERS_API_BASE}orders/count${statusParam}`
      : `${ORDERS_API_BASE}/orders/count${statusParam}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch orders count: ${response.statusText}`);
    }
    return response.json();
  },
};
