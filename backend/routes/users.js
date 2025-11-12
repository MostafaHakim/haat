const express = require("express");
const { auth, authorize } = require("../middleware/auth");
const User = require("../models/User");
const router = express.Router();

// Get current user profile
router.get("/profile", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// Update user profile
router.put("/profile", auth, async (req, res) => {
  try {
    const { name, phone, restaurantName, vehicleType, location } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      {
        name,
        phone,
        ...(req.user.userType === "seller" && { restaurantName }),
        ...(req.user.userType === "rider" && { vehicleType }),
        ...(location && { location }),
      },
      { new: true }
    ).select("-password");

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// Update rider location and availability
router.put("/rider/location", auth, authorize("rider"), async (req, res) => {
  try {
    const { latitude, longitude, address, isAvailable } = req.body;

    const rider = await User.findByIdAndUpdate(
      req.user.id,
      {
        location: { latitude, longitude, address },
        ...(isAvailable !== undefined && { isAvailable }),
      },
      { new: true }
    ).select("-password");

    res.json(rider);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// Get available riders within 3km radius
router.get("/riders/available", auth, async (req, res) => {
  try {
    const { latitude, longitude } = req.query;

    if (!latitude || !longitude) {
      return res
        .status(400)
        .json({ message: "Latitude and longitude are required" });
    }

    const riders = await User.find({
      userType: "rider",
      isAvailable: true,
      "location.latitude": { $exists: true },
      "location.longitude": { $exists: true },
    });

    // Calculate distance and filter riders within 3km
    const availableRiders = riders.filter((rider) => {
      const distance = calculateDistance(
        parseFloat(latitude),
        parseFloat(longitude),
        rider.location.latitude,
        rider.location.longitude
      );
      return distance <= 3; // 3km radius
    });

    res.json(availableRiders);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// Helper function to calculate distance between two coordinates
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return distance;
}

module.exports = router;
