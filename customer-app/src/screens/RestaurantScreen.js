// import React, { useEffect, useState } from "react";
// import {
//   View,
//   Text,
//   StyleSheet,
//   FlatList,
//   TouchableOpacity,
//   Image,
//   ActivityIndicator,
//   Alert,
//   ScrollView,
// } from "react-native";
// import { useSelector, useDispatch } from "react-redux";
// import { addToCart } from "../store/slices/cartSlice";
// import { productAPI } from "../services/api";
// import Icon from "react-native-vector-icons/MaterialIcons";

// const RestaurantScreen = ({ route, navigation }) => {
//   const { restaurantId } = route.params;
//   const [restaurant, setRestaurant] = useState(null);
//   const [products, setProducts] = useState({});
//   const [categories, setCategories] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [selectedCategory, setSelectedCategory] = useState("all");
//   const dispatch = useDispatch();
//   const cart = useSelector((state) => state.cart);

//   useEffect(() => {
//     fetchRestaurantData();
//   }, [restaurantId]);

//   const fetchRestaurantData = async () => {
//     try {
//       setLoading(true);
//       const response = await productAPI.getByRestaurant(restaurantId);
//       setRestaurant(response.data.restaurant);
//       setProducts(response.data.productsByCategory);
//       setCategories(response.data.categories);
//     } catch (error) {
//       console.error("Fetch restaurant error:", error);
//       Alert.alert("Error", "Failed to load restaurant data");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleAddToCart = (product) => {
//     dispatch(
//       addToCart({
//         product: {
//           id: product._id,
//           name: product.name,
//           price: product.price,
//           image: product.image,
//           preparationTime: product.preparationTime,
//         },
//         restaurant: {
//           id: restaurant._id,
//           name: restaurant.name,
//           address: restaurant.address,
//         },
//       })
//     );

//     Alert.alert("Success", `${product.name} added to cart!`);
//   };

//   const renderProductItem = ({ item }) => (
//     <View style={styles.productCard}>
//       <Image
//         source={{ uri: item.image || "https://via.placeholder.com/150" }}
//         style={styles.productImage}
//         defaultSource={require("../../assets/placeholder.png")}
//       />
//       <View style={styles.productInfo}>
//         <Text style={styles.productName}>{item.name}</Text>
//         <Text style={styles.productDescription} numberOfLines={2}>
//           {item.description}
//         </Text>
//         <Text style={styles.productPrice}>৳{item.price}</Text>
//         {item.preparationTime && (
//           <Text style={styles.preparationTime}>
//             ⏱ {item.preparationTime} min
//           </Text>
//         )}
//       </View>
//       <TouchableOpacity
//         style={styles.addButton}
//         onPress={() => handleAddToCart(item)}
//       >
//         <Icon name="add" size={24} color="#fff" />
//       </TouchableOpacity>
//     </View>
//   );

//   const renderCategorySection = ({ category, items }) => (
//     <View key={category} style={styles.categorySection}>
//       <Text style={styles.categoryTitle}>{category}</Text>
//       {items.map((product) => (
//         <View key={product._id}>{renderProductItem({ item: product })}</View>
//       ))}
//     </View>
//   );

//   if (loading) {
//     return (
//       <View style={styles.centered}>
//         <ActivityIndicator size="large" color="#FF6B6B" />
//         <Text style={styles.loadingText}>Loading menu...</Text>
//       </View>
//     );
//   }

//   if (!restaurant) {
//     return (
//       <View style={styles.centered}>
//         <Text style={styles.errorText}>Restaurant not found</Text>
//       </View>
//     );
//   }

//   const displayProducts =
//     selectedCategory === "all"
//       ? products
//       : { [selectedCategory]: products[selectedCategory] || [] };

