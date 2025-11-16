const Order = require("../models/Order");

exports.createTestOrder = async (req, res) => {
  try {
    console.log("Attempting to create a test order...");

    const orderData = {
      orderId: `TEST-${Date.now()}`,
      customerId: "65a1b2c3d4e5f67890123456", // Using a hardcoded customer ID
      restaurantId: "65a1b2c3d4e5f67890123457", // Using a hardcoded restaurant ID
      items: [
        {
          productId: "65a1b2c3d4e5f67890123458", // Using a hardcoded product ID
          productName: "Test Product",
          price: 100,
          quantity: 1,
          totalPrice: 100,
        },
      ],
      totalAmount: 100,
      // Add any other required fields with default values
      deliveryAddress: "Test Address",
      customerName: "Test Customer",
      customerPhone: "1234567890",
      subtotal: 100,
      deliveryFee: 0,
      taxAmount: 0,
      paymentMethod: "cash_on_delivery",
      status: "pending",
      paymentStatus: "pending",
    };

    console.log("Test order data:", orderData);

    const order = new Order(orderData);

    await order.save();

    console.log("Test order created successfully:", order);

    res.status(201).json({
      success: true,
      message: "Test order created successfully",
      data: order,
    });
  } catch (error) {
    console.error("Test order creation error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create test order",
      error: error.message,
    });
  }
};
