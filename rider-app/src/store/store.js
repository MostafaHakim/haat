import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import ordersReducer from "./slices/ordersSlice";
import locationReducer from "./slices/locationSlice";
import earningsReducer from "./slices/earningsSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    orders: ordersReducer,
    location: locationReducer,
    earnings: earningsReducer,
  },
});
