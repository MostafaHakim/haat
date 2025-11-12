import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import restaurantReducer from "./slices/restaurantSlice";
import cartReducer from "./slices/cartSlice";
import orderReducer from "./slices/orderSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    restaurants: restaurantReducer,
    cart: cartReducer,
    orders: orderReducer,
  },
});
