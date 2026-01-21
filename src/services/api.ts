import axios from 'axios';
import Constants from 'expo-constants';

// Usar variáveis de ambiente do Expo
const API_BASE_URL = Constants.expoConfig?.extra?.apiBaseUrl || 'https://delivery-back-eosin.vercel.app';
const API_KEY = Constants.expoConfig?.extra?.apiKey || '';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'X-API-Key': API_KEY,
    'Content-Type': 'application/json',
  },
});

export interface StoreStatus {
  isOpen: boolean;
  nextOpenTime: string | null;
  message: string | null;
  lastUpdated: string;
}

export interface StoreStatusUpdate {
  isOpen: boolean;
  nextOpenTime?: string | null;
  message?: string | null;
}

export interface Order {
  id: string;
  customer_name: string;
  customer_phone: string;
  items: OrderItem[];
  total_price: number;
  status: 'pending' | 'printed' | 'finished' | 'out_for_delivery';
  created_at: string;
  display_id?: string;
  daily_sequence?: number;
  order_type?: string;
  delivery_address?: string;
}

export interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
  available: boolean;
}

export interface MenuItemUpdate {
  id: string;
  name?: string;
  price?: number;
  available?: boolean;
}

export const apiService = {
  // Store Status
  async getStoreStatus(): Promise<StoreStatus> {
    const response = await api.get<StoreStatus>('/api/admin/store-hours');
    return response.data;
  },

  async updateStoreStatus(status: StoreStatusUpdate): Promise<StoreStatus> {
    const response = await api.post<{ success: boolean; status: StoreStatus }>('/api/admin/store-hours', status);
    return response.data.status;
  },

  // Orders
  async getAllOrders(page = 1, limit = 20): Promise<{ orders: Order[]; pagination: any }> {
    const response = await api.get<{ orders: Order[]; pagination: any }>(`/api/orders?page=${page}&limit=${limit}`);
    return response.data;
  },

  async markOrderOutForDelivery(orderId: string): Promise<void> {
    await api.patch(`/api/orders/${orderId}/mark-out-for-delivery`);
  },

  async notifyDelivery(orderId: string): Promise<void> {
    await api.post(`/api/orders/${orderId}/notify-delivery`, {});
  },

  // Menu
  async getMenu(): Promise<MenuItem[]> {
    const response = await api.get<{ items: MenuItem[] }>('/api/admin/menu');
    return response.data.items;
  },

  async updateMenuItem(item: MenuItemUpdate): Promise<MenuItem> {
    const response = await api.put<{ success: boolean; item: MenuItem }>('/api/admin/menu', item);
    return response.data.item;
  },

  // Conversas Prioritárias (Atendimento)
  async getPriorityConversations(): Promise<PriorityConversation[]> {
    const response = await api.get<{ conversations: PriorityConversation[]; total: number }>('/api/admin/priority-conversations');
    return response.data.conversations;
  },
};

export interface PriorityConversation {
  phone: string;
  phoneFormatted: string;
  whatsappUrl: string;
  waitTime: number; // minutos
  timestamp: number;
  lastMessage: number;
}
