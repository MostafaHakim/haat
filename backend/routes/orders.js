// routes/order.routes.js
const express = require("express");
const router = express.Router();

const { auth, authorize } = require("../middleware/auth");
const orderController = require("../controller/order.controller"); // path adjust if needed
const Order = require("../models/order.model");
const Restaurant = require("../models/Restaurant");
const User = require("../models/User");

// create order
router.post("/", auth, authorize("customer"), orderController.createOrder);

// get customer's orders
router.get("/my-orders", auth, authorize("customer"), async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const query = { customerId: req.user.id };
    if (status && status !== "all") query.status = status;

    const orders = await Order.find(query)
      .populate("restaurantId", "name image cuisineType")
      .populate("riderId", "name phone vehicleType")
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Order.countDocuments(query);
    res.json({
      success: true,
      orders,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total,
    });
  } catch (error) {
    console.error("Get customer orders error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// get restaurant's orders (seller)
router.get(
  "/restaurant/orders",
  auth,
  authorize("seller"),
  async (req, res) => {
    try {
      const { page = 1, limit = 10, status } = req.query;
      const restaurant = await Restaurant.findOne({ sellerId: req.user.id });
      if (!restaurant)
        return res
          .status(404)
          .json({ success: false, message: "Restaurant not found" });

      const query = { restaurantId: restaurant._id };
      if (status && status !== "all") query.status = status;

      const orders = await Order.find(query)
        .populate("customerId", "name phone")
        .populate("riderId", "name phone vehicleType")
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .skip((parseInt(page) - 1) * parseInt(limit));

      const total = await Order.countDocuments(query);
      res.json({
        success: true,
        orders,
        totalPages: Math.ceil(total / limit),
        currentPage: parseInt(page),
        total,
      });
    } catch (error) {
      console.error("Get restaurant orders error:", error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  }
);

// restaurant updates order status
router.patch(
  "/:orderId/status",
  auth,
  authorize("seller"),
  async (req, res) => {
    try {
      const { orderId } = req.params;
      const { status, note } = req.body;

      const validStatuses = ["confirmed", "preparing", "ready", "rejected"];
      if (!validStatuses.includes(status))
        return res
          .status(400)
          .json({ success: false, message: "Invalid status for restaurant" });

      const restaurant = await Restaurant.findOne({ sellerId: req.user.id });
      if (!restaurant)
        return res
          .status(404)
          .json({ success: false, message: "Restaurant not found" });

      const order = await Order.findOne({
        _id: orderId,
        restaurantId: restaurant._id,
      });
      if (!order)
        return res
          .status(404)
          .json({ success: false, message: "Order not found" });

      order.status = status;
      order.statusHistory.push({ status, note, timestamp: new Date() });
      await order.save();
      await order.populate("customerId", "name phone");

      // emit
      if (req.app && req.app.get("io")) {
        req.app
          .get("io")
          .to(order.customerId._id.toString())
          .emit("order-status-updated", {
            orderId: order.orderId,
            status: order.status,
            order,
          });
        if (status === "ready") {
          // notify riders via controller helper
          const io = req.app.get("io");
          const {
            notifyAvailableRiders,
          } = require("../controllers/order.controller");
          await notifyAvailableRiders(order, io);
        }
      }

      res.json({ success: true, data: order });
    } catch (error) {
      console.error("Update order status error:", error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  }
);

// rider accepts order
router.patch("/:orderId/accept", auth, authorize("rider"), async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findById(orderId)
      .populate("restaurantId")
      .populate("customerId");
    if (!order)
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });

    if (order.status !== "ready")
      return res
        .status(400)
        .json({ success: false, message: "Order is not ready for delivery" });
    if (order.riderId)
      return res
        .status(400)
        .json({ success: false, message: "Order already assigned" });

    const rider = await User.findById(req.user.id);
    if (!rider || !rider.isAvailable)
      return res.status(400).json({
        success: false,
        message: "You are not available for delivery",
      });

    // distance check if both have locations
    if (
      rider.location &&
      rider.location.latitude &&
      rider.location.longitude &&
      order.restaurantId.location &&
      order.restaurantId.location.coordinates
    ) {
      const distance =
        require("../controllers/order.controller").calculateDistance(
          rider.location.latitude,
          rider.location.longitude,
          order.restaurantId.location.coordinates[1],
          order.restaurantId.location.coordinates[0]
        );
      if (distance > 3)
        return res.status(400).json({
          success: false,
          message: "You are too far from the restaurant",
        });
    }

    order.riderId = req.user.id;
    order.status = "assigned";
    order.statusHistory.push({
      status: "assigned",
      note: `Rider ${rider.name} accepted the order`,
      timestamp: new Date(),
    });
    await order.save();

    rider.isAvailable = false;
    await rider.save();

    await order.populate("restaurantId", "name address phone");
    await order.populate("customerId", "name phone address");
    await order.populate("riderId", "name phone vehicleType");

    if (req.app && req.app.get("io")) {
      const io = req.app.get("io");
      io.to(order.restaurantId._id.toString()).emit("rider-assigned", {
        order,
      });
      io.to(order.customerId._id.toString()).emit("rider-assigned", { order });
      io.emit("order-accepted", { orderId: order.orderId });
    }

    res.json({ success: true, data: order });
  } catch (error) {
    console.error("Accept order error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// get order details
router.get("/:orderId", auth, async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findById(orderId)
      .populate("restaurantId", "name address phone cuisineType image location")
      .populate("customerId", "name phone")
      .populate("riderId", "name phone vehicleType");

    if (!order)
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });

    const user = req.user;
    if (
      user.userType === "customer" &&
      order.customerId._id.toString() !== user.id
    )
      return res.status(403).json({ success: false, message: "Access denied" });

    if (user.userType === "seller") {
      const restaurant = await Restaurant.findOne({ sellerId: user.id });
      if (
        !restaurant ||
        order.restaurantId._id.toString() !== restaurant._id.toString()
      )
        return res
          .status(403)
          .json({ success: false, message: "Access denied" });
    }

    if (
      user.userType === "rider" &&
      order.riderId &&
      order.riderId._id.toString() !== user.id
    )
      return res.status(403).json({ success: false, message: "Access denied" });

    res.json({ success: true, data: order });
  } catch (error) {
    console.error("Get order error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;
