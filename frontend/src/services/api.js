import axios from 'axios';
import { getToken, removeToken } from './auth';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      removeToken();
      window.location.href = '/customer/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  adminLogin: (credentials) => {
    const formData = new URLSearchParams();
    formData.append('username', credentials.email);  // OAuth2 expects 'username'
    formData.append('password', credentials.password);
    
    return api.post('/api/login', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
  },
  customerLogin: (credentials) => api.post('/api/customer/login', credentials),
  customerSignup: (data) => api.post('/api/customer/signup', data),
};

// Admin API
export const adminAPI = {
  getDashboard: () => api.get('/api/v1/admin/dashboard'),

  // Customer management
  getCustomers: (page = 1, limit = 10, search = '') => 
    api.get(`/api/v1/admin/customers?page=${page}&limit=${limit}&search=${search}`),
  createCustomer: (data) => api.post('/api/v1/admin/customers', data),
  getCustomer: (id) => api.get(`/api/v1/admin/customers/${id}`),
  updateCustomer: (id, data) => api.put(`/api/v1/admin/customers/${id}`, data),
  deleteCustomer: (id) => api.delete(`/api/v1/admin/customers/${id}`),

  // Subscription pack management
  getSubscriptionPacks: (page = 1, limit = 10) => 
    api.get(`/api/v1/admin/subscription-packs?page=${page}&limit=${limit}`),
  createSubscriptionPack: (data) => api.post('/api/v1/admin/subscription-packs', data),
  updateSubscriptionPack: (id, data) => api.put(`/api/v1/admin/subscription-packs/${id}`, data),
  deleteSubscriptionPack: (id) => api.delete(`/api/v1/admin/subscription-packs/${id}`),

  // Subscription management
  getSubscriptions: (page = 1, limit = 10, status = '') => 
    api.get(`/api/v1/admin/subscriptions?page=${page}&limit=${limit}&status=${status}`),
  approveSubscription: (id) => api.post(`/api/v1/admin/subscriptions/${id}/approve`),
  assignSubscription: (customerId, packId) => 
    api.post(`/api/v1/admin/customers/${customerId}/assign-subscription`, { pack_id: packId }),
};

// Customer API
export const customerAPI = {
  getCurrentSubscription: () => api.get('/api/v1/customer/subscription'),
  requestSubscription: (sku) => api.post('/api/v1/customer/subscription', { sku }),
  deactivateSubscription: () => api.delete('/api/v1/customer/subscription'),
  getSubscriptionHistory: (page = 1, limit = 10, sort = 'desc') => 
    api.get(`/api/v1/customer/subscription-history?page=${page}&limit=${limit}&sort=${sort}`),
  getAvailableSubscriptionPacks: () => 
    api.get('/api/v1/customer/subscription-packs'),
};

// Get available subscription packs for customers
export const getAvailableSubscriptionPacks = () => 
  api.get('/api/v1/customer/subscription-packs');

export default api;