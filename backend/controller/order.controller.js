// controllers/order.controller.js
const Order = require("../models/order.model");
const Product = require("../models/Product");
const Restaurant = require("../models/Restaurant");
const User = require("../models/User");

// Helper: Haversine distance in km
function calculateDistance(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 0;
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function calculateDeliveryFee(subtotal, customerLocation, restaurantLocation) {
  const baseFee = 30;
  const freeDeliveryThreshold = 500;

  if (subtotal >= freeDeliveryThreshold) return 0;

  if (
    customerLocation &&
    restaurantLocation &&
    restaurantLocation.coordinates
  ) {
    const distance = calculateDistance(
      customerLocation.latitude,
      customerLocation.longitude,
      restaurantLocation.coordinates[1],
      restaurantLocation.coordinates[0]
    );
    const distanceFee = Math.max(0, Math.round((distance - 2) * 10)); // 10 per km after 2km
    return baseFee + distanceFee;
  }

  return baseFee;
}

function calculateTax(subtotal) {
  const taxRate = 0.05;
  return Math.round(subtotal * taxRate * 100) / 100;
}

async function calculateMaxPreparationTime(items = []) {
  let maxTime = 15;
  try {
    for (const item of items) {
      const product = await Product.findById(item.productId).select(
        "preparationTime"
      );
      if (product && product.preparationTime) {
        maxTime = Math.max(maxTime, product.preparationTime);
      }
    }
  } catch (err) {
    console.error("Error calculating preparation time:", err);
    return 30;
  }
  return maxTime;
}

async function notifyAvailableRiders(order, io) {
  try {
    const availableRiders = await User.find({
      userType: "rider",
      isAvailable: true,
      "location.latitude": { $exists: true },
      "location.longitude": { $exists: true },
    });

    const restaurant = await Restaurant.findById(order.restaurantId);
    if (!restaurant || !restaurant.location) return 0;

    const nearbyRiders = availableRiders.filter((rider) => {
      const distance = calculateDistance(
        rider.location.latitude,
        rider.location.longitude,
        restaurant.location.coordinates[1],
        restaurant.location.coordinates[0]
      );
      return distance <= 3;
    });

    nearbyRiders.forEach((rider) => {
      io.to(rider._id.toString()).emit("new-delivery-request", {
        orderId: order.orderId,
        order,
        restaurant,
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

exports.createOrder = async (req, res) => {
  try {
    const {
      restaurantId,
      items,
      deliveryAddress,
      deliveryLocation,
      paymentMethod,
      specialInstructions,
      customerName,
      customerPhone,
    } = req.body;

    // Validate required fields
    if (
      !restaurantId ||
      !items ||
      !Array.isArray(items) ||
      items.length === 0 ||
      !deliveryAddress
    ) {
      return res.status(400).json({
        success: false,
        message: "Missing required: restaurantId, items, deliveryAddress",
      });
    }

    // Verify restaurant
    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant)
      return res
        .status(400)
        .json({ success: false, message: "Restaurant not found" });
    if (!restaurant.isActive)
      return res
        .status(400)
        .json({ success: false, message: "Restaurant is not active" });

    // Process items
    let calculatedSubtotal = 0;
    const orderItems = [];

    for (const item of items) {
      if (!item.productId || !item.quantity) {
        return res.status(400).json({
          success: false,
          message: "Each item must have productId and quantity",
        });
      }

      const product = await Product.findOne({
        _id: item.productId,
        restaurantId: restaurantId,
        isAvailable: true,
      });
      if (!product) {
        return res.status(400).json({
          success: false,
          message: `Product ${item.productId} not available`,
        });
      }

      const itemTotal = product.price * item.quantity;
      calculatedSubtotal += itemTotal;

      orderItems.push({
        productId: product._id,
        productName: product.name,
        price: product.price,
        quantity: item.quantity,
        specialInstructions: item.specialInstructions || "",
        totalPrice: itemTotal,
      });
    }

    const finalSubtotal = calculatedSubtotal;
    const finalDeliveryFee = calculateDeliveryFee(
      finalSubtotal,
      deliveryLocation,
      restaurant.location
    );
    const finalTaxAmount = calculateTax(finalSubtotal);
    const finalTotalAmount = +(
      finalSubtotal +
      finalDeliveryFee +
      finalTaxAmount
    ).toFixed(2);

    const maxPreparationTime = await calculateMaxPreparationTime(items);
    const estimatedDeliveryTime = maxPreparationTime + 30;

    const finalCustomerName = customerName || req.user.name;
    const finalCustomerPhone = customerPhone || req.user.phone;

    if (!finalCustomerName || !finalCustomerPhone) {
      return res.status(400).json({
        success: false,
        message: "Customer name and phone are required",
      });
    }

    const newOrder = new Order({
      customerId: req.user.id,
      restaurantId,
      riderId: null,
      items: orderItems,
      subtotal: finalSubtotal,
      deliveryFee: finalDeliveryFee,
      taxAmount: finalTaxAmount,
      totalAmount: finalTotalAmount,
      deliveryAddress,
      deliveryLocation: {
        type: "Point",
        coordinates: [deliveryLocation.longitude, deliveryLocation.latitude],
        latitude: deliveryLocation.latitude,
        longitude: deliveryLocation.longitude,
      },
      customerPhone: finalCustomerPhone,
      customerName: finalCustomerName,
      paymentMethod: paymentMethod || "cash_on_delivery",
      specialInstructions: specialInstructions || "",
      estimatedPreparationTime: maxPreparationTime,
      estimatedDeliveryTime,
      status: "pending",
      paymentStatus: paymentMethod === "cash_on_delivery" ? "pending" : "paid",
      statusHistory: [
        { status: "pending", note: "Order created", timestamp: new Date() },
      ],
    });

    await newOrder.save();

    // Populate restaurant & customer
    await newOrder.populate("restaurantId", "name address phone");
    await newOrder.populate("customerId", "name phone");

    // Socket emit to restaurant
    if (req.app && req.app.get("io")) {
      req.app.get("io").to(restaurantId.toString()).emit("new-order", {
        orderId: newOrder.orderId,
        order: newOrder,
      });
    }

    return res.status(201).json({
      success: true,
      message: "Order created successfully",
      data: newOrder,
    });
  } catch (error) {
    console.error("Create order error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};

exports.updateRiderOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status, location } = req.body;
    const riderId = req.user.id;

    // 1. Validate input
    if (!status) {
      return res.status(400).json({ success: false, message: "Status is required." });
    }
    const validRiderStatuses = ["picked_up", "on_the_way", "delivered", "cancelled"];
    if (!validRiderStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: `Invalid status: ${status}` });
    }

    // 2. Find and verify the order
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found." });
    }

    if (!order.riderId || order.riderId.toString() !== riderId) {
      return res.status(403).json({ success: false, message: "You are not assigned to this order." });
    }

    // 3. Prepare status history entry
    const statusUpdate = {
      status,
      note: `Rider updated status to ${status}`,
      timestamp: new Date(),
    };

    if (location && location.latitude && location.longitude) {
      statusUpdate.location = {
        type: "Point",
        coordinates: [location.longitude, location.latitude],
        latitude: location.latitude,
        longitude: location.longitude,
      };
      // Also update the main riderLocation field for quick access
      order.riderLocation = {
        riderId,
        latitude: location.latitude,
        longitude: location.longitude,
        address: location.address,
        lastUpdated: new Date(),
      };
    }

    // 4. Update order
    order.status = status;
    order.statusHistory.push(statusUpdate);

    // If delivered, make rider available again
    if (status === "delivered") {
      const rider = await User.findById(riderId);
      if (rider) {
        rider.isAvailable = true;
        await rider.save();
      }
    }

    await order.save();

    // 5. Populate and emit notifications
    const populatedOrder = await Order.findById(order._id)
      .populate("restaurantId", "name phone")
      .populate("customerId", "name phone");

    const io = req.app.get("io");
    if (io) {
      const customerRoom = populatedOrder.customerId._id.toString();
      io.to(customerRoom).emit("order-status-updated", {
        orderId: populatedOrder.orderId,
        status: populatedOrder.status,
        order: populatedOrder,
      });
    }

    // 6. Send response
    res.json({
      success: true,
      message: `Order status updated to ${status}`,
      data: populatedOrder,
    });

  } catch (error) {
    console.error("Rider status update error:", error);
    res.status(500).json({ success: false, message: "Server error while updating status." });
  }
};

// Export helpers
exports.notifyAvailableRiders = notifyAvailableRiders;
exports.calculateDistance = calculateDistance;