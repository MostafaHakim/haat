const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const router = express.Router();

// রেজিস্ট্রেশন
router.post("/register", async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      phone,
      userType,
      restaurantName,
      vehicleType,
    } = req.body;

    // চেক যদি ইউজার already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // পাসওয়ার্ড হ্যাশ
    const hashedPassword = await bcrypt.hash(password, 12);

    // নতুন ইউজার তৈরি
    const user = new User({
      name,
      email,
      password: hashedPassword,
      phone,
      userType,
      restaurantName: userType === "seller" ? restaurantName : undefined,
      vehicleType: userType === "rider" ? vehicleType : undefined,
    });

    await user.save();

    // JWT টোকেন জেনারেট
    const token = jwt.sign(
      { userId: user._id, userType: user.userType },
      process.env.JWT_SECRET || "your-secret-key",
      { expiresIn: "7d" }
    );

    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        userType: user.userType,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Something went wrong" });
  }
});

// লগিন
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { userId: user._id, userType: user.userType },
      process.env.JWT_SECRET || "your-secret-key",
      { expiresIn: "7d" }
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        userType: user.userType,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Something went wrong" });
  }
});

module.exports = router;
