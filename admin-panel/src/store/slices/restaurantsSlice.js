import { createSlice } from '@reduxjs/toolkit';

const restaurantsSlice = createSlice({
  name: 'restaurants',
  initialState: {
    loading: false,
    error: null,
    restaurants: [],
  },
  reducers: {
    // You can add specific restaurant-related actions here
  },
});

export default restaurantsSlice.reducer;
