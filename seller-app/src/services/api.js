import axios from "axios";
import { store } from "../store/store";

const API_BASE_URL = "http://192.168.0.201/api";

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

export const restaurantAPI = {
  create: (restaurantData) => api.post("/restaurants", restaurantData),
  getMyRestaurant: () => api.get("/restaurants/my-restaurant"),
  update: (restaurantData) =>
    api.put("/restaurants/my-restaurant", restaurantData),
};

export const productAPI = {
  create: (productData) => api.post("/products", productData),
  getMyProducts: (params) => api.get("/products/my-products", { params }),
  update: (productId, productData) =>
    api.put(`/products/${productId}`, productData),
  delete: (productId) => api.delete(`/products/${productId}`),
  bulkAvailability: (data) => api.patch("/products/bulk-availability", data),
};

export const orderAPI = {
  getRestaurantOrders: (params) =>
    api.get("/orders/restaurant/orders", { params }),
  updateStatus: (orderId, statusData) =>
    api.patch(`/orders/${orderId}/status`, statusData),
  getById: (orderId) => api.get(`/orders/${orderId}`),
};

export default api;
