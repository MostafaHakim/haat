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
  register: (userData) => api.post("/auth/register", userData),
};

export const userAPI = {
  getProfile: () => api.get("/users/profile"),
  updateProfile: (profileData) => api.put("/users/profile", profileData),
  updateLocation: (locationData) =>
    api.put("/users/rider/location", locationData),
};

export const orderAPI = {
  getAvailable: () => api.get("/orders/available"),
  acceptOrder: (orderId) => api.patch(`/orders/${orderId}/accept`),
  updateRiderStatus: (orderId, statusData) =>
    api.patch(`/orders/${orderId}/rider-status`, statusData),
  getById: (orderId) => api.get(`/orders/${orderId}`),
  getMyOrders: (params) => api.get("/orders/my-orders", { params }),
};

export default api;
