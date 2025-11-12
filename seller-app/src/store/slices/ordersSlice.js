import { createSlice } from "@reduxjs/toolkit";

const ordersSlice = createSlice({
  name: "orders",
  initialState: {
    orders: [],
    todayOrders: [],
    currentOrder: null,
    loading: false,
    error: null,
    stats: {
      total: 0,
      pending: 0,
      preparing: 0,
      ready: 0,
      completed: 0,
    },
  },
  reducers: {
    fetchOrdersStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    fetchOrdersSuccess: (state, action) => {
      state.loading = false;
      state.orders = action.payload.orders;
      state.stats = action.payload.stats;
      state.error = null;
    },
    fetchOrdersFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    fetchTodayOrdersSuccess: (state, action) => {
      state.todayOrders = action.payload;
    },
    setCurrentOrder: (state, action) => {
      state.currentOrder = action.payload;
    },
    updateOrderStatus: (state, action) => {
      const { orderId, status } = action.payload;
      const orderIndex = state.orders.findIndex(
        (order) => order._id === orderId
      );
      const todayOrderIndex = state.todayOrders.findIndex(
        (order) => order._id === orderId
      );

      if (orderIndex !== -1) {
        state.orders[orderIndex].status = status;
      }

      if (todayOrderIndex !== -1) {
        state.todayOrders[todayOrderIndex].status = status;
      }

      if (state.currentOrder && state.currentOrder._id === orderId) {
        state.currentOrder.status = status;
      }

      // Update stats
      state.stats = calculateStats(state.orders);
    },
    addNewOrder: (state, action) => {
      state.orders.unshift(action.payload);
      state.todayOrders.unshift(action.payload);
      state.stats = calculateStats(state.orders);
    },
  },
});

const calculateStats = (orders) => {
  const today = new Date().toDateString();
  const todayOrders = orders.filter(
    (order) => new Date(order.createdAt).toDateString() === today
  );

  return {
    total: todayOrders.length,
    pending: todayOrders.filter((order) => order.status === "pending").length,
    preparing: todayOrders.filter((order) => order.status === "preparing")
      .length,
    ready: todayOrders.filter((order) => order.status === "ready").length,
    completed: todayOrders.filter((order) =>
      ["delivered", "picked_up", "on_the_way"].includes(order.status)
    ).length,
  };
};

export const {
  fetchOrdersStart,
  fetchOrdersSuccess,
  fetchOrdersFailure,
  fetchTodayOrdersSuccess,
  setCurrentOrder,
  updateOrderStatus,
  addNewOrder,
} = ordersSlice.actions;

export default ordersSlice.reducer;
