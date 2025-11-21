const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone: { type: String, required: true },
    userType: {
      type: String,
      enum: ["customer", "seller", "rider", "admin"],
      required: true,
    },
    // Seller-specific fields
    restaurantName: { type: String },
    restaurantAddress: { type: String },
    cuisineType: { type: String },
    // Rider-specific fields
    vehicleType: { type: String },
    licenseNumber: { type: String },
    isAvailable: { type: Boolean, default: false },
    // Location for riders and customers
    location: {
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: { type: [Number], default: [0, 0] }, // [longitude, latitude]
    },
  },
  { timestamps: true }
);

userSchema.index({ location: "2dsphere" });

module.exports = mongoose.model("User", userSchema);
