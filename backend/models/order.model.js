const mongoose = require("mongoose");
const Schema = mongoose.Schema;

/* ========================
      ORDER ITEM SCHEMA
======================== */
const OrderItemSchema = new Schema(
  {
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    productName: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1 },
    specialInstructions: { type: String, default: "" },
    totalPrice: { type: Number, required: true },
  },
  { _id: false }
);

/* ========================
       GEO LOCATION SCHEMA
======================== */
const GeoLocationSchema = new Schema(
  {
    type: { type: String, enum: ["Point"], default: "Point" },
    coordinates: { type: [Number] }, // [lng, lat]

    // storing separately for flexibility (optional)
    latitude: { type: Number },
    longitude: { type: Number },
  },
  { _id: false }
);

/* ========================
    STATUS HISTORY SCHEMA
======================== */
const StatusHistorySchema = new Schema(
  {
    status: { type: String, required: true },
    note: { type: String },
    timestamp: { type: Date, default: Date.now },
    location: { type: GeoLocationSchema, required: false },
  },
  { _id: false }
);

/* ========================
        ORDER SCHEMA
======================== */
const OrderSchema = new Schema(
  {
    orderId: { type: String, unique: true, index: true },

    customerId: { type: Schema.Types.ObjectId, ref: "User", required: true },

    restaurantId: {
      type: Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
    },

    riderId: { type: Schema.Types.ObjectId, ref: "User", default: null },

    items: { type: [OrderItemSchema], required: true },

    subtotal: { type: Number, required: true, default: 0 },
    deliveryFee: { type: Number, required: true, default: 0 },
    taxAmount: { type: Number, required: true, default: 0 },
    totalAmount: { type: Number, required: true, default: 0 },

    deliveryAddress: { type: String, required: true },

    deliveryLocation: { type: GeoLocationSchema },

    customerPhone: { type: String, required: true },
    customerName: { type: String, required: true },

    paymentMethod: {
      type: String,
      enum: ["cash_on_delivery", "card", "wallet", "online"],
      default: "cash_on_delivery",
    },

    specialInstructions: { type: String, default: "" },

    estimatedPreparationTime: { type: Number, default: 0 },
    estimatedDeliveryTime: { type: Number, default: 0 },

    status: {
      type: String,
      enum: [
        "pending",
        "confirmed",
        "preparing",
        "ready",
        "assigned",
        "picked_up",
        "on_way",
        "delivered",
        "rejected",
        "cancelled",
      ],
      default: "pending",
    },

    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
    },

    statusHistory: { type: [StatusHistorySchema], default: [] },
  },
  { timestamps: true }
);

/* ========================
  AUTO GENERATE orderId
======================== */
OrderSchema.pre("validate", function (next) {
  if (!this.orderId) {
    this.orderId = "ORD-" + `${Date.now()}`; // Example: ORD-X92kL0aPq
  }
  next();
});

/* ========================
  2DSPHERE GEO INDEX
======================== */
OrderSchema.index({ "deliveryLocation.coordinates": "2dsphere" });

module.exports = mongoose.model("Order", OrderSchema);
// Temporary comment to force server reload

// Temporary comment to force server reload

