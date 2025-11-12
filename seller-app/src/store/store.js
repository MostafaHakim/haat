import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import restaurantReducer from "./slices/restaurantSlice";
import ordersReducer from "./slices/ordersSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    restaurant: restaurantReducer,
    orders: ordersReducer,
  },
});
