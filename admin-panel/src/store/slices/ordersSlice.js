import { createSlice } from '@reduxjs/toolkit';

const ordersSlice = createSlice({
  name: 'orders',
  initialState: {
    loading: false,
    error: null,
    orders: [],
  },
  reducers: {
    // You can add specific order-related actions here
  },
});

export default ordersSlice.reducer;
