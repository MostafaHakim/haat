const express = require("express");
const { auth, authorize } = require("../middleware/auth");
const Product = require("../models/Product");
const Restaurant = require("../models/Restaurant");
const router = express.Router();

// Seller creates a new product
router.post("/", auth, authorize("seller"), async (req, res) => {
  try {
    // First, get seller's restaurant
    const restaurant = await Restaurant.findOne({ sellerId: req.user.id });
    if (!restaurant) {
      return res
        .status(404)
        .json({
          message: "Restaurant not found. Please create a restaurant first.",
        });
    }

    const {
      name,
      description,
      price,
      originalPrice,
      category,
      image,
      images,
      isVeg,
      preparationTime,
      ingredients,
      allergens,
      nutritionalInfo,
      tags,
      sortOrder,
    } = req.body;

    const product = new Product({
      restaurantId: restaurant._id,
      name,
      description,
      price,
      originalPrice: originalPrice || price,
      category,
      image,
      images: images || (image ? [image] : []),
      isVeg: isVeg !== undefined ? isVeg : true,
      preparationTime: preparationTime || 15,
      ingredients: ingredients || [],
      allergens: allergens || [],
      nutritionalInfo: nutritionalInfo || {},
      tags: tags || [],
      sortOrder: sortOrder || 0,
    });

    await product.save();

    // Populate restaurant details in response
    await product.populate("restaurantId", "name cuisineType");

    res.status(201).json(product);
  } catch (error) {
    console.error("Product creation error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Seller gets all products for their restaurant
router.get("/my-products", auth, authorize("seller"), async (req, res) => {
  try {
    const restaurant = await Restaurant.findOne({ sellerId: req.user.id });
    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" });
    }

    const { category, availableOnly } = req.query;

    let query = { restaurantId: restaurant._id };

    if (category && category !== "all") {
      query.category = category;
    }

    if (availableOnly === "true") {
      query.isAvailable = true;
    }

    const products = await Product.find(query).sort({
      sortOrder: 1,
      createdAt: -1,
    });

    // Get unique categories for filter
    const categories = await Product.distinct("category", {
      restaurantId: restaurant._id,
    });

    res.json({
      products,
      categories,
      total: products.length,
    });
  } catch (error) {
    console.error("Get products error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Customer gets products from a specific restaurant
router.get("/restaurant/:restaurantId", auth, async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const { category, vegOnly } = req.query;

    // Check if restaurant exists and is active
    const restaurant = await Restaurant.findOne({
      _id: restaurantId,
      isActive: true,
    });

    if (!restaurant) {
      return res
        .status(404)
        .json({ message: "Restaurant not found or inactive" });
    }

    let query = {
      restaurantId,
      isAvailable: true,
    };

    if (category && category !== "all") {
      query.category = category;
    }

    if (vegOnly === "true") {
      query.isVeg = true;
    }

    const products = await Product.find(query).sort({
      sortOrder: 1,
      category: 1,
      name: 1,
    });

    // Group products by category
    const productsByCategory = products.reduce((acc, product) => {
      if (!acc[product.category]) {
        acc[product.category] = [];
      }
      acc[product.category].push(product);
      return acc;
    }, {});

    // Get unique categories
    const categories = Object.keys(productsByCategory);

    res.json({
      restaurant: {
        id: restaurant._id,
        name: restaurant.name,
        cuisineType: restaurant.cuisineType,
        deliveryRadius: restaurant.deliveryRadius,
      },
      productsByCategory,
      categories,
      totalProducts: products.length,
    });
  } catch (error) {
    console.error("Get restaurant products error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Update a product
router.put("/:productId", auth, authorize("seller"), async (req, res) => {
  try {
    const { productId } = req.params;

    // First, get seller's restaurant
    const restaurant = await Restaurant.findOne({ sellerId: req.user.id });
    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" });
    }

    // Find product and verify ownership
    const product = await Product.findOne({
      _id: productId,
      restaurantId: restaurant._id,
    });

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const allowedUpdates = [
      "name",
      "description",
      "price",
      "originalPrice",
      "category",
      "image",
      "images",
      "isAvailable",
      "isVeg",
      "preparationTime",
      "ingredients",
      "allergens",
      "nutritionalInfo",
      "tags",
      "sortOrder",
    ];

    const updates = {};
    allowedUpdates.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    const updatedProduct = await Product.findByIdAndUpdate(productId, updates, {
      new: true,
      runValidators: true,
    }).populate("restaurantId", "name cuisineType");

    res.json(updatedProduct);
  } catch (error) {
    console.error("Update product error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Delete a product
router.delete("/:productId", auth, authorize("seller"), async (req, res) => {
  try {
    const { productId } = req.params;

    const restaurant = await Restaurant.findOne({ sellerId: req.user.id });
    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" });
    }

    const product = await Product.findOneAndDelete({
      _id: productId,
      restaurantId: restaurant._id,
    });

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json({ message: "Product deleted successfully" });
  } catch (error) {
    console.error("Delete product error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Bulk update product availability
router.patch(
  "/bulk-availability",
  auth,
  authorize("seller"),
  async (req, res) => {
    try {
      const { productIds, isAvailable } = req.body;

      if (!Array.isArray(productIds) || typeof isAvailable !== "boolean") {
        return res.status(400).json({ message: "Invalid request data" });
      }

      const restaurant = await Restaurant.findOne({ sellerId: req.user.id });
      if (!restaurant) {
        return res.status(404).json({ message: "Restaurant not found" });
      }

      const result = await Product.updateMany(
        {
          _id: { $in: productIds },
          restaurantId: restaurant._id,
        },
        { isAvailable }
      );

      res.json({
        message: `${result.modifiedCount} products updated successfully`,
        updatedCount: result.modifiedCount,
      });
    } catch (error) {
      console.error("Bulk update error:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// Search products across restaurants
router.get("/search", auth, async (req, res) => {
  try {
    const { q, category, minPrice, maxPrice, isVeg, latitude, longitude } =
      req.query;

    if (!q) {
      return res.status(400).json({ message: "Search query is required" });
    }

    let restaurantFilter = { isActive: true };

    // Filter restaurants by location if coordinates provided
    if (latitude && longitude) {
      restaurantFilter.location = {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [parseFloat(longitude), parseFloat(latitude)],
          },
          $maxDistance: 10 * 1000, // 10km radius
        },
      };
    }

    const restaurants = await Restaurant.find(restaurantFilter);
    const restaurantIds = restaurants.map((r) => r._id);

    let productQuery = {
      restaurantId: { $in: restaurantIds },
      isAvailable: true,
      $or: [
        { name: { $regex: q, $options: "i" } },
        { description: { $regex: q, $options: "i" } },
        { category: { $regex: q, $options: "i" } },
        { tags: { $in: [new RegExp(q, "i")] } },
      ],
    };

    if (category && category !== "all") {
      productQuery.category = category;
    }

    if (minPrice || maxPrice) {
      productQuery.price = {};
      if (minPrice) productQuery.price.$gte = parseFloat(minPrice);
      if (maxPrice) productQuery.price.$lte = parseFloat(maxPrice);
    }

    if (isVeg === "true") {
      productQuery.isVeg = true;
    }

    const products = await Product.find(productQuery)
      .populate("restaurantId", "name cuisineType address rating")
      .limit(50);

    res.json({
      query: q,
      results: products,
      total: products.length,
      restaurants: restaurants.length,
    });
  } catch (error) {
    console.error("Search error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
