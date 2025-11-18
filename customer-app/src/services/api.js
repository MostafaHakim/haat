import axios from "axios";
import { store } from "../store/store";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const API_BASE_URL = "https://haat-zkun.onrender.com/api";

// Token management function
const getToken = async () => {
  try {
    // First try to get token from Redux store
    const state = store.getState();
    const tokenFromStore = state.auth.token;

    if (tokenFromStore) {
      return tokenFromStore;
    }

    // If not in store, try AsyncStorage as fallback
    const tokenFromStorage = await AsyncStorage.getItem("authToken");
    return tokenFromStorage;
  } catch (error) {
    console.error("Error getting token:", error);
    return null;
  }
};

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error("Error setting auth header:", error);
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
  getAll: () => api.get("/restaurants"),
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
  getOrderDetails: (orderId) => api.get(`/orders/${orderId}`),

  // 👇 নতুনটি যোগ করুন
  getById: (orderId) => api.get(`/orders/${orderId}`),
};

export const userAPI = {
  getProfile: () => api.get("/users/profile"),
  updateProfile: (profileData) => api.put("/users/profile", profileData),
};

export default api;
