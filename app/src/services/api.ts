import axios, { type AxiosInstance, type AxiosError } from 'axios';
import { toast } from 'sonner';

// Configura base URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Crea istanza axios
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Interceptor per aggiungere token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('lr_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor per gestire errori
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const message = (error.response?.data as any)?.message || 'Errore di connessione';
    
    if (error.response?.status === 401) {
      // Token scaduto o non valido
      localStorage.removeItem('lr_token');
      localStorage.removeItem('lr_user');
      window.location.href = '/login';
      toast.error('Sessione scaduta, effettua nuovamente il login');
    } else if (error.response?.status === 403) {
      toast.error('Non autorizzato');
    } else if (error.response?.status === 404) {
      toast.error('Risorsa non trovata');
    } else if (error.response?.status === 500) {
      toast.error('Errore del server');
    } else {
      toast.error(message);
    }
    
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: async (userData: {
    name: string;
    whatsapp: string;
    photo?: string;
    city: string;
    province: string;
    preferences: any[];
  }) => {
    const response = await apiClient.post('/auth/register', userData);
    if (response.data.success) {
      localStorage.setItem('lr_token', response.data.data.token);
      localStorage.setItem('lr_user', JSON.stringify(response.data.data.user));
    }
    return response.data;
  },

  login: async (whatsapp: string) => {
    const response = await apiClient.post('/auth/login', { whatsapp });
    if (response.data.success) {
      localStorage.setItem('lr_token', response.data.data.token);
      localStorage.setItem('lr_user', JSON.stringify(response.data.data.user));
    }
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('lr_token');
    localStorage.removeItem('lr_user');
  },

  getCurrentUser: async () => {
    const response = await apiClient.get('/auth/me');
    return response.data;
  },

  updateProfile: async (updates: {
    name?: string;
    photo?: string;
    preferences?: any[];
    fcmToken?: string;
  }) => {
    const response = await apiClient.put('/auth/me', updates);
    if (response.data.success) {
      localStorage.setItem('lr_user', JSON.stringify(response.data.data.user));
    }
    return response.data;
  },

  checkWhatsapp: async (whatsapp: string) => {
    const response = await apiClient.post('/auth/check-whatsapp', { whatsapp });
    return response.data;
  },

  getStoredUser: () => {
    const userStr = localStorage.getItem('lr_user');
    return userStr ? JSON.parse(userStr) : null;
  },

  getToken: () => {
    return localStorage.getItem('lr_token');
  },

  isAuthenticated: () => {
    return !!localStorage.getItem('lr_token');
  }
};

// Requests API
export const requestsAPI = {
  createRequest: async (requestData: {
    title: string;
    description: string;
    category: any;
    images?: string[];
    budget?: number;
    urgency: 'low' | 'medium' | 'high';
    expiresAt: string;
  }) => {
    const response = await apiClient.post('/requests', requestData);
    return response.data;
  },

  getFeed: async (params?: { page?: number; limit?: number; category?: string }) => {
    const response = await apiClient.get('/requests/feed', { params });
    return response.data;
  },

  getMyRequests: async (params?: { page?: number; limit?: number; status?: string }) => {
    const response = await apiClient.get('/requests/my', { params });
    return response.data;
  },

  getRequest: async (id: string) => {
    const response = await apiClient.get(`/requests/${id}`);
    return response.data;
  },

  updateRequest: async (id: string, updates: any) => {
    const response = await apiClient.put(`/requests/${id}`, updates);
    return response.data;
  },

  deleteRequest: async (id: string) => {
    const response = await apiClient.delete(`/requests/${id}`);
    return response.data;
  },

  contactRequest: async (id: string) => {
    const response = await apiClient.post(`/requests/${id}/contact`);
    return response.data;
  },

  getStats: async () => {
    const response = await apiClient.get('/requests/stats/overview');
    return response.data;
  }
};

// Notifications API
export const notificationsAPI = {
  getNotifications: async (params?: { page?: number; limit?: number; unreadOnly?: boolean }) => {
    const response = await apiClient.get('/notifications', { params });
    return response.data;
  },

  getUnreadCount: async () => {
    const response = await apiClient.get('/notifications/count');
    return response.data;
  },

  markAsRead: async (id: string) => {
    const response = await apiClient.put(`/notifications/${id}/read`);
    return response.data;
  },

  markAllAsRead: async () => {
    const response = await apiClient.put('/notifications/read-all');
    return response.data;
  },

  deleteNotification: async (id: string) => {
    const response = await apiClient.delete(`/notifications/${id}`);
    return response.data;
  }
};

// Health check
export const healthAPI = {
  check: async () => {
    const response = await apiClient.get('/health');
    return response.data;
  }
};

export default apiClient;