//   return (
//     <View style={styles.container}>
//       {/* Header */}
//       <View style={styles.header}>
//         <TouchableOpacity
//           style={styles.backButton}
//           onPress={() => navigation.goBack()}
//         >
//           <Icon name="arrow-back" size={24} color="#333" />
//         </TouchableOpacity>
//         <Text style={styles.headerTitle}>{restaurant.name}</Text>
//         <TouchableOpacity
//           style={styles.cartButton}
//           onPress={() => navigation.navigate("Cart")}
//         >
//           <Icon name="shopping-cart" size={24} color="#333" />
//           {cart.items.length > 0 && (
//             <View style={styles.cartBadge}>
//               <Text style={styles.cartBadgeText}>
//                 {cart.items.reduce((total, item) => total + item.quantity, 0)}
//               </Text>
//             </View>
//           )}
//         </TouchableOpacity>
//       </View>

//       <ScrollView>
//         {/* Restaurant Info */}
//         <View style={styles.restaurantInfo}>
//           <Text style={styles.cuisineType}>{restaurant.cuisineType}</Text>
//           <Text style={styles.restaurantAddress}>{restaurant.address}</Text>
//           <View style={styles.restaurantMeta}>
//             <Text style={styles.metaText}>🚚 30-45 min</Text>
//             <Text style={styles.metaText}>📞 {restaurant.phone}</Text>
//           </View>
//         </View>

//         {/* Category Tabs */}
//         <ScrollView
//           horizontal
//           showsHorizontalScrollIndicator={false}
//           style={styles.categoryTabs}
//         >
//           <TouchableOpacity
//             style={[
//               styles.categoryTab,
//               selectedCategory === "all" && styles.categoryTabActive,
//             ]}
//             onPress={() => setSelectedCategory("all")}
//           >
//             <Text
//               style={[
//                 styles.categoryTabText,
//                 selectedCategory === "all" && styles.categoryTabTextActive,
//               ]}
//             >
//               All
//             </Text>
//           </TouchableOpacity>
//           {categories.map((category) => (
//             <TouchableOpacity
//               key={category}
//               style={[
//                 styles.categoryTab,
//                 selectedCategory === category && styles.categoryTabActive,
//               ]}
//               onPress={() => setSelectedCategory(category)}
//             >
//               <Text
//                 style={[
//                   styles.categoryTabText,
//                   selectedCategory === category && styles.categoryTabTextActive,
//                 ]}
//               >
//                 {category}
//               </Text>
//             </TouchableOpacity>
//           ))}
//         </ScrollView>

//         {/* Products List */}
//         <View style={styles.productsContainer}>
//           {Object.entries(displayProducts).map(([category, items]) =>
//             renderCategorySection({ category, items })
//           )}
//         </View>
//       </ScrollView>

