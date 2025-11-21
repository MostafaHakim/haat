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
    const { latitude, longitude, isAvailable } = req.body;

    const rider = await User.findByIdAndUpdate(
      req.user.id,
      {
        location: {
          type: "Point",
          coordinates: [longitude, latitude],
        },
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
      location: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [parseFloat(longitude), parseFloat(latitude)],
          },
          $maxDistance: 3000, // 3km in meters
        },
      },
    });

    res.json(riders);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

  

// Get a single rider by ID
router.get("/riders/:id", async (req, res) => {
  try {
    const rider = await User.findOne({
      _id: req.params.id,
      userType: "rider",
    }).select("-password");
    if (!rider) {
      return res.status(404).json({ message: "Rider not found" });
    }
    res.json(rider);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
