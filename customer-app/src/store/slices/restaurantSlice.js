import { createSlice } from "@reduxjs/toolkit";

const restaurantSlice = createSlice({
  name: "restaurants",
  initialState: {
    restaurants: [],
    nearbyRestaurants: [],
    featuredRestaurants: [],
    currentRestaurant: null,
    loading: false,
    error: null,
    filters: {
      cuisineType: "all",
      sortBy: "rating",
      maxDeliveryTime: 60,
      minOrderAmount: 0,
    },
    searchQuery: "",
    pagination: {
      currentPage: 1,
      totalPages: 1,
      totalRestaurants: 0,
    },
  },
  reducers: {
    // Restaurants loading states
    fetchRestaurantsStart: (state) => {
      state.loading = true;
      state.error = null;
    },

    fetchRestaurantsSuccess: (state, action) => {
      state.loading = false;
      state.restaurants = action.payload.restaurants;
      state.pagination = {
        currentPage: action.payload.currentPage || 1,
        totalPages: action.payload.totalPages || 1,
        totalRestaurants: action.payload.total || 0,
      };
      state.error = null;
    },

    fetchRestaurantsFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },

    // Nearby restaurants
    fetchNearbyRestaurantsStart: (state) => {
      state.loading = true;
      state.error = null;
    },

    fetchNearbyRestaurantsSuccess: (state, action) => {
      state.loading = false;
      state.nearbyRestaurants = action.payload;
      state.error = null;
    },

    fetchNearbyRestaurantsFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },

    // Featured restaurants
    fetchFeaturedRestaurantsSuccess: (state, action) => {
      state.featuredRestaurants = action.payload;
    },

    // Single restaurant
    fetchRestaurantDetailStart: (state) => {
      state.loading = true;
      state.error = null;
    },

    fetchRestaurantDetailSuccess: (state, action) => {
      state.loading = false;
      state.currentRestaurant = action.payload;
      state.error = null;
    },

    fetchRestaurantDetailFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },

    clearCurrentRestaurant: (state) => {
      state.currentRestaurant = null;
    },

    // Search and filters
    setSearchQuery: (state, action) => {
      state.searchQuery = action.payload;
    },

    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },

    clearFilters: (state) => {
      state.filters = {
        cuisineType: "all",
        sortBy: "rating",
        maxDeliveryTime: 60,
        minOrderAmount: 0,
      };
    },

    // Pagination
    setCurrentPage: (state, action) => {
      state.pagination.currentPage = action.payload;
    },

    // Update restaurant rating
    updateRestaurantRating: (state, action) => {
      const { restaurantId, newRating, reviewCount } = action.payload;

      // Update in restaurants list
      const restaurantIndex = state.restaurants.findIndex(
        (restaurant) => restaurant._id === restaurantId
      );
      if (restaurantIndex !== -1) {
        state.restaurants[restaurantIndex].rating = newRating;
        state.restaurants[restaurantIndex].reviewCount = reviewCount;
      }

      // Update in nearby restaurants
      const nearbyIndex = state.nearbyRestaurants.findIndex(
        (restaurant) => restaurant._id === restaurantId
      );
      if (nearbyIndex !== -1) {
        state.nearbyRestaurants[nearbyIndex].rating = newRating;
        state.nearbyRestaurants[nearbyIndex].reviewCount = reviewCount;
      }

      // Update in featured restaurants
      const featuredIndex = state.featuredRestaurants.findIndex(
        (restaurant) => restaurant._id === restaurantId
      );
      if (featuredIndex !== -1) {
        state.featuredRestaurants[featuredIndex].rating = newRating;
        state.featuredRestaurants[featuredIndex].reviewCount = reviewCount;
      }

      // Update current restaurant if it's the one being viewed
      if (
        state.currentRestaurant &&
        state.currentRestaurant._id === restaurantId
      ) {
        state.currentRestaurant.rating = newRating;
        state.currentRestaurant.reviewCount = reviewCount;
      }
    },

    // Toggle restaurant favorite status
    toggleRestaurantFavorite: (state, action) => {
      const restaurantId = action.payload;

      const updateFavoriteStatus = (restaurant) => {
        if (restaurant._id === restaurantId) {
          return {
            ...restaurant,
            isFavorite: !restaurant.isFavorite,
          };
        }
        return restaurant;
      };

      state.restaurants = state.restaurants.map(updateFavoriteStatus);
      state.nearbyRestaurants =
        state.nearbyRestaurants.map(updateFavoriteStatus);
      state.featuredRestaurants =
        state.featuredRestaurants.map(updateFavoriteStatus);

      if (
        state.currentRestaurant &&
        state.currentRestaurant._id === restaurantId
      ) {
        state.currentRestaurant.isFavorite =
          !state.currentRestaurant.isFavorite;
      }
    },

    // Clear all restaurant data
    clearRestaurants: (state) => {
      state.restaurants = [];
      state.nearbyRestaurants = [];
      state.featuredRestaurants = [];
      state.currentRestaurant = null;
      state.searchQuery = "";
      state.filters = {
        cuisineType: "all",
        sortBy: "rating",
        maxDeliveryTime: 60,
        minOrderAmount: 0,
      };
      state.pagination = {
        currentPage: 1,
        totalPages: 1,
        totalRestaurants: 0,
      };
    },
  },
});

export const {
  // Loading states
  fetchRestaurantsStart,
  fetchRestaurantsSuccess,
  fetchRestaurantsFailure,

  // Nearby restaurants
  fetchNearbyRestaurantsStart,
  fetchNearbyRestaurantsSuccess,
  fetchNearbyRestaurantsFailure,

  // Featured restaurants
  fetchFeaturedRestaurantsSuccess,

  // Single restaurant
  fetchRestaurantDetailStart,
  fetchRestaurantDetailSuccess,
  fetchRestaurantDetailFailure,
  clearCurrentRestaurant,

  // Search and filters
  setSearchQuery,
  setFilters,
  clearFilters,

  // Pagination
  setCurrentPage,

  // Updates
  updateRestaurantRating,
  toggleRestaurantFavorite,

  // Clear data
  clearRestaurants,
} = restaurantSlice.actions;

export default restaurantSlice.reducer;