//       {/* Floating Cart Button */}
//       {cart.items.length > 0 && (
//         <TouchableOpacity
//           style={styles.floatingCartButton}
//           onPress={() => navigation.navigate("Cart")}
//         >
//           <View style={styles.cartSummary}>
//             <Text style={styles.cartCount}>
//               {cart.items.reduce((total, item) => total + item.quantity, 0)}{" "}
//               items
//             </Text>
//             <Text style={styles.cartTotal}>৳{cart.totalAmount}</Text>
//           </View>
//           <Text style={styles.viewCartText}>View Cart →</Text>
//         </TouchableOpacity>
//       )}
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: "#fff",
//   },
//   centered: {
//     flex: 1,
//     justifyContent: "center",
//     alignItems: "center",
//   },
//   loadingText: {
//     marginTop: 10,
//     color: "#666",
//   },
//   errorText: {
//     fontSize: 18,
//     color: "#666",
//   },
//   header: {
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "space-between",
//     padding: 15,
//     borderBottomWidth: 1,
//     borderBottomColor: "#eee",
//     backgroundColor: "#fff",
//   },
//   backButton: {
//     padding: 5,
//   },
//   headerTitle: {
//     fontSize: 18,
//     fontWeight: "bold",
//     color: "#333",
//   },
//   cartButton: {
//     padding: 5,
//     position: "relative",
//   },
//   cartBadge: {
//     position: "absolute",
//     top: -5,
//     right: -5,
//     backgroundColor: "#FF6B6B",
//     borderRadius: 10,
//     minWidth: 20,
//     height: 20,
//     justifyContent: "center",
//     alignItems: "center",
//   },
//   cartBadgeText: {
//     color: "#fff",
//     fontSize: 12,
//     fontWeight: "bold",
//   },
//   restaurantInfo: {
//     padding: 20,
//     borderBottomWidth: 1,
//     borderBottomColor: "#eee",
//   },
//   cuisineType: {
//     fontSize: 16,
//     color: "#FF6B6B",
//     fontWeight: "600",
//     marginBottom: 5,
//   },
//   restaurantAddress: {
//     fontSize: 14,
//     color: "#666",
//     marginBottom: 10,
//   },
//   restaurantMeta: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//   },
//   metaText: {
//     fontSize: 12,
//     color: "#666",
//   },
//   categoryTabs: {
//     paddingHorizontal: 15,
//     paddingVertical: 10,
//     backgroundColor: "#f8f8f8",
//   },
//   categoryTab: {
//     paddingHorizontal: 20,
//     paddingVertical: 8,
//     marginRight: 10,
//     borderRadius: 20,
//     backgroundColor: "#fff",
//   },
//   categoryTabActive: {
//     backgroundColor: "#FF6B6B",
//   },
//   categoryTabText: {
//     fontSize: 14,
//     color: "#666",
//   },
//   categoryTabTextActive: {
//     color: "#fff",
//     fontWeight: "600",
//   },
//   productsContainer: {
//     padding: 15,
//   },
//   categorySection: {
//     marginBottom: 25,
//   },
//   categoryTitle: {
//     fontSize: 20,
//     fontWeight: "bold",
//     marginBottom: 15,
//     color: "#333",
//   },
//   productCard: {
//     flexDirection: "row",
//     backgroundColor: "#fff",
//     borderRadius: 12,
//     marginBottom: 15,
//     padding: 15,
//     elevation: 2,
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 1 },
//     shadowOpacity: 0.1,
//     shadowRadius: 3,
//   },
//   productImage: {
//     width: 80,
//     height: 80,
//     borderRadius: 8,
//   },
//   productInfo: {
//     flex: 1,
//     marginLeft: 15,
//     justifyContent: "space-between",
//   },
//   productName: {
//     fontSize: 16,
//     fontWeight: "600",
//     marginBottom: 5,
//     color: "#333",
//   },
//   productDescription: {
//     fontSize: 12,
//     color: "#666",
//     marginBottom: 8,
//     lineHeight: 16,
//   },
//   productPrice: {
//     fontSize: 16,
//     fontWeight: "bold",
//     color: "#FF6B6B",
//   },
//   preparationTime: {
//     fontSize: 11,
//     color: "#666",
//     marginTop: 4,
//   },
//   addButton: {
//     backgroundColor: "#FF6B6B",
//     width: 36,
//     height: 36,
//     borderRadius: 18,
//     justifyContent: "center",
//     alignItems: "center",
//     alignSelf: "center",
//   },
//   floatingCartButton: {
//     position: "absolute",
//     bottom: 20,
//     left: 20,
//     right: 20,
//     backgroundColor: "#333",
//     borderRadius: 12,
//     padding: 15,
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//     elevation: 8,
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.2,
//     shadowRadius: 4,
//   },
//   cartSummary: {
//     flexDirection: "row",
//     alignItems: "center",
//   },
//   cartCount: {
//     color: "#fff",
//     fontSize: 14,
//     marginRight: 10,
//   },
//   cartTotal: {
//     color: "#fff",
//     fontSize: 16,
//     fontWeight: "bold",
//   },
//   viewCartText: {
//     color: "#FF6B6B",
//     fontSize: 14,
//     fontWeight: "600",
//   },
// });

// export default RestaurantScreen;

