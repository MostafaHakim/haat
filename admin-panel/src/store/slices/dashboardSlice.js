import { createSlice } from '@reduxjs/toolkit';

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState: {
    loading: false,
    error: null,
    data: null,
  },
  reducers: {
    // You can add specific dashboard-related actions here
  },
});

export default dashboardSlice.reducer;
