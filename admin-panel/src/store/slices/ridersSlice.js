import { createSlice } from '@reduxjs/toolkit';

const ridersSlice = createSlice({
  name: 'riders',
  initialState: {
    loading: false,
    error: null,
    riders: [],
  },
  reducers: {
    // You can add specific rider-related actions here
  },
});

export default ridersSlice.reducer;
