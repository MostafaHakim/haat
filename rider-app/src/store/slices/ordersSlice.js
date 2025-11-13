import { createSlice } from "@reduxjs/toolkit";

const ordersSlice = createSlice({
  name: "orders",
  initialState: {
    availableOrders: [],
    activeOrder: null,
    orderHistory: [],
    loading: false,
    error: null,
    stats: {
      todayEarnings: 0,
      todayDeliveries: 0,
      totalEarnings: 0,
      totalDeliveries: 0,
    },
  },
  reducers: {
    fetchOrdersStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    fetchAvailableOrdersSuccess: (state, action) => {
      state.loading = false;
      state.availableOrders = action.payload;
      state.error = null;
    },
    fetchOrderHistorySuccess: (state, action) => {
      state.orderHistory = action.payload;
    },
    setActiveOrder: (state, action) => {
      state.activeOrder = action.payload;
      // Remove from available orders
      state.availableOrders = state.availableOrders.filter(
        (order) => order._id !== action.payload._id
      );
    },
    updateActiveOrder: (state, action) => {
      if (state.activeOrder) {
        state.activeOrder = { ...state.activeOrder, ...action.payload };
      }
    },
    clearActiveOrder: (state) => {
      state.activeOrder = null;
    },
    updateOrderStatus: (state, action) => {
      const { orderId, status } = action.payload;

      if (state.activeOrder && state.activeOrder._id === orderId) {
        state.activeOrder.status = status;
      }

      // Update in history if exists
      const orderIndex = state.orderHistory.findIndex(
        (order) => order._id === orderId
      );
      if (orderIndex !== -1) {
        state.orderHistory[orderIndex].status = status;
      }
    },
    addToHistory: (state, action) => {
      state.orderHistory.unshift(action.payload);
    },
    updateStats: (state, action) => {
      state.stats = { ...state.stats, ...action.payload };
    },
    removeAvailableOrder: (state, action) => {
      state.availableOrders = state.availableOrders.filter(
        (order) => order._id !== action.payload
      );
    },
  },
});

export const {
  fetchOrdersStart,
  fetchAvailableOrdersSuccess,
  fetchOrderHistorySuccess,
  setActiveOrder,
  updateActiveOrder,
  clearActiveOrder,
  updateOrderStatus,
  addToHistory,
  updateStats,
  removeAvailableOrder,
} = ordersSlice.actions;

export default ordersSlice.reducer;
