const express = require("express");
const mongoose = require("mongoose");
const http = require("http");
const socketIo = require("socket.io");
const cors = require("cors");
require("dotenv").config();

const Order = require("./models/order.model"); // ✅ Missing import fixed

const app = express();
const server = http.createServer(app);

const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PATCH"],
  },
});

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.error("MongoDB Error:", err));

// Make io accessible in all controllers
app.set("io", io);

// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/users", require("./routes/users"));
app.use("/api/restaurants", require("./routes/restaurants"));
app.use("/api/products", require("./routes/products"));
app.use("/api/orders", require("./routes/orders")); // ⚠️ Ensure this file exists

// Base route
app.get("/", (req, res) => {
  res.json({ message: "Food Delivery Backend Running" });
});

// Socket.io Handling
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("join-user", (userId) => {
    socket.join(userId);
    console.log(`User ${userId} joined`);
  });

  socket.on("join-restaurant", (restaurantId) => {
    socket.join(restaurantId);
    console.log(`Restaurant ${restaurantId} joined`);
  });

  socket.on("join-rider", (riderId) => {
    socket.join(riderId);
    console.log(`Rider ${riderId} joined`);
  });

  // Rider live location
  socket.on("rider-location-update", async (data) => {
    const { orderId, riderId, latitude, longitude, restaurantId, customerId } =
      data;

    // Broadcast to restaurant & customer
    socket.to(restaurantId).emit("rider-location-changed", data);
    socket.to(customerId).emit("rider-location-changed", data);

    // Save location in DB
    try {
      await Order.findByIdAndUpdate(orderId, {
        riderLocation: {
          riderId,
          latitude,
          longitude,
          lastUpdated: new Date(),
        },
      });
    } catch (err) {
      console.error("Rider location update failed:", err);
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
