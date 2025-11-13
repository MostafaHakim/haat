import { createSlice } from '@reduxjs/toolkit';

const locationSlice = createSlice({
  name: 'location',
  initialState: {
    riderLocation: null,
    error: null,
  },
  reducers: {
    setRiderLocation: (state, action) => {
      state.riderLocation = action.payload;
    },
    setLocationError: (state, action) => {
      state.error = action.payload;
    },
  },
});

export const { setRiderLocation, setLocationError } = locationSlice.actions;
export default locationSlice.reducer;
