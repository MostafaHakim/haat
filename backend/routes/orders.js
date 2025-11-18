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

// get rider's orders
router.get("/my-rider-orders", auth, authorize("rider"), async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const query = { riderId: req.user.id };
    if (status && status !== "all") query.status = status;

    const orders = await Order.find(query)
      .populate("restaurantId", "name image cuisineType")
      .populate("customerId", "name phone")
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
    console.error("Get rider orders error:", error);
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

// get available orders for riders
router.get("/available", auth, authorize("rider"), async (req, res) => {
  try {
    const rider = req.user;
    if (!rider.location || !rider.location.latitude) {
      return res.json({ success: true, data: [] }); // Return empty if rider location is not set
    }

    const availableOrders = await Order.find({
      status: "ready",
      riderId: null,
    }).populate("restaurantId", "name address location");

    const nearbyOrders = availableOrders.filter((order) => {
      if (
        !order.restaurantId ||
        !order.restaurantId.location ||
        !order.restaurantId.location.coordinates
      ) {
        return false;
      }
      const distance = orderController.calculateDistance(
        rider.location.latitude,
        rider.location.longitude,
        order.restaurantId.location.coordinates[1],
        order.restaurantId.location.coordinates[0]
      );
      return distance <= 3; // 3km radius
    });

    res.json({ success: true, data: nearbyOrders });
  } catch (error) {
    console.error("Get available orders error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

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

// rider accepts order - COMPLETELY FIXED VERSION
router.patch("/:orderId/accept", auth, authorize("rider"), async (req, res) => {
  try {
    console.log(
      "🛵 ACCEPT ORDER REQUEST - Rider:",
      req.user.id,
      "Order:",
      req.params.orderId
    );

    const { orderId } = req.params;

    // ✅ SAFE: Find order with proper error handling
    const order = await Order.findById(orderId);
    if (!order) {
      console.log("❌ Order not found:", orderId);
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    console.log(
      "📦 Order found - Status:",
      order.status,
      "Rider:",
      order.riderId
    );

    // ✅ Check order status
    if (order.status !== "ready") {
      return res.status(400).json({
        success: false,
        message: `Order is ${order.status}, not ready for delivery`,
      });
    }

    // ✅ Check if already assigned
    if (order.riderId) {
      return res.status(400).json({
        success: false,
        message: "Order already assigned to another rider",
      });
    }

    // ✅ Get rider with availability check
    const rider = await User.findById(req.user.id);
    if (!rider) {
      return res.status(404).json({
        success: false,
        message: "Rider not found",
      });
    }

    if (!rider.isAvailable) {
      return res.status(400).json({
        success: false,
        message: "You are not available for delivery. Please go online first.",
      });
    }

    console.log("✅ Rider check passed - Available:", rider.isAvailable);

    // ✅ SAFE DISTANCE CHECK - With proper error handling
    try {
      if (
        rider.location &&
        rider.location.latitude &&
        rider.location.longitude
      ) {
        // Populate restaurant for location data
        await order.populate("restaurantId", "name location");

        const restaurant = order.restaurantId;
        if (
          restaurant &&
          restaurant.location &&
          restaurant.location.coordinates
        ) {
          const calculateDistance =
            require("../controllers/order.controller").calculateDistance;

          const riderLat = rider.location.latitude;
          const riderLng = rider.location.longitude;
          const restLat = restaurant.location.coordinates[1];
          const restLng = restaurant.location.coordinates[0];

          console.log(
            "📍 Location Data - Rider:",
            { riderLat, riderLng },
            "Restaurant:",
            { restLat, restLng }
          );

          if (riderLat && riderLng && restLat && restLng) {
            const distance = calculateDistance(
              riderLat,
              riderLng,
              restLat,
              restLng
            );
            console.log("📏 Distance calculated:", distance, "km");

            if (distance > 3) {
              return res.status(400).json({
                success: false,
                message: `You are ${distance.toFixed(
                  1
                )}km away from the restaurant (max 3km allowed)`,
              });
            }
          }
        } else {
          console.log("⚠️ Restaurant location data missing");
        }
      } else {
        console.log("⚠️ Rider location data missing");
      }
    } catch (distanceError) {
      console.warn("📍 Distance calculation skipped:", distanceError.message);
      // Continue without distance check if calculation fails
    }

    // ✅ UPDATE ORDER - Simple and safe
    order.riderId = req.user.id;
    order.status = "assigned";
    order.statusHistory.push({
      status: "assigned",
      note: `Rider ${rider.name} accepted the order`,
      timestamp: new Date(),
    });

    await order.save();
    console.log("✅ Order updated successfully");

    // ✅ UPDATE RIDER AVAILABILITY
    rider.isAvailable = false;
    await rider.save();
    console.log("✅ Rider availability updated");

    // ✅ POPULATE FOR RESPONSE - With safe checks
    const populatedOrder = await Order.findById(order._id)
      .populate("restaurantId", "name address phone")
      .populate("customerId", "name phone")
      .populate("riderId", "name phone vehicleType");

    // ✅ SAFE SOCKET EMISSIONS
    if (req.app && req.app.get("io")) {
      const io = req.app.get("io");

      try {
        // Emit to restaurant if available
        if (populatedOrder.restaurantId && populatedOrder.restaurantId._id) {
          io.to(populatedOrder.restaurantId._id.toString()).emit(
            "rider-assigned",
            {
              order: populatedOrder,
            }
          );
          console.log(
            "📢 Emitted to restaurant:",
            populatedOrder.restaurantId._id
          );
        }

        // Emit to customer if available
        if (populatedOrder.customerId && populatedOrder.customerId._id) {
          io.to(populatedOrder.customerId._id.toString()).emit(
            "rider-assigned",
            {
              order: populatedOrder,
            }
          );
          console.log("📢 Emitted to customer:", populatedOrder.customerId._id);
        }

        // Broadcast general event
        io.emit("order-accepted", {
          orderId: populatedOrder.orderId || populatedOrder._id,
        });
        console.log("📢 Broadcasted order acceptance");
      } catch (socketError) {
        console.warn("⚠️ Socket emission failed:", socketError.message);
        // Don't fail the request if sockets fail
      }
    }

    console.log("🎉 ORDER ACCEPTED SUCCESSFULLY");
    res.json({
      success: true,
      data: populatedOrder,
      message: "Order accepted successfully",
    });
  } catch (error) {
    console.error("🔥 ACCEPT ORDER ERROR:", error);
    console.error("Error Stack:", error.stack);

    res.status(500).json({
      success: false,
      message: "Internal server error while accepting order",
      ...(process.env.NODE_ENV === "development" && {
        error: error.message,
        stack: error.stack,
      }),
    });
  }
});

// router.patch(
//   "/:orderId/rider-status",
//   auth,
//   authorize("rider"),
//   async (req, res) => {
//     try {
//       console.log("🎯 RIDER STATUS UPDATE REQUEST:");
//       console.log("Order ID:", req.params.orderId);
//       console.log("Rider ID:", req.user.id);
//       console.log("New Status:", req.body.status);
//       console.log("Location:", req.body.location);

//       const { orderId } = req.params;
//       const { status, location } = req.body;

//       // ✅ Validate status
//       const validRiderStatuses = [
//         "picked_up",
//         "on_the_way",
//         "delivered",
//         "cancelled",
//       ];
//       if (!validRiderStatuses.includes(status)) {
//         console.log("❌ Invalid status:", status);
//         return res.status(400).json({
//           success: false,
//           message: `Invalid status. Must be one of: ${validRiderStatuses.join(
//             ", "
//           )}`,
//         });
//       }

//       // ✅ Find order
//       const order = await Order.findById(orderId);
//       if (!order) {
//         console.log("❌ Order not found:", orderId);
//         return res.status(404).json({
//           success: false,
//           message: "Order not found",
//         });
//       }

//       console.log(
//         "📦 Order found - Current status:",
//         order.status,
//         "Rider:",
//         order.riderId
//       );

//       // ✅ Check rider ownership
//       if (!order.riderId) {
//         return res.status(400).json({
//           success: false,
//           message: "No rider assigned to this order",
//         });
//       }

//       if (order.riderId.toString() !== req.user.id) {
//         console.log(
//           "❌ Rider mismatch - Order rider:",
//           order.riderId,
//           "Request rider:",
//           req.user.id
//         );
//         return res.status(403).json({
//           success: false,
//           message: "You are not assigned to this order",
//         });
//       }

//       // ✅ Update order
//       const previousStatus = order.status;
//       order.status = status;
//       order.statusHistory.push({
//         status: status,
//         note: `Rider updated status from ${previousStatus} to ${status}`,
//         timestamp: new Date(),
//       });

//       // ✅ Update rider location
//       if (location) {
//         order.riderLocation = {
//           riderId: req.user.id,
//           latitude: location.latitude,
//           longitude: location.longitude,
//           address: location.address,
//           lastUpdated: new Date(),
//         };
//       }

//       await order.save();
//       console.log("✅ Order saved with new status:", order.status);

//       // ✅ Populate for response
//       const populatedOrder = await Order.findById(order._id)
//         .populate("restaurantId", "name address phone")
//         .populate("customerId", "name phone address")
//         .populate("riderId", "name phone vehicleType");

//       // ✅ Socket notifications
//       if (req.app && req.app.get("io")) {
//         const io = req.app.get("io");

//         if (populatedOrder.restaurantId) {
//           io.to(populatedOrder.restaurantId._id.toString()).emit(
//             "order-status-updated",
//             {
//               orderId: populatedOrder.orderId,
//               status: status,
//               order: populatedOrder,
//             }
//           );
//         }

//         if (populatedOrder.customerId) {
//           io.to(populatedOrder.customerId._id.toString()).emit(
//             "order-status-updated",
//             {
//               orderId: populatedOrder.orderId,
//               status: status,
//               order: populatedOrder,
//             }
//           );
//         }

//         console.log("📢 Socket notifications sent");
//       }

//       console.log("🎉 Rider status update successful");
//       res.json({
//         success: true,
//         data: populatedOrder,
//         message: `Order status updated to ${status}`,
//       });
//     } catch (error) {
//       console.error("🔥 RIDER STATUS UPDATE ERROR:", error);
//       console.error("Error Stack:", error.stack);

//       res.status(500).json({
//         success: false,
//         message: "Internal server error",
//         error:
//           process.env.NODE_ENV === "development" ? error.message : undefined,
//       });
//     }
//   }
// );
// routes/order.routes.js - SIMPLIFIED rider-status route

// THIS IS THE NEW, CORRECT ROUTE
router.patch(
  "/:orderId/rider/update-status",
  auth,
  authorize("rider"),
  orderController.updateRiderOrderStatus
);

// routes/order.routes.js - SIMPLIFIED rider-status route

// THIS IS THE NEW, CORRECT ROUTE
router.patch(
  "/:orderId/rider/update-status",
  auth,
  authorize("rider"),
  orderController.updateRiderOrderStatus
);

router.patch(
  "/:orderId/rider-status",
  auth,
  authorize("rider"),
  async (req, res) => {
    try {
      console.log("🎯 SIMPLE RIDER STATUS UPDATE:");
      console.log("Order ID:", req.params.orderId);
      console.log("Status:", req.body.status);

      const { orderId } = req.params;
      const { status } = req.body;

      // ✅ Simple validation
      if (!status) {
        return res.status(400).json({
          success: false,
          message: "Status is required",
        });
      }

      // ✅ Find order
      const order = await Order.findById(orderId);
      if (!order) {
        return res.status(404).json({
          success: false,
          message: "Order not found",
        });
      }

      console.log("📦 Order found - Rider:", order.riderId);

      // ✅ Check rider ownership
      if (!order.riderId || order.riderId.toString() !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: "You are not assigned to this order",
        });
      }

      // ✅ SIMPLE STATUS UPDATE
      order.status = status;
      order.statusHistory.push({
        status: status,
        note: `Status updated by rider`,
        timestamp: new Date(),
      });

      await order.save();
      console.log("✅ Status updated to:", status);

      res.json({
        success: true,
        data: order,
        message: `Status updated to ${status}`,
      });
    } catch (error) {
      console.error("🔥 SIMPLE RIDER STATUS ERROR:", error.message);

      res.status(500).json({
        success: false,
        message: "Failed to update status",
      });
    }
  }
);
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
