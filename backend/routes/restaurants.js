const express = require("express");
const { auth, authorize } = require("../middleware/auth");
const Restaurant = require("../models/Restaurant");
const User = require("../models/User");
const router = express.Router();

// Seller creates a restaurant
router.post("/", auth, authorize("seller"), async (req, res) => {
  try {
    const {
      name,
      description,
      address,
      latitude,
      longitude,
      cuisineType,
      deliveryRadius,
    } = req.body;

    // Check if seller already has a restaurant
    const existingRestaurant = await Restaurant.findOne({
      sellerId: req.user.id,
    });
    if (existingRestaurant) {
      return res.status(400).json({ message: "You already have a restaurant" });
    }

    const restaurant = new Restaurant({
      sellerId: req.user.id,
      name,
      description,
      address,
      location: {
        type: "Point",
        coordinates: [longitude, latitude],
      },
      cuisineType,
      deliveryRadius: deliveryRadius || 3,
    });

    await restaurant.save();

    // Update user's restaurant name
    await User.findByIdAndUpdate(req.user.id, { restaurantName: name });

    res.status(201).json(restaurant);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// Get seller's restaurant
router.get("/", auth, async (req, res) => {
  try {
    const restaurants = await Restaurant.find({ isActive: true }).populate(
      "sellerId",
      "name phone"
    );
    res.json(restaurants);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/my-restaurant", auth, authorize("seller"), async (req, res) => {
  try {
    const restaurant = await Restaurant.findOne({ sellerId: req.user.id });
    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" });
    }
    res.json(restaurant);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// Get restaurants near customer location
router.get("/nearby", async (req, res) => {
  try {
    const { latitude, longitude, maxDistance = 50 } = req.query; // maxDistance in km

    if (!latitude || !longitude) {
      return res
        .status(400)
        .json({ message: "Latitude and longitude are required" });
    }

    const restaurants = await Restaurant.find({
      location: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [parseFloat(longitude), parseFloat(latitude)],
          },
          $maxDistance: maxDistance * 1000, // Convert to meters
        },
      },
      isActive: true,
    }).populate("sellerId", "name phone");

    res.json(restaurants);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// Update restaurant
router.put("/my-restaurant", auth, authorize("seller"), async (req, res) => {
  try {
    const {
      name,
      description,
      address,
      latitude,
      longitude,
      cuisineType,
      deliveryRadius,
      isActive,
    } = req.body;

    const restaurant = await Restaurant.findOneAndUpdate(
      { sellerId: req.user.id },
      {
        name,
        description,
        address,
        ...(latitude &&
          longitude && {
            location: {
              type: "Point",
              coordinates: [longitude, latitude],
            },
          }),
        cuisineType,
        deliveryRadius,
        ...(isActive !== undefined && { isActive }),
      },
      { new: true }
    );

    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" });
    }

    res.json(restaurant);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
