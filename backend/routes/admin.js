const express = require("express");
const { auth, authorize } = require("../middleware/auth");
const User = require("../models/User");
const Restaurant = require("../models/Restaurant");
const Order = require("../models/Order");
const router = express.Router();

// Admin dashboard stats
router.get("/dashboard/stats", auth, authorize("admin"), async (req, res) => {
  try {
    const today = new Date();
    const startOfToday = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );
    const startOfWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    // User stats
    const totalUsers = await User.countDocuments();
    const newUsersToday = await User.countDocuments({
      createdAt: { $gte: startOfToday },
    });
    const newUsersThisWeek = await User.countDocuments({
      createdAt: { $gte: startOfWeek },
    });
    const newUsersThisMonth = await User.countDocuments({
      createdAt: { $gte: startOfMonth },
    });

    // Restaurant stats
    const totalRestaurants = await Restaurant.countDocuments();
    const activeRestaurants = await Restaurant.countDocuments({
      isActive: true,
    });
    const pendingRestaurants = await Restaurant.countDocuments({
      isActive: false,
    });

    // Order stats
    const totalOrders = await Order.countDocuments();
    const todayOrders = await Order.countDocuments({
      createdAt: { $gte: startOfToday },
    });
    const weekOrders = await Order.countDocuments({
      createdAt: { $gte: startOfWeek },
    });
    const monthOrders = await Order.countDocuments({
      createdAt: { $gte: startOfMonth },
    });

    // Revenue stats
    const todayRevenue = await Order.aggregate([
      { $match: { createdAt: { $gte: startOfToday }, status: "delivered" } },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } },
    ]);

    const weekRevenue = await Order.aggregate([
      { $match: { createdAt: { $gte: startOfWeek }, status: "delivered" } },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } },
    ]);

    const monthRevenue = await Order.aggregate([
      { $match: { createdAt: { $gte: startOfMonth }, status: "delivered" } },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } },
    ]);

    // Rider stats
    const totalRiders = await User.countDocuments({ userType: "rider" });
    const activeRiders = await User.countDocuments({
      userType: "rider",
      isAvailable: true,
    });

    res.json({
      users: {
        total: totalUsers,
        today: newUsersToday,
        week: newUsersThisWeek,
        month: newUsersThisMonth,
      },
      restaurants: {
        total: totalRestaurants,
        active: activeRestaurants,
        pending: pendingRestaurants,
      },
      orders: {
        total: totalOrders,
        today: todayOrders,
        week: weekOrders,
        month: monthOrders,
      },
      revenue: {
        today: todayRevenue[0]?.total || 0,
        week: weekRevenue[0]?.total || 0,
        month: monthRevenue[0]?.total || 0,
      },
      riders: {
        total: totalRiders,
        active: activeRiders,
      },
    });
  } catch (error) {
    console.error("Admin dashboard stats error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get recent activities
router.get(
  "/dashboard/activities",
  auth,
  authorize("admin"),
  async (req, res) => {
    try {
      const recentOrders = await Order.find()
        .populate("customerId", "name email")
        .populate("restaurantId", "name")
        .populate("riderId", "name")
        .sort({ createdAt: -1 })
        .limit(10);

      const recentUsers = await User.find().sort({ createdAt: -1 }).limit(5);

      const recentRestaurants = await Restaurant.find()
        .populate("sellerId", "name email")
        .sort({ createdAt: -1 })
        .limit(5);

      const activities = [
        ...recentOrders.map((order) => ({
          type: "order",
          title: `New order from ${order.customerId.name}`,
          description: `Order #${order.orderId} - ৳${order.totalAmount}`,
          timestamp: order.createdAt,
          data: order,
        })),
        ...recentUsers.map((user) => ({
          type: "user",
          title: `New ${user.userType} registered`,
          description: `${user.name} (${user.email})`,
          timestamp: user.createdAt,
          data: user,
        })),
        ...recentRestaurants.map((restaurant) => ({
          type: "restaurant",
          title: `New restaurant added`,
          description: `${restaurant.name} - ${restaurant.cuisineType}`,
          timestamp: restaurant.createdAt,
          data: restaurant,
        })),
      ]
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, 15);

      res.json(activities);
    } catch (error) {
      console.error("Recent activities error:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// User management
router.get("/users", auth, authorize("admin"), async (req, res) => {
  try {
    const { page = 1, limit = 10, search, userType, status } = req.query;

    let query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
      ];
    }

    if (userType && userType !== "all") {
      query.userType = userType;
    }

    const users = await User.find(query)
      .select("-password")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await User.countDocuments(query);

    res.json({
      users,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
    });
  } catch (error) {
    console.error("Get users error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/users/:userId", auth, authorize("admin"), async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Get additional user data based on user type
    let additionalData = {};

    if (user.userType === "seller") {
      const restaurant = await Restaurant.findOne({ sellerId: user._id });
      additionalData.restaurant = restaurant;
    } else if (user.userType === "rider") {
      const riderOrders = await Order.find({ riderId: user._id })
        .populate("restaurantId", "name")
        .populate("customerId", "name")
        .sort({ createdAt: -1 })
        .limit(10);
      additionalData.orders = riderOrders;
    } else if (user.userType === "customer") {
      const customerOrders = await Order.find({ customerId: user._id })
        .populate("restaurantId", "name")
        .populate("riderId", "name")
        .sort({ createdAt: -1 })
        .limit(10);
      additionalData.orders = customerOrders;
    }

    res.json({ user, ...additionalData });
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.patch(
  "/users/:userId/status",
  auth,
  authorize("admin"),
  async (req, res) => {
    try {
      const { isActive } = req.body;

      const user = await User.findByIdAndUpdate(
        req.params.userId,
        { isActive },
        { new: true }
      ).select("-password");

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json(user);
    } catch (error) {
      console.error("Update user status error:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// Restaurant management
router.get("/restaurants", auth, authorize("admin"), async (req, res) => {
  try {
    const { page = 1, limit = 10, search, status } = req.query;

    let query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { cuisineType: { $regex: search, $options: "i" } },
        { address: { $regex: search, $options: "i" } },
      ];
    }

    if (status === "active") {
      query.isActive = true;
    } else if (status === "inactive") {
      query.isActive = false;
    }

    const restaurants = await Restaurant.find(query)
      .populate("sellerId", "name email phone")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Restaurant.countDocuments(query);

    res.json({
      restaurants,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
    });
  } catch (error) {
    console.error("Get restaurants error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.get(
  "/restaurants/:restaurantId",
  auth,
  authorize("admin"),
  async (req, res) => {
    try {
      const restaurant = await Restaurant.findById(
        req.params.restaurantId
      ).populate("sellerId", "name email phone");

      if (!restaurant) {
        return res.status(404).json({ message: "Restaurant not found" });
      }

      // Get restaurant orders
      const orders = await Order.find({ restaurantId: restaurant._id })
        .populate("customerId", "name email")
        .populate("riderId", "name")
        .sort({ createdAt: -1 })
        .limit(20);

      // Get restaurant products
      const products = await Product.find({
        restaurantId: restaurant._id,
      }).sort({ createdAt: -1 });

      res.json({
        restaurant,
        orders,
        products,
        totalOrders: orders.length,
        totalProducts: products.length,
      });
    } catch (error) {
      console.error("Get restaurant error:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

router.patch(
  "/restaurants/:restaurantId/status",
  auth,
  authorize("admin"),
  async (req, res) => {
    try {
      const { isActive } = req.body;

      const restaurant = await Restaurant.findByIdAndUpdate(
        req.params.restaurantId,
        { isActive },
        { new: true }
      ).populate("sellerId", "name email");

      if (!restaurant) {
        return res.status(404).json({ message: "Restaurant not found" });
      }

      res.json(restaurant);
    } catch (error) {
      console.error("Update restaurant status error:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// Order management
router.get("/orders", auth, authorize("admin"), async (req, res) => {
  try {
    const { page = 1, limit = 10, status, search } = req.query;

    let query = {};

    if (status && status !== "all") {
      query.status = status;
    }

    if (search) {
      query.orderId = { $regex: search, $options: "i" };
    }

    const orders = await Order.find(query)
      .populate("customerId", "name email phone")
      .populate("restaurantId", "name")
      .populate("riderId", "name")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Order.countDocuments(query);

    res.json({
      orders,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
    });
  } catch (error) {
    console.error("Get orders error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Rider management
router.get("/riders", auth, authorize("admin"), async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;

    let query = { userType: "rider" };

    if (status === "active") {
      query.isAvailable = true;
    } else if (status === "inactive") {
      query.isAvailable = false;
    }

    const riders = await User.find(query)
      .select("-password")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    // Get rider stats
    const ridersWithStats = await Promise.all(
      riders.map(async (rider) => {
        const completedOrders = await Order.countDocuments({
          riderId: rider._id,
          status: "delivered",
        });

        const totalEarnings = await Order.aggregate([
          { $match: { riderId: rider._id, status: "delivered" } },
          { $group: { _id: null, total: { $sum: "$deliveryFee" } } },
        ]);

        return {
          ...rider.toObject(),
          completedOrders,
          totalEarnings: totalEarnings[0]?.total || 0,
        };
      })
    );

    const total = await User.countDocuments(query);

    res.json({
      riders: ridersWithStats,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
    });
  } catch (error) {
    console.error("Get riders error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Analytics routes
router.get("/analytics/revenue", auth, authorize("admin"), async (req, res) => {
  try {
    const { period = "week" } = req.query;
    let startDate;

    switch (period) {
      case "today":
        startDate = new Date(new Date().setHours(0, 0, 0, 0));
        break;
      case "week":
        startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "month":
        startDate = new Date(
          new Date().getFullYear(),
          new Date().getMonth(),
          1
        );
        break;
      case "year":
        startDate = new Date(new Date().getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    }

    const revenueData = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          status: "delivered",
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
          revenue: { $sum: "$totalAmount" },
          orders: { $sum: 1 },
          deliveryFees: { $sum: "$deliveryFee" },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    res.json(revenueData);
  } catch (error) {
    console.error("Revenue analytics error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
