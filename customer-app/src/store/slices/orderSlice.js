import { createSlice } from "@reduxjs/toolkit";

const orderSlice = createSlice({
  name: "orders",
  initialState: {
    orders: [],
    currentOrder: null,
    loading: false,
    error: null,
  },
  reducers: {
    fetchOrdersStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    fetchOrdersSuccess: (state, action) => {
      state.loading = false;
      state.orders = action.payload;
      state.error = null;
    },
    fetchOrdersFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    setCurrentOrder: (state, action) => {
      state.currentOrder = action.payload;
    },
    updateOrderStatus: (state, action) => {
      const { orderId, status } = action.payload;
      const order = state.orders.find((order) => order._id === orderId);
      if (order) {
        order.status = status;
      }
      if (state.currentOrder && state.currentOrder._id === orderId) {
        state.currentOrder.status = status;
      }
    },
    updateRiderLocation: (state, action) => {
      const { orderId, location } = action.payload;
      if (state.currentOrder && state.currentOrder._id === orderId) {
        state.currentOrder.riderLocation = location;
      }
    },
  },
});

export const {
  fetchOrdersStart,
  fetchOrdersSuccess,
  fetchOrdersFailure,
  setCurrentOrder,
  updateOrderStatus,
  updateRiderLocation,
} = orderSlice.actions;

export default orderSlice.reducer;
