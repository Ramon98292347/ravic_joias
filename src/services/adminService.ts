import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('admin_token');
      window.location.href = '/admin/login';
    }
    return Promise.reject(error);
  }
);

const adminService = {
  // Auth
  login: async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    if (response.data.token) {
      localStorage.setItem('admin_token', response.data.token);
    }
    return response.data;
  },

  register: async (email: string, password: string, masterPassword: string, name?: string, role?: string) => {
    const response = await api.post('/auth/register', { email, password, masterPassword, name, role });
    return response.data;
  },

  logout: async () => {
    await api.post('/auth/logout');
    localStorage.removeItem('admin_token');
  },

  getCurrentUser: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  // Dashboard
  getDashboardStats: async () => {
    const response = await api.get('/admin/dashboard');
    return response.data;
  },

  // Products
  getProducts: async (params = {}) => {
    const response = await api.get('/products', { params });
    return response.data;
  },

  getProduct: async (id: string) => {
    const response = await api.get(`/products/${id}`);
    return response.data;
  },

  createProduct: async (productData: any) => {
    const response = await api.post('/products', productData);
    return response.data;
  },

  updateProduct: async (id: string, productData: any) => {
    const response = await api.put(`/products/${id}`, productData);
    return response.data;
  },

  deleteProduct: async (id: string) => {
    const response = await api.delete(`/products/${id}`);
    return response.data;
  },

  // Categories
  getCategories: async () => {
    const response = await api.get('/products/categories');
    return response.data;
  },

  // Collections
  getCollections: async () => {
    const response = await api.get('/products/collections');
    return response.data;
  },

  // Upload
  uploadProductImage: async (productId: string, image: File) => {
    const formData = new FormData();
    formData.append('image', image);
    
    const response = await api.post(`/upload/product-image/${productId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Orders
  getOrders: async (params = {}) => {
    const response = await api.get('/orders', { params });
    return response.data;
  },

  updateOrderStatus: async (orderId: string, status: string, trackingCode?: string) => {
    const response = await api.put(`/orders/${orderId}/status`, { status, tracking_code: trackingCode });
    return response.data;
  },

  // Settings
  getSettings: async () => {
    const response = await api.get('/settings');
    return response.data;
  },

  updateSettings: async (settings: any) => {
    const response = await api.put('/settings', settings);
    return response.data;
  },

  // Carousel
  getCarouselItems: async () => {
    const response = await api.get('/admin/carousel');
    return response.data;
  },

  updateCarouselItems: async (items: any[]) => {
    const response = await api.put('/admin/carousel', { items });
    return response.data;
  },

  // Admin Users
  getAdminUsers: async () => {
    const response = await api.get('/admin/users');
    return response.data;
  },

  createAdminUser: async (userData: any) => {
    const response = await api.post('/admin/users', userData);
    return response.data;
  },

  updateAdminUser: async (userId: string, userData: any) => {
    const response = await api.put(`/admin/users/${userId}`, userData);
    return response.data;
  },

  deleteAdminUser: async (userId: string) => {
    const response = await api.delete(`/admin/users/${userId}`);
    return response.data;
  },

  // Collections Admin
  createCollection: async (collectionData: any) => {
    const response = await api.post('/admin/collections', collectionData);
    return response.data;
  },

  updateCollection: async (collectionId: string, collectionData: any) => {
    const response = await api.put(`/admin/collections/${collectionId}`, collectionData);
    return response.data;
  },

  deleteCollection: async (collectionId: string) => {
    const response = await api.delete(`/admin/collections/${collectionId}`);
    return response.data;
  },
};

export default adminService;
