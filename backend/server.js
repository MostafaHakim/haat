const express = require("express");
const mongoose = require("mongoose");
const http = require("http");
const socketIo = require("socket.io");
const cors = require("cors");
require("dotenv").config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(
  process.env.MONGODB_URI || "mongodb://localhost:27017/food_delivery",
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }
);

// Make io accessible to routes
app.set("io", io);

// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/users", require("./routes/users"));
app.use("/api/restaurants", require("./routes/restaurants"));
app.use("/api/products", require("./routes/products"));
app.use("/api/orders", require("./routes/orders")); // ✅ নতুন অর্ডার রাউট যোগ করুন

// বেসিক রাউট
app.get("/", (req, res) => {
  res.json({ message: "Food Delivery Backend Running" });
});

// Socket.io কানেকশন হ্যান্ডলিং
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("join-user", (userId) => {
    socket.join(userId);
    console.log(`User ${userId} joined room`);
  });

  socket.on("join-restaurant", (restaurantId) => {
    socket.join(restaurantId);
    console.log(`Restaurant ${restaurantId} joined room`);
  });

  socket.on("rider-location-update", (data) => {
    const { orderId, latitude, longitude } = data;

    // Broadcast to restaurant and customer
    socket.to(data.restaurantId).emit("rider-location-changed", data);
    socket.to(data.customerId).emit("rider-location-changed", data);

    // Update rider location in database
    Order.findByIdAndUpdate(orderId, {
      riderLocation: {
        latitude,
        longitude,
        lastUpdated: new Date(),
      },
    }).catch(console.error);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
