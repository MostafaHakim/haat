import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import dashboardReducer from "./slices/dashboardSlice";
import usersReducer from "./slices/usersSlice";
import restaurantsReducer from "./slices/restaurantsSlice";
import ordersReducer from "./slices/ordersSlice";
import ridersReducer from "./slices/ridersSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    dashboard: dashboardReducer,
    users: usersReducer,
    restaurants: restaurantsReducer,
    orders: ordersReducer,
    riders: ridersReducer,
  },
});
