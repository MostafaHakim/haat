const mongoose = require("mongoose");
const Product = require("../models/Product");
const Restaurant = require("../models/Restaurant");
require("dotenv").config();

const sampleProducts = [
  {
    name: "Chicken Biryani",
    description:
      "Aromatic basmati rice cooked with tender chicken pieces and traditional spices",
    price: 320,
    originalPrice: 350,
    category: "Biryani",
    image: "https://example.com/biryani.jpg",
    isVeg: false,
    preparationTime: 20,
    ingredients: ["Basmati Rice", "Chicken", "Onions", "Yogurt", "Spices"],
    tags: ["spicy", "popular", "traditional"],
  },
  {
    name: "Beef Kacchi Biryani",
    description: "Traditional Dhaka style kacchi biryani with marinated beef",
    price: 380,
    category: "Biryani",
    isVeg: false,
    preparationTime: 25,
    tags: ["premium", "traditional", "mutton"],
  },
  {
    name: "Chicken Tikka",
    description:
      "Boneless chicken marinated in spices and grilled to perfection",
    price: 280,
    category: "Appetizers",
    isVeg: false,
    preparationTime: 15,
    tags: ["starter", "grilled", "spicy"],
  },
  {
    name: "Vegetable Fried Rice",
    description: "Stir-fried rice with fresh vegetables and soy sauce",
    price: 180,
    category: "Rice",
    isVeg: true,
    preparationTime: 12,
    tags: ["vegetarian", "quick", "healthy"],
  },
];

const seedProducts = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    // Get a restaurant to associate products with
    const restaurant = await Restaurant.findOne();
    if (!restaurant) {
      console.log("No restaurant found. Please create a restaurant first.");
      return;
    }

    // Add restaurantId to sample products
    const productsWithRestaurant = sampleProducts.map((product) => ({
      ...product,
      restaurantId: restaurant._id,
    }));

    await Product.deleteMany({ restaurantId: restaurant._id });
    await Product.insertMany(productsWithRestaurant);

    console.log("Sample products created successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding products:", error);
    process.exit(1);
  }
};

seedProducts();
