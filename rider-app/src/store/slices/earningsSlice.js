import { createSlice } from '@reduxjs/toolkit';

const earningsSlice = createSlice({
  name: 'earnings',
  initialState: {
    earnings: [],
    loading: false,
    error: null,
  },
  reducers: {
    fetchEarningsStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    fetchEarningsSuccess: (state, action) => {
      state.loading = false;
      state.earnings = action.payload;
    },
    fetchEarningsFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
  },
});

export const {
  fetchEarningsStart,
  fetchEarningsSuccess,
  fetchEarningsFailure,
} = earningsSlice.actions;
export default earningsSlice.reducer;
