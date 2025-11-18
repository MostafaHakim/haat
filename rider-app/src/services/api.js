import axios from "axios";
import { store } from "../store/store";

const API_BASE_URL = "https://haat-zkun.onrender.com/api";

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
  register: (userData) => api.post("/auth/register", userData),
};

export const userAPI = {
  getProfile: () => api.get("/users/profile"),
  updateProfile: (profileData) => api.put("/users/profile", profileData),
  updateLocation: (locationData) =>
    api.put("/users/rider/location", locationData),
};

// services/api.js - orderAPI আপডেট করুন
export const orderAPI = {
  getMyOrders: (params) => api.get("/orders/my-rider-orders", { params }),
  getAvailable: () => api.get("/orders/available"),
  acceptOrder: (orderId) => api.patch(`/orders/${orderId}/accept`),
  // rider-status এন্ডপয়েন্ট যোগ করুন যদি প্রয়োজন হয়
  updateStatus: (orderId, statusData) =>
    api.patch(`/orders/${orderId}/rider-status`, statusData),
  updateOrder: (orderId, updateData) =>
    api.patch(`/orders/${orderId}`, updateData),
  getById: (orderId) => api.get(`/orders/${orderId}`),
  updateStatus: async (orderId, statusData) => {
    try {
      // Try rider-status endpoint first
      return await api.patch(`/orders/${orderId}/rider-status`, {
        status: statusData.status,
        // Remove location to avoid model issues
      });
    } catch (error) {
      console.warn("Rider-status failed, trying fallback...");

      // Fallback 1: Try regular order update
      try {
        return await api.patch(`/orders/${orderId}`, {
          status: statusData.status,
        });
      } catch (secondError) {
        console.warn("All API endpoints failed");
        throw secondError;
      }
    }
  },
};

export default api;
