import axios from 'axios';

const API_BASE_URL = 'https://admin.vishalinifireworks.com/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});
 
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
 
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
 
export const authAPI = {
  login: (username: string, password: string) =>
    api.post('/auth/login', { username, password }),
  verify: () => api.get('/auth/verify'),
  logout: () => api.post('/auth/logout'),
};
 
export const categoriesAPI = {
  getAll: (active?: boolean) => 
    api.get('/categories', { params: active !== undefined ? { active } : {} }),
  getById: (id: string) => api.get(`/categories/${id}`),
  create: (data: FormData) => api.post('/categories', data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  update: (id: string, data: FormData) => api.put(`/categories/${id}`, data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  delete: (id: string) => api.delete(`/categories/${id}`),
};
 
export const productsAPI = {
  getAll: (params?: any) => api.get('/products', { params }),
  getById: (id: string) => api.get(`/products/${id}`),
  create: (data: FormData) => api.post('/products', data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  update: (id: string, data: FormData) => api.put(`/products/${id}`, data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  delete: (id: string) => api.delete(`/products/${id}`),
};
 
export const dashboardAPI = {
  getStats: () => api.get('/dashboard/stats'),
};

export default api;