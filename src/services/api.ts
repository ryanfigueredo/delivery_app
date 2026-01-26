import axios from 'axios';
import Constants from 'expo-constants';
import { authService } from './auth';

// Usar variáveis de ambiente do Expo
const API_BASE_URL = Constants.expoConfig?.extra?.apiBaseUrl || 'https://delivery-back-eosin.vercel.app';
const API_KEY = Constants.expoConfig?.extra?.apiKey || '';
const TENANT_ID = Constants.expoConfig?.extra?.tenantId || 'tamboril-burguer'; // Default: Tamboril Burguer (pode ser alterado)

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'X-API-Key': API_KEY,
    'X-Tenant-Id': TENANT_ID,
    'Content-Type': 'application/json',
  },
});

// Interceptor para adicionar autenticação do usuário nas requisições
api.interceptors.request.use(async (config) => {
  const user = await authService.getUser();
  const credentials = await authService.getCredentials();
  
  // Se tiver usuário autenticado, adicionar credenciais no header
  if (user && credentials) {
    // Usar Basic Auth para autenticação
    // Em React Native, precisamos usar uma biblioteca ou fazer manualmente
    const authString = btoa(`${credentials.username}:${credentials.password}`);
    config.headers.Authorization = `Basic ${authString}`;
    
    // Também adicionar informações do usuário nos headers
    config.headers['X-User-Id'] = user.id;
    if (user.tenant_id) {
      config.headers['X-Tenant-Id'] = user.tenant_id;
    }
  }
  
  return config;
});

// Função btoa para React Native (base64 encode)
function btoa(str: string): string {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(str, 'binary').toString('base64');
  }
  // Fallback para ambiente React Native
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
  let output = '';
  for (let i = 0; i < str.length; i += 3) {
    const a = str.charCodeAt(i);
    const b = str.charCodeAt(i + 1) || 0;
    const c = str.charCodeAt(i + 2) || 0;
    const bitmap = (a << 16) | (b << 8) | c;
    output += chars.charAt((bitmap >> 18) & 63);
    output += chars.charAt((bitmap >> 12) & 63);
    output += chars.charAt((bitmap >> 6) & 63);
    output += chars.charAt(bitmap & 63);
  }
  return output;
}

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

  // Estatísticas e KPIs
  async getStats(): Promise<DashboardStats> {
    try {
      const response = await api.get<{ success: boolean; stats: DashboardStats }>('/api/admin/stats');
      if (response.data.success && response.data.stats) {
        return response.data.stats;
      }
      throw new Error('Resposta inválida da API');
    } catch (error: any) {
      if (error.response) {
        // Erro da API (404, 401, etc)
        throw new Error(`Erro ${error.response.status}: ${error.response.data?.error || error.response.statusText}`);
      } else if (error.request) {
        // Requisição feita mas sem resposta
        throw new Error('Sem resposta do servidor. Verifique sua conexão.');
      } else {
        // Erro ao configurar a requisição
        throw new Error(`Erro: ${error.message}`);
      }
    }
  },
};

export interface DashboardStats {
  today: {
    orders: number;
    revenue: number;
    revenueFormatted: string;
  };
  week: {
    orders: number;
    revenue: number;
    revenueFormatted: string;
    ordersChange: number;
    revenueChange: number;
  };
  pendingOrders: number;
  dailyStats: Array<{
    day: string;
    orders: number;
    revenue: number;
  }>;
  totalRestaurants?: number;
}

export interface PriorityConversation {
  phone: string;
  phoneFormatted: string;
  whatsappUrl: string;
  waitTime: number; // minutos
  timestamp: number;
  lastMessage: number;
}
