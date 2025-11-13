import axios from "axios";
import { store } from "../store/store";

const API_BASE_URL = "http://192.168.0.103:5000/api"; // Change to your backend URL

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
      // Handle unauthorized access
      store.dispatch({ type: "auth/logout" });
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (credentials) => api.post("/auth/login", credentials),
  register: (userData) => api.post("/auth/register", userData),
};

export const restaurantAPI = {
  getNearby: (params) => api.get("/restaurants/nearby", { params }),
  getById: (id) => api.get(`/restaurants/${id}`),
};

export const productAPI = {
  getByRestaurant: (restaurantId) =>
    api.get(`/products/restaurant/${restaurantId}`),
  search: (params) => api.get("/products/search", { params }),
};

export const orderAPI = {
  create: (orderData) => api.post("/orders", orderData),
  getMyOrders: (params) => api.get("/orders/my-orders", { params }),
  getById: (orderId) => api.get(`/orders/${orderId}`),
  updateStatus: (orderId, statusData) =>
    api.patch(`/orders/${orderId}/status`, statusData),
};

export const userAPI = {
  getProfile: () => api.get("/users/profile"),
  updateProfile: (profileData) => api.put("/users/profile", profileData),
};

export default api;
