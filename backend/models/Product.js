const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    originalPrice: {
      type: Number,
      min: 0,
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    image: {
      type: String,
      default: "",
    },
    images: [
      {
        type: String,
      },
    ],
    isAvailable: {
      type: Boolean,
      default: true,
    },
    isVeg: {
      type: Boolean,
      default: true,
    },
    preparationTime: {
      type: Number, // in minutes
      default: 15,
    },
    ingredients: [
      {
        type: String,
      },
    ],
    allergens: [
      {
        type: String,
      },
    ],
    nutritionalInfo: {
      calories: { type: Number },
      protein: { type: Number }, // in grams
      carbs: { type: Number }, // in grams
      fat: { type: Number }, // in grams
    },
    tags: [
      {
        type: String,
      },
    ],
    sortOrder: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Index for better performance
productSchema.index({ restaurantId: 1, category: 1 });
productSchema.index({ restaurantId: 1, isAvailable: 1 });

module.exports = mongoose.model("Product", productSchema);
