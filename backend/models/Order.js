const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  productName: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
    default: 1,
  },
  specialInstructions: {
    type: String,
    default: "",
  },
  totalPrice: {
    type: Number,
    required: true,
    min: 0,
  },
});

const orderSchema = new mongoose.Schema(
  {
    orderId: {
      type: String,
      unique: true,
      required: true,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
    },
    riderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    items: [orderItemSchema],

    // Order totals
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    deliveryFee: {
      type: Number,
      default: 0,
      min: 0,
    },
    taxAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    discountAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    // Delivery information
    deliveryAddress: {
      type: String,
      required: true,
    },
    deliveryLocation: {
      latitude: { type: Number, required: true },
      longitude: { type: Number, required: true },
      address: { type: String, required: true },
    },
    customerPhone: {
      type: String,
      required: true,
    },
    customerName: {
      type: String,
      required: true,
    },

    // Order status tracking
    status: {
      type: String,
      enum: [
        "pending", // Order placed, waiting for restaurant confirmation
        "confirmed", // Restaurant accepted the order
        "preparing", // Restaurant is preparing food
        "ready", // Food is ready for pickup
        "assigned", // Rider assigned to order
        "picked_up", // Rider picked up the order
        "on_the_way", // Rider is on the way to customer
        "delivered", // Order delivered to customer
        "cancelled", // Order cancelled
        "rejected", // Restaurant rejected the order
      ],
      default: "pending",
    },

    // Timestamps for each status
    statusHistory: [
      {
        status: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
        note: { type: String },
      },
    ],

    // Payment information
    paymentMethod: {
      type: String,
      enum: ["cash_on_delivery", "card", "digital_wallet"],
      default: "cash_on_delivery",
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
    },
    paymentId: {
      type: String,
    },

    // Preparation and delivery time estimates
    estimatedPreparationTime: {
      type: Number, // in minutes
    },
    estimatedDeliveryTime: {
      type: Number, // in minutes
    },
    actualDeliveryTime: {
      type: Number, // in minutes
    },

    // Rider location tracking
    riderLocation: {
      latitude: Number,
      longitude: Number,
      lastUpdated: Date,
    },

    // Ratings and reviews
    customerRating: {
      type: Number,
      min: 1,
      max: 5,
    },
    customerReview: {
      type: String,
    },
    riderRating: {
      type: Number,
      min: 1,
      max: 5,
    },
  },
  {
    timestamps: true,
  }
);

// Generate unique order ID before saving
orderSchema.pre("save", async function (next) {
  if (this.isNew) {
    const date = new Date();
    const timestamp = date.getTime();
    const random = Math.floor(Math.random() * 1000);
    this.orderId = `ORD-${timestamp}-${random}`;

    // Add initial status to history
    this.statusHistory.push({
      status: this.status,
      note: "Order placed",
    });
  }

  // When status changes, add to history
  if (this.isModified("status") && !this.isNew) {
    this.statusHistory.push({
      status: this.status,
      note: `Status changed to ${this.status}`,
    });
  }

  next();
});

// Indexes for better performance
orderSchema.index({ customerId: 1, createdAt: -1 });
orderSchema.index({ restaurantId: 1, status: 1 });
orderSchema.index({ riderId: 1, status: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ createdAt: -1 });

// Virtual for total items count
orderSchema.virtual("totalItems").get(function () {
  return this.items.reduce((total, item) => total + item.quantity, 0);
});

// Method to calculate ETA
orderSchema.methods.calculateETA = function () {
  if (this.status === "delivered") {
    return 0;
  }

  const now = new Date();
  const orderTime = new Date(this.createdAt);
  const elapsed = (now - orderTime) / (1000 * 60); // minutes

  if (this.estimatedDeliveryTime) {
    return Math.max(0, this.estimatedDeliveryTime - elapsed);
  }

  return null;
};

module.exports = mongoose.model("Order", orderSchema);
