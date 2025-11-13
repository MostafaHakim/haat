import axios from "axios";
import { store } from "../store/store";

const API_BASE_URL = "http://192.168.0.201:5000/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = store.getState().auth.token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      store.dispatch({ type: "auth/logout" });
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (credentials) => api.post("/auth/login", credentials),
};

export const adminAPI = {
  // Dashboard Stats
  getDashboardStats: () => api.get("/admin/dashboard/stats"),
  getRecentActivities: () => api.get("/admin/dashboard/activities"),

  // Users Management
  getUsers: (params) => api.get("/admin/users", { params }),
  getUserById: (userId) => api.get(`/admin/users/${userId}`),
  updateUserStatus: (userId, data) =>
    api.patch(`/admin/users/${userId}/status`, data),

  // Restaurants Management
  getRestaurants: (params) => api.get("/admin/restaurants", { params }),
  getRestaurantById: (restaurantId) =>
    api.get(`/admin/restaurants/${restaurantId}`),
  updateRestaurantStatus: (restaurantId, data) =>
    api.patch(`/admin/restaurants/${restaurantId}/status`, data),

  // Orders Management
  getOrders: (params) => api.get("/admin/orders", { params }),
  getOrderById: (orderId) => api.get(`/admin/orders/${orderId}`),

  // Riders Management
  getRiders: (params) => api.get("/admin/riders", { params }),
  getRiderById: (riderId) => api.get(`/admin/riders/${riderId}`),
  updateRiderStatus: (riderId, data) =>
    api.patch(`/admin/riders/${riderId}/status`, data),

  // Analytics
  getRevenueAnalytics: (params) =>
    api.get("/admin/analytics/revenue", { params }),
  getOrderAnalytics: (params) => api.get("/admin/analytics/orders", { params }),
  getUserAnalytics: (params) => api.get("/admin/analytics/users", { params }),
};

export default api;
