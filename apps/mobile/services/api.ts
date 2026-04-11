import axios, { InternalAxiosRequestConfig } from 'axios';
import { API_BASE_URL } from '../constants/api';
import { useAuthStore } from '../store/auth.store';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

// 요청 인터셉터: accessToken 주입
apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const { accessToken } = useAuthStore.getState();
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// 응답 인터셉터: 401이면 refresh 시도
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const { refreshToken, setTokens, logout } = useAuthStore.getState();

      if (!refreshToken) {
        await logout();
        return Promise.reject(error);
      }

      try {
        const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refreshToken,
        });
        const { accessToken: newAccess, refreshToken: newRefresh } =
          response.data as { accessToken: string; refreshToken: string };

        await setTokens(newAccess, newRefresh);
        originalRequest.headers.Authorization = `Bearer ${newAccess}`;
        return apiClient(originalRequest);
      } catch {
        await logout();
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  },
);

// Food Items API
export const foodItemsApi = {
  getAll: (params?: Record<string, string | boolean | undefined>) =>
    apiClient.get('/food-items', { params }),

  getOne: (id: string) => apiClient.get(`/food-items/${id}`),

  create: (data: unknown) => apiClient.post('/food-items', data),

  update: (id: string, data: unknown) =>
    apiClient.patch(`/food-items/${id}`, data),

  delete: (id: string) => apiClient.delete(`/food-items/${id}`),
};

// Food Items Stats API
export const foodItemsStatsApi = {
  getMonthlyStats: (year: number, month: number) =>
    apiClient.get('/food-items/stats/monthly', { params: { year, month } }),
};

// Refrigerators API
export const refrigeratorsApi = {
  getAll: () => apiClient.get('/refrigerators'),
  create: (data: unknown) => apiClient.post('/refrigerators', data),
  update: (id: string, data: unknown) => apiClient.patch(`/refrigerators/${id}`, data),
  delete: (id: string) => apiClient.delete(`/refrigerators/${id}`),
};

// Receipt API
export const receiptApi = {
  parse: (ocrText: string) =>
    apiClient.post('/receipt/parse', { ocrText }),
};

// Food Items Bulk API
export const foodItemsBulkApi = {
  bulkCreate: (items: unknown[]) =>
    apiClient.post('/food-items/bulk', { items }),
};

// Shelf Life API
export const shelfLifeApi = {
  getAll: () => apiClient.get('/shelf-life'),
  search: (query: string) => apiClient.get('/shelf-life/search', { params: { q: query } }),
};

// Shopping API
export const shoppingApi = {
  getRecommendations: () =>
    apiClient.get('/shopping/recommendations'),

  getLists: (params?: { isCompleted?: string }) =>
    apiClient.get('/shopping/lists', { params }),

  getList: (id: string) =>
    apiClient.get(`/shopping/lists/${id}`),

  createList: (data: unknown) =>
    apiClient.post('/shopping/lists', data),

  createListFromRecommendations: () =>
    apiClient.post('/shopping/lists/from-recommendations'),

  updateList: (id: string, data: unknown) =>
    apiClient.patch(`/shopping/lists/${id}`, data),

  deleteList: (id: string) =>
    apiClient.delete(`/shopping/lists/${id}`),

  addItem: (listId: string, data: unknown) =>
    apiClient.post(`/shopping/lists/${listId}/items`, data),

  updateItem: (listId: string, itemId: string, data: unknown) =>
    apiClient.patch(`/shopping/lists/${listId}/items/${itemId}`, data),

  deleteItem: (listId: string, itemId: string) =>
    apiClient.delete(`/shopping/lists/${listId}/items/${itemId}`),

  purchaseItem: (listId: string, itemId: string, data?: unknown) =>
    apiClient.post(`/shopping/lists/${listId}/items/${itemId}/purchase`, data ?? {}),
};

// Auth API
export const authApi = {
  refresh: (refreshToken: string) =>
    apiClient.post('/auth/refresh', { refreshToken }),

  logout: () => apiClient.delete('/auth/logout'),

  getMe: () => apiClient.get('/auth/me'),

  updatePushToken: (pushToken: string) =>
    apiClient.post('/auth/push-token', { pushToken }),
};