import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  ScrollView,
} from "react-native";
import { useSelector, useDispatch } from "react-redux";
import { addToCart } from "../store/slices/cartSlice";
import { productAPI } from "../services/api";
import Icon from "react-native-vector-icons/MaterialIcons";

const RestaurantScreen = ({ route, navigation }) => {
  const { restaurantId } = route.params;
  const [restaurant, setRestaurant] = useState(null);
  const [products, setProducts] = useState({});
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const dispatch = useDispatch();
  const cart = useSelector((state) => state.cart);

  useEffect(() => {
    fetchRestaurantData();
  }, [restaurantId]);

  const fetchRestaurantData = async () => {
    try {
      setLoading(true);
      const response = await productAPI.getByRestaurant(restaurantId);
      setRestaurant(response.data.restaurant);
      setProducts(response.data.productsByCategory);
      setCategories(response.data.categories);
    } catch (error) {
      console.error("Fetch restaurant error:", error);
      Alert.alert("Error", "Failed to load restaurant data");
    } finally {
      setLoading(false);
    }
  };

  // --- ফিক্সড ফাংশন (Fixed Function) ---
  // --- ফিক্সড ফাংশন (Fixed Function) ---
  const handleAddToCart = (product) => {
    dispatch(
      addToCart({
        product: {
          _id: product._id,
          name: product.name,
          price: product.price,
          image: product.image,
          preparationTime: product.preparationTime,
        },
        restaurant: {
          _id: restaurantId, // পরিবর্তন: restaurant._id এর বদলে restaurantId ব্যবহার করুন
          name: restaurant.name,
          address: restaurant.address || "", // restaurant.address যদি undefined হয়, তবে খালি স্ট্রিং সেট করুন
        },
      })
    );

    Alert.alert("Success", `${product.name} added to cart!`);
  };
  // -------------------------------------
  // -------------------------------------

  const renderProductItem = ({ item }) => (
    <View style={styles.productCard}>
      <Image
        source={{ uri: item.image || "https://via.placeholder.com/150" }}
        style={styles.productImage}
        defaultSource={require("../../assets/placeholder.png")}
      />
      <View style={styles.productInfo}>
        <Text style={styles.productName}>{item.name}</Text>
        <Text style={styles.productDescription} numberOfLines={2}>
          {item.description}
        </Text>
        <Text style={styles.productPrice}>৳{item.price}</Text>
        {item.preparationTime && (
          <Text style={styles.preparationTime}>
            ⏱ {item.preparationTime} min
          </Text>
        )}
      </View>
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => handleAddToCart(item)}
      >
        <Icon name="add" size={24} color="#fff" />
      </TouchableOpacity>
    </View>
  );

  const renderCategorySection = ({ category, items }) => (
    <View key={category} style={styles.categorySection}>
      <Text style={styles.categoryTitle}>{category}</Text>
      {items.map((product) => (
        <View key={product._id}>{renderProductItem({ item: product })}</View>
      ))}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#FF6B6B" />
        <Text style={styles.loadingText}>Loading menu...</Text>
      </View>
    );
  }

  if (!restaurant) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Restaurant not found</Text>
      </View>
    );
  }

  const displayProducts =
    selectedCategory === "all"
      ? products
      : { [selectedCategory]: products[selectedCategory] || [] };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{restaurant.name}</Text>
        <TouchableOpacity
          style={styles.cartButton}
          onPress={() => navigation.navigate("Cart")}
        >
          <Icon name="shopping-cart" size={24} color="#333" />
          {cart.items.length > 0 && (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>
                {cart.items.reduce((total, item) => total + item.quantity, 0)}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView>
        {/* Restaurant Info */}
        <View style={styles.restaurantInfo}>
          <Text style={styles.cuisineType}>{restaurant.cuisineType}</Text>
          <Text style={styles.restaurantAddress}>{restaurant.address}</Text>
          <View style={styles.restaurantMeta}>
            <Text style={styles.metaText}>🚚 30-45 min</Text>
            <Text style={styles.metaText}>📞 {restaurant.phone}</Text>
          </View>
        </View>

        {/* Category Tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoryTabs}
        >
          <TouchableOpacity
            style={[
              styles.categoryTab,
              selectedCategory === "all" && styles.categoryTabActive,
            ]}
            onPress={() => setSelectedCategory("all")}
          >
            <Text
              style={[
                styles.categoryTabText,
                selectedCategory === "all" && styles.categoryTabTextActive,
              ]}
            >
              All
            </Text>
          </TouchableOpacity>
          {categories.map((category) => (
            <TouchableOpacity
              key={category}
              style={[
                styles.categoryTab,
                selectedCategory === category && styles.categoryTabActive,
              ]}
              onPress={() => setSelectedCategory(category)}
            >
              <Text
                style={[
                  styles.categoryTabText,
                  selectedCategory === category && styles.categoryTabTextActive,
                ]}
              >
                {category}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Products List */}
        <View style={styles.productsContainer}>
          {Object.entries(displayProducts).map(([category, items]) =>
            renderCategorySection({ category, items })
          )}
        </View>
      </ScrollView>

      {/* Floating Cart Button */}
      {cart.items.length > 0 && (
        <TouchableOpacity
          style={styles.floatingCartButton}
          onPress={() => navigation.navigate("Cart")}
        >
          <View style={styles.cartSummary}>
            <Text style={styles.cartCount}>
              {cart.items.reduce((total, item) => total + item.quantity, 0)}{" "}
              items
            </Text>
            <Text style={styles.cartTotal}>৳{cart.totalAmount}</Text>
          </View>
          <Text style={styles.viewCartText}>View Cart →</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    color: "#666",
  },
  errorText: {
    fontSize: 18,
    color: "#666",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    backgroundColor: "#fff",
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  cartButton: {
    padding: 5,
    position: "relative",
  },
  cartBadge: {
    position: "absolute",
    top: -5,
    right: -5,
    backgroundColor: "#FF6B6B",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  cartBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  restaurantInfo: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  cuisineType: {
    fontSize: 16,
    color: "#FF6B6B",
    fontWeight: "600",
    marginBottom: 5,
  },
  restaurantAddress: {
    fontSize: 14,
    color: "#666",
    marginBottom: 10,
  },
  restaurantMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  metaText: {
    fontSize: 12,
    color: "#666",
  },
  categoryTabs: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: "#f8f8f8",
  },
  categoryTab: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    marginRight: 10,
    borderRadius: 20,
    backgroundColor: "#fff",
  },
  categoryTabActive: {
    backgroundColor: "#FF6B6B",
  },
  categoryTabText: {
    fontSize: 14,
    color: "#666",
  },
  categoryTabTextActive: {
    color: "#fff",
    fontWeight: "600",
  },
  productsContainer: {
    padding: 15,
  },
  categorySection: {
    marginBottom: 25,
  },
  categoryTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 15,
    color: "#333",
  },
  productCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 15,
    padding: 15,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  productInfo: {
    flex: 1,
    marginLeft: 15,
    justifyContent: "space-between",
  },
  productName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 5,
    color: "#333",
  },
  productDescription: {
    fontSize: 12,
    color: "#666",
    marginBottom: 8,
    lineHeight: 16,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FF6B6B",
  },
  preparationTime: {
    fontSize: 11,
    color: "#666",
    marginTop: 4,
  },
  addButton: {
    backgroundColor: "#FF6B6B",
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
  },
  floatingCartButton: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: "#333",
    borderRadius: 12,
    padding: 15,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  cartSummary: {
    flexDirection: "row",
    alignItems: "center",
  },
  cartCount: {
    color: "#fff",
    fontSize: 14,
    marginRight: 10,
  },
  cartTotal: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  viewCartText: {
    color: "#FF6B6B",
    fontSize: 14,
    fontWeight: "600",
  },
});

export default RestaurantScreen;
