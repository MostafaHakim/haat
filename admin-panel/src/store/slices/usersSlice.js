import { createSlice } from '@reduxjs/toolkit';

const usersSlice = createSlice({
  name: 'users',
  initialState: {
    loading: false,
    error: null,
    users: [],
  },
  reducers: {
    // You can add specific user-related actions here
  },
});

export default usersSlice.reducer;
