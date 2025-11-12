import { createSlice } from "@reduxjs/toolkit";

const restaurantSlice = createSlice({
  name: "restaurant",
  initialState: {
    restaurant: null,
    menu: [],
    loading: false,
    error: null,
  },
  reducers: {
    fetchRestaurantStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    fetchRestaurantSuccess: (state, action) => {
      state.loading = false;
      state.restaurant = action.payload;
      state.error = null;
    },
    fetchRestaurantFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    fetchMenuStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    fetchMenuSuccess: (state, action) => {
      state.loading = false;
      state.menu = action.payload;
      state.error = null;
    },
    fetchMenuFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    addProduct: (state, action) => {
      state.menu.push(action.payload);
    },
    updateProduct: (state, action) => {
      const index = state.menu.findIndex(product => product._id === action.payload._id);
      if (index !== -1) {
        state.menu[index] = action.payload;
      }
    },
    deleteProduct: (state, action) => {
      state.menu = state.menu.filter(product => product._id !== action.payload);
    },
  },
});

export const {
  fetchRestaurantStart,
  fetchRestaurantSuccess,
  fetchRestaurantFailure,
  fetchMenuStart,
  fetchMenuSuccess,
  fetchMenuFailure,
  addProduct,
  updateProduct,
  deleteProduct,
} = restaurantSlice.actions;

export default restaurantSlice.reducer;
