import { createSlice } from "@reduxjs/toolkit";

const cartSlice = createSlice({
  name: "cart",
  initialState: {
    items: [],
    restaurant: null,
    totalAmount: 0,
  },
  reducers: {
    addToCart: (state, action) => {
      const { product, restaurant } = action.payload;

      // If cart is empty or same restaurant, add item
      if (state.items.length === 0 || state.restaurant?.id === restaurant.id) {
        const existingItem = state.items.find((item) => item.id === product.id);

        if (existingItem) {
          existingItem.quantity += 1;
          existingItem.totalPrice = existingItem.quantity * existingItem.price;
        } else {
          state.items.push({
            ...product,
            quantity: 1,
            totalPrice: product.price,
          });
        }

        if (state.items.length === 1) {
          state.restaurant = restaurant;
        }
      } else {
        // Clear cart and add new item from different restaurant
        state.items = [
          {
            ...product,
            quantity: 1,
            totalPrice: product.price,
          },
        ];
        state.restaurant = restaurant;
      }

      state.totalAmount = state.items.reduce(
        (total, item) => total + item.totalPrice,
        0
      );
    },
    removeFromCart: (state, action) => {
      const productId = action.payload;
      state.items = state.items.filter((item) => item.id !== productId);
      state.totalAmount = state.items.reduce(
        (total, item) => total + item.totalPrice,
        0
      );

      if (state.items.length === 0) {
        state.restaurant = null;
      }
    },
    updateQuantity: (state, action) => {
      const { productId, quantity } = action.payload;
      const item = state.items.find((item) => item.id === productId);

      if (item) {
        if (quantity <= 0) {
          state.items = state.items.filter((item) => item.id !== productId);
        } else {
          item.quantity = quantity;
          item.totalPrice = item.quantity * item.price;
        }
      }

      state.totalAmount = state.items.reduce(
        (total, item) => total + item.totalPrice,
        0
      );

      if (state.items.length === 0) {
        state.restaurant = null;
      }
    },
    clearCart: (state) => {
      state.items = [];
      state.restaurant = null;
      state.totalAmount = 0;
    },
  },
});

export const { addToCart, removeFromCart, updateQuantity, clearCart } =
  cartSlice.actions;
export default cartSlice.reducer;
