const express = require("express");
const { auth, authorize } = require("../middleware/auth");
const Order = require("../models/Order");
const Product = require("../models/Product");
const Restaurant = require("../models/Restaurant");
const User = require("../models/User");
const router = express.Router();

// Customer places a new order
router.post("/", auth, authorize("customer"), async (req, res) => {
  try {
    const {
      restaurantId,
      items,
      deliveryAddress,
      deliveryLocation,
      paymentMethod,
      specialInstructions,
    } = req.body;

    // Validate restaurant
    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant || !restaurant.isActive) {
      return res.status(400).json({ message: "Restaurant not available" });
    }

    // Validate and process items
    let subtotal = 0;
    const orderItems = [];

    for (const item of items) {
      const product = await Product.findOne({
        _id: item.productId,
        restaurantId: restaurantId,
        isAvailable: true,
      });

      if (!product) {
        return res.status(400).json({
          message: `Product ${item.productId} not available`,
        });
      }

      const itemTotal = product.price * item.quantity;
      subtotal += itemTotal;

      orderItems.push({
        productId: product._id,
        productName: product.name,
        price: product.price,
        quantity: item.quantity,
        specialInstructions: item.specialInstructions || "",
        totalPrice: itemTotal,
      });
    }

    // Calculate totals
    const deliveryFee = calculateDeliveryFee(
      subtotal,
      deliveryLocation,
      restaurant.location
    );
    const taxAmount = calculateTax(subtotal);
    const totalAmount = subtotal + deliveryFee + taxAmount;

    // Calculate estimated times
    const maxPreparationTime = Math.max(
      ...orderItems.map((item) => {
        const product = items.find(
          (i) => i.productId === item.productId.toString()
        );
        return product.preparationTime || 15;
      })
    );

    const estimatedDeliveryTime = maxPreparationTime + 30; // +30 minutes for delivery

    // Create order
    const order = new Order({
      customerId: req.user.id,
      restaurantId,
      riderId: null,
      items: orderItems,
      subtotal,
      deliveryFee,
      taxAmount,
      totalAmount,
      deliveryAddress,
      deliveryLocation,
      customerPhone: req.user.phone,
      customerName: req.user.name,
      paymentMethod: paymentMethod || "cash_on_delivery",
      estimatedPreparationTime: maxPreparationTime,
      estimatedDeliveryTime: estimatedDeliveryTime,
    });

    await order.save();

    // Populate order with details
    await order.populate("restaurantId", "name address phone");
    await order.populate("customerId", "name phone");

    // Emit real-time event for restaurant
    req.app.get("io").to(restaurantId.toString()).emit("new-order", {
      orderId: order.orderId,
      order: order,
    });

    res.status(201).json(order);
  } catch (error) {
    console.error("Create order error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Get customer's order history
router.get("/my-orders", auth, authorize("customer"), async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;

    let query = { customerId: req.user.id };
    if (status && status !== "all") {
      query.status = status;
    }

    const orders = await Order.find(query)
      .populate("restaurantId", "name image cuisineType")
      .populate("riderId", "name phone vehicleType")
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
    console.error("Get customer orders error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get restaurant's orders
router.get(
  "/restaurant/orders",
  auth,
  authorize("seller"),
  async (req, res) => {
    try {
      const { page = 1, limit = 10, status } = req.query;

      // Get seller's restaurant
      const restaurant = await Restaurant.findOne({ sellerId: req.user.id });
      if (!restaurant) {
        return res.status(404).json({ message: "Restaurant not found" });
      }

      let query = { restaurantId: restaurant._id };
      if (status && status !== "all") {
        query.status = status;
      }

      const orders = await Order.find(query)
        .populate("customerId", "name phone")
        .populate("riderId", "name phone vehicleType")
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
      console.error("Get restaurant orders error:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// Update order status (Restaurant)
router.patch(
  "/:orderId/status",
  auth,
  authorize("seller"),
  async (req, res) => {
    try {
      const { orderId } = req.params;
      const { status, note } = req.body;

      const validStatuses = ["confirmed", "preparing", "ready", "rejected"];
      if (!validStatuses.includes(status)) {
        return res
          .status(400)
          .json({ message: "Invalid status for restaurant" });
      }

      // Get seller's restaurant
      const restaurant = await Restaurant.findOne({ sellerId: req.user.id });
      if (!restaurant) {
        return res.status(404).json({ message: "Restaurant not found" });
      }

      const order = await Order.findOne({
        _id: orderId,
        restaurantId: restaurant._id,
      });

      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      order.status = status;
      if (note) {
        order.statusHistory.push({ status, note });
      }

      await order.save();
      await order.populate("customerId", "name phone");

      // Emit real-time update
      req.app
        .get("io")
        .to(order.customerId._id.toString())
        .emit("order-status-updated", {
          orderId: order.orderId,
          status: order.status,
          order: order,
        });

      // If order is ready, notify available riders
      if (status === "ready") {
        await notifyAvailableRiders(order, req.app.get("io"));
      }

      res.json(order);
    } catch (error) {
      console.error("Update order status error:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// Rider accepts an order
router.patch("/:orderId/accept", auth, authorize("rider"), async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.status !== "ready") {
      return res
        .status(400)
        .json({ message: "Order is not ready for delivery" });
    }

    if (order.riderId) {
      return res
        .status(400)
        .json({ message: "Order already assigned to a rider" });
    }

    // Check if rider is available and within 3km
    const rider = await User.findById(req.user.id);
    if (!rider.isAvailable) {
      return res
        .status(400)
        .json({ message: "You are not available for delivery" });
    }

    const distance = calculateDistance(
      rider.location.latitude,
      rider.location.longitude,
      order.restaurantId.location.coordinates[1],
      order.restaurantId.location.coordinates[0]
    );

    if (distance > 3) {
      return res
        .status(400)
        .json({ message: "You are too far from the restaurant" });
    }

    // Assign rider to order
    order.riderId = req.user.id;
    order.status = "assigned";
    order.statusHistory.push({
      status: "assigned",
      note: `Rider ${rider.name} accepted the order`,
    });

    await order.save();

    // Update rider availability
    rider.isAvailable = false;
    await rider.save();

    // Populate order details
    await order.populate("restaurantId", "name address phone");
    await order.populate("customerId", "name phone address");
    await order.populate("riderId", "name phone vehicleType");

    // Emit real-time updates
    const io = req.app.get("io");
    io.to(order.restaurantId._id.toString()).emit("rider-assigned", { order });
    io.to(order.customerId._id.toString()).emit("rider-assigned", { order });
    io.emit("order-accepted", { orderId: order.orderId }); // Notify other riders

    res.json(order);
  } catch (error) {
    console.error("Accept order error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Rider updates order status
router.patch(
  "/:orderId/rider-status",
  auth,
  authorize("rider"),
  async (req, res) => {
    try {
      const { orderId } = req.params;
      const { status, location } = req.body;

      const validStatuses = ["picked_up", "on_the_way", "delivered"];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: "Invalid status for rider" });
      }

      const order = await Order.findOne({
        _id: orderId,
        riderId: req.user.id,
      });

      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      order.status = status;

      if (location) {
        order.riderLocation = {
          latitude: location.latitude,
          longitude: location.longitude,
          lastUpdated: new Date(),
        };
      }

      order.statusHistory.push({
        status,
        note: `Rider updated status to ${status}`,
      });

      // If delivered, update payment status and rider availability
      if (status === "delivered") {
        if (order.paymentMethod === "cash_on_delivery") {
          order.paymentStatus = "paid";
        }
        order.actualDeliveryTime = (new Date() - order.createdAt) / (1000 * 60); // minutes

        // Make rider available again
        await User.findByIdAndUpdate(req.user.id, { isAvailable: true });
      }

      await order.save();
      await order.populate("restaurantId", "name");
      await order.populate("customerId", "name phone");
      await order.populate("riderId", "name phone");

      // Emit real-time location/status update
      const io = req.app.get("io");
      io.to(order.restaurantId._id.toString()).emit("order-status-updated", {
        order,
      });
      io.to(order.customerId._id.toString()).emit("order-status-updated", {
        order,
      });

      if (location) {
        io.to(order.restaurantId._id.toString()).emit(
          "rider-location-updated",
          {
            orderId: order.orderId,
            location: order.riderLocation,
          }
        );
        io.to(order.customerId._id.toString()).emit("rider-location-updated", {
          orderId: order.orderId,
          location: order.riderLocation,
        });
      }

      res.json(order);
    } catch (error) {
      console.error("Rider status update error:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// Get order details
router.get("/:orderId", auth, async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId)
      .populate("restaurantId", "name address phone cuisineType image")
      .populate("customerId", "name phone")
      .populate("riderId", "name phone vehicleType");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Check if user has permission to view this order
    const user = req.user;
    if (
      user.userType === "customer" &&
      order.customerId._id.toString() !== user.id
    ) {
      return res.status(403).json({ message: "Access denied" });
    }

    if (user.userType === "seller") {
      const restaurant = await Restaurant.findOne({ sellerId: user.id });
      if (order.restaurantId._id.toString() !== restaurant._id.toString()) {
        return res.status(403).json({ message: "Access denied" });
      }
    }

    if (
      user.userType === "rider" &&
      order.riderId &&
      order.riderId._id.toString() !== user.id
    ) {
      return res.status(403).json({ message: "Access denied" });
    }

    res.json(order);
  } catch (error) {
    console.error("Get order error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Helper function to calculate delivery fee
function calculateDeliveryFee(subtotal, customerLocation, restaurantLocation) {
  const baseFee = 30;
  const freeDeliveryThreshold = 500;

  if (subtotal >= freeDeliveryThreshold) {
    return 0;
  }

  // Calculate distance between restaurant and customer
  const distance = calculateDistance(
    customerLocation.latitude,
    customerLocation.longitude,
    restaurantLocation.coordinates[1],
    restaurantLocation.coordinates[0]
  );

  // Additional fee based on distance
  const distanceFee = Math.max(0, (distance - 2) * 10); // 10 tk per km after 2km

  return baseFee + distanceFee;
}

// Helper function to calculate tax
function calculateTax(subtotal) {
  const taxRate = 0.05; // 5% VAT
  return subtotal * taxRate;
}

// Helper function to calculate distance (same as before)
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Helper function to notify available riders
async function notifyAvailableRiders(order, io) {
  try {
    const availableRiders = await User.find({
      userType: "rider",
      isAvailable: true,
      "location.latitude": { $exists: true },
      "location.longitude": { $exists: true },
    });

    const restaurant = await Restaurant.findById(order.restaurantId);

    const nearbyRiders = availableRiders.filter((rider) => {
      const distance = calculateDistance(
        rider.location.latitude,
        rider.location.longitude,
        restaurant.location.coordinates[1],
        restaurant.location.coordinates[0]
      );
      return distance <= 3; // 3km radius
    });

    // Notify each nearby rider
    nearbyRiders.forEach((rider) => {
      io.to(rider._id.toString()).emit("new-delivery-request", {
        orderId: order.orderId,
        order: order,
        restaurant: restaurant,
        customer: order.customerId,
        distance: calculateDistance(
          rider.location.latitude,
          rider.location.longitude,
          restaurant.location.coordinates[1],
          restaurant.location.coordinates[0]
        ),
      });
    });

    return nearbyRiders.length;
  } catch (error) {
    console.error("Notify riders error:", error);
    return 0;
  }
}

module.exports = router;
