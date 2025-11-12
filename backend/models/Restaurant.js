const mongoose = require("mongoose");

const restaurantSchema = new mongoose.Schema({
  sellerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  name: { type: String, required: true },
  description: { type: String },
  address: { type: String, required: true },
  location: {
    type: { type: String, enum: ["Point"], default: "Point" },
    coordinates: { type: [Number], default: [0, 0] }, // [longitude, latitude]
  },
  cuisineType: { type: String },
  deliveryRadius: { type: Number, default: 3 }, // kilometers
  isActive: { type: Boolean, default: true },
  rating: { type: Number, default: 0 },
  image: { type: String },
});

restaurantSchema.index({ location: "2dsphere" });

module.exports = mongoose.model("Restaurant", restaurantSchema);
