// import React, { useState } from "react";
// import {
//   View,
//   Text,
//   StyleSheet,
//   FlatList,
//   TouchableOpacity,
//   Image,
//   Alert,
//   ScrollView,
//   TextInput,
// } from "react-native";
// import { useSelector, useDispatch } from "react-redux";
// import {
//   removeFromCart,
//   updateQuantity,
//   clearCart,
// } from "../store/slices/cartSlice";
// import { orderAPI } from "../services/api";
// import Icon from "react-native-vector-icons/MaterialIcons";
// import * as Location from "expo-location";

// const CartScreen = ({ navigation }) => {
//   const cart = useSelector((state) => state.cart);
//   const { user, token } = useSelector((state) => state.auth);
//   const dispatch = useDispatch();

//   const [deliveryAddress, setDeliveryAddress] = useState("");
//   const [specialInstructions, setSpecialInstructions] = useState("");
//   const [loading, setLoading] = useState(false);
//   const [location, setLocation] = useState(null);

//   React.useEffect(() => {
//     getCurrentLocation();
//   }, []);

//   const getCurrentLocation = async () => {
//     try {
//       let { status } = await Location.requestForegroundPermissionsAsync();
//       if (status !== "granted") {
//         Alert.alert(
//           "Permission denied",
//           "Need location permission for delivery"
//         );
//         return;
//       }

//       let location = await Location.getCurrentPositionAsync({});
//       setLocation(location.coords);

//       // Get address from coordinates (simplified)
//       setDeliveryAddress(user?.address || "Current Location");
//     } catch (error) {
//       console.error("Location error:", error);
//     }
//   };

//   const handleQuantityChange = (productId, newQuantity) => {
//     if (newQuantity === 0) {
//       dispatch(removeFromCart(productId));
//     } else {
//       dispatch(updateQuantity({ productId, quantity: newQuantity }));
//     }
//   };

//   const calculateTotals = () => {
//     const subtotal = cart.totalAmount;
//     const deliveryFee = subtotal >= 500 ? 0 : 30;
//     const tax = subtotal * 0.05; // 5% tax
//     const total = subtotal + deliveryFee + tax;

//     return { subtotal, deliveryFee, tax, total };
//   };

//   const handlePlaceOrder = async () => {
//     if (!deliveryAddress.trim()) {
//       Alert.alert("Error", "Please enter delivery address");
//       return;
//     }
//     console.log(location);
//     if (!location) {
//       Alert.alert("Error", "Please enable location services");
//       return;
//     }

//     setLoading(true);

//     try {
//       const orderData = {
//         restaurantId: cart.restaurant.id,
//         items: cart.items.map((item) => ({
//           productId: item.id,
//           quantity: item.quantity,
//           specialInstructions: item.specialInstructions || "",
//         })),
//         deliveryAddress: deliveryAddress,
//         deliveryLocation: {
//           latitude: location.latitude,
//           longitude: location.longitude,
//           address: deliveryAddress,
//         },
//         paymentMethod: "cash_on_delivery",
//         specialInstructions: specialInstructions,
//       };

//       const response = await orderAPI.create(orderData);

//       dispatch(clearCart());

//       Alert.alert(
//         "Order Placed!",
//         `Your order #${response.data.orderId} has been placed successfully.`,
//         [
//           {
//             text: "Track Order",
//             onPress: () =>
//               navigation.navigate("OrderTracking", {
//                 orderId: response.data._id,
//               }),
//           },
//           {
//             text: "Continue Shopping",
//             onPress: () => navigation.navigate("Home"),
//           },
//         ]
//       );
//     } catch (error) {
//       console.error("Order error:", error);
//       const message = error.response?.data?.message || "Failed to place order";
//       Alert.alert("Error", message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const renderCartItem = ({ item }) => (
//     <View style={styles.cartItem}>
//       <Image
//         source={{ uri: item.image || "https://via.placeholder.com/150" }}
//         style={styles.itemImage}
//         defaultSource={require("../../assets/placeholder.png")}
//       />
//       <View style={styles.itemInfo}>
//         <Text style={styles.itemName}>{item.name}</Text>
//         <Text style={styles.itemPrice}>৳{item.price}</Text>
//       </View>
//       <View style={styles.quantityControl}>
//         <TouchableOpacity
//           style={styles.quantityButton}
//           onPress={() => handleQuantityChange(item.id, item.quantity - 1)}
//         >
//           <Icon name="remove" size={20} color="#FF6B6B" />
//         </TouchableOpacity>
//         <Text style={styles.quantityText}>{item.quantity}</Text>
//         <TouchableOpacity
//           style={styles.quantityButton}
//           onPress={() => handleQuantityChange(item.id, item.quantity + 1)}
//         >
//           <Icon name="add" size={20} color="#FF6B6B" />
//         </TouchableOpacity>
//       </View>
//       <TouchableOpacity
//         style={styles.removeButton}
//         onPress={() => dispatch(removeFromCart(item.id))}
//       >
//         <Icon name="delete" size={20} color="#666" />
//       </TouchableOpacity>
//     </View>
//   );

//   const { subtotal, deliveryFee, tax, total } = calculateTotals();

//   if (cart.items.length === 0) {
//     return (
//       <View style={styles.emptyContainer}>
//         <Icon name="shopping-cart" size={80} color="#ddd" />
//         <Text style={styles.emptyTitle}>Your cart is empty</Text>
//         <Text style={styles.emptyText}>
//           Browse restaurants and add some delicious food to your cart!
//         </Text>
//         <TouchableOpacity
//           style={styles.continueShoppingButton}
//           onPress={() => navigation.navigate("Home")}
//         >
//           <Text style={styles.continueShoppingText}>Continue Shopping</Text>
//         </TouchableOpacity>
//       </View>
//     );
//   }

//   return (
//     <View style={styles.container}>
//       <View style={styles.header}>
//         <TouchableOpacity
//           style={styles.backButton}
//           onPress={() => navigation.goBack()}
//         >
//           <Icon name="arrow-back" size={24} color="#333" />
//         </TouchableOpacity>
//         <Text style={styles.headerTitle}>Your Cart</Text>
//         <View style={styles.headerRight} />
//       </View>

//       <ScrollView style={styles.content}>
//         {/* Restaurant Info */}
//         <View style={styles.restaurantSection}>
//           <Text style={styles.restaurantName}>{cart.restaurant.name}</Text>
//           <Text style={styles.restaurantAddress}>
//             {cart.restaurant.address}
//           </Text>
//         </View>

//         {/* Cart Items */}
//         <View style={styles.cartSection}>
//           <Text style={styles.sectionTitle}>Order Items</Text>
//           <FlatList
//             data={cart.items}
//             renderItem={renderCartItem}
//             keyExtractor={(item) => item.id}
//             scrollEnabled={false}
//           />
//         </View>

//         {/* Delivery Address */}
//         <View style={styles.addressSection}>
//           <Text style={styles.sectionTitle}>Delivery Address</Text>
//           <TextInput
//             style={styles.addressInput}
//             placeholder="Enter your delivery address"
//             value={deliveryAddress}
//             onChangeText={setDeliveryAddress}
//             multiline
//           />
//         </View>

//         {/* Special Instructions */}
//         <View style={styles.instructionsSection}>
//           <Text style={styles.sectionTitle}>Special Instructions</Text>
//           <TextInput
//             style={styles.instructionsInput}
//             placeholder="Any special instructions for the restaurant?"
//             value={specialInstructions}
//             onChangeText={setSpecialInstructions}
//             multiline
//           />
//         </View>

//         {/* Order Summary */}
//         <View style={styles.summarySection}>
//           <Text style={styles.sectionTitle}>Order Summary</Text>
//           <View style={styles.summaryRow}>
//             <Text style={styles.summaryLabel}>Subtotal</Text>
//             <Text style={styles.summaryValue}>৳{subtotal.toFixed(2)}</Text>
//           </View>
//           <View style={styles.summaryRow}>
//             <Text style={styles.summaryLabel}>Delivery Fee</Text>
//             <Text style={styles.summaryValue}>
//               {deliveryFee === 0 ? "FREE" : `৳${deliveryFee.toFixed(2)}`}
//             </Text>
//           </View>
//           <View style={styles.summaryRow}>
//             <Text style={styles.summaryLabel}>Tax (5%)</Text>
//             <Text style={styles.summaryValue}>৳{tax.toFixed(2)}</Text>
//           </View>
//           <View style={[styles.summaryRow, styles.totalRow]}>
//             <Text style={styles.totalLabel}>Total</Text>
//             <Text style={styles.totalValue}>৳{total.toFixed(2)}</Text>
//           </View>
//         </View>
//       </ScrollView>

//       {/* Checkout Button */}
//       <View style={styles.checkoutContainer}>
//         <TouchableOpacity
//           style={[
//             styles.checkoutButton,
//             loading && styles.checkoutButtonDisabled,
//           ]}
//           onPress={handlePlaceOrder}
//           disabled={loading}
//         >
//           <Text style={styles.checkoutButtonText}>
//             {loading
//               ? "Placing Order..."
//               : `Place Order - ৳${total.toFixed(2)}`}
//           </Text>
//         </TouchableOpacity>
//       </View>
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: "#fff",
//   },
//   header: {
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "space-between",
//     padding: 15,
//     borderBottomWidth: 1,
//     borderBottomColor: "#eee",
//   },
//   backButton: {
//     padding: 5,
//   },
//   headerTitle: {
//     fontSize: 18,
//     fontWeight: "bold",
//     color: "#333",
//   },
//   headerRight: {
//     width: 24,
//   },
//   content: {
//     flex: 1,
//     padding: 15,
//   },
//   emptyContainer: {
//     flex: 1,
//     justifyContent: "center",
//     alignItems: "center",
//     padding: 20,
//   },
//   emptyTitle: {
//     fontSize: 20,
//     fontWeight: "bold",
//     color: "#666",
//     marginTop: 20,
//     marginBottom: 10,
//   },
//   emptyText: {
//     fontSize: 16,
//     color: "#666",
//     textAlign: "center",
//     marginBottom: 30,
//   },
//   continueShoppingButton: {
//     backgroundColor: "#FF6B6B",
//     paddingHorizontal: 30,
//     paddingVertical: 15,
//     borderRadius: 8,
//   },
//   continueShoppingText: {
//     color: "#fff",
//     fontSize: 16,
//     fontWeight: "bold",
//   },
//   restaurantSection: {
//     backgroundColor: "#f8f8f8",
//     padding: 15,
//     borderRadius: 8,
//     marginBottom: 20,
//   },
//   restaurantName: {
//     fontSize: 16,
//     fontWeight: "bold",
//     marginBottom: 5,
//   },
//   restaurantAddress: {
//     fontSize: 14,
//     color: "#666",
//   },
//   cartSection: {
//     marginBottom: 20,
//   },
//   sectionTitle: {
//     fontSize: 18,
//     fontWeight: "bold",
//     marginBottom: 15,
//     color: "#333",
//   },
//   cartItem: {
//     flexDirection: "row",
//     alignItems: "center",
//     backgroundColor: "#f8f8f8",
//     padding: 15,
//     borderRadius: 8,
//     marginBottom: 10,
//   },
//   itemImage: {
//     width: 60,
//     height: 60,
//     borderRadius: 8,
//   },
//   itemInfo: {
//     flex: 1,
//     marginLeft: 15,
//   },
//   itemName: {
//     fontSize: 16,
//     fontWeight: "600",
//     marginBottom: 5,
//   },
//   itemPrice: {
//     fontSize: 14,
//     color: "#FF6B6B",
//     fontWeight: "600",
//   },
//   quantityControl: {
//     flexDirection: "row",
//     alignItems: "center",
//     marginHorizontal: 15,
//   },
//   quantityButton: {
//     width: 32,
//     height: 32,
//     borderRadius: 16,
//     backgroundColor: "#fff",
//     justifyContent: "center",
//     alignItems: "center",
//     borderWidth: 1,
//     borderColor: "#ddd",
//   },
//   quantityText: {
//     marginHorizontal: 15,
//     fontSize: 16,
//     fontWeight: "600",
//     minWidth: 20,
//     textAlign: "center",
//   },
//   removeButton: {
//     padding: 5,
//   },
//   addressSection: {
//     marginBottom: 20,
//   },
//   addressInput: {
//     borderWidth: 1,
//     borderColor: "#ddd",
//     borderRadius: 8,
//     padding: 15,
//     fontSize: 16,
//     minHeight: 80,
//     textAlignVertical: "top",
//   },
//   instructionsSection: {
//     marginBottom: 20,
//   },
//   instructionsInput: {
//     borderWidth: 1,
//     borderColor: "#ddd",
//     borderRadius: 8,
//     padding: 15,
//     fontSize: 16,
//     minHeight: 80,
//     textAlignVertical: "top",
//   },
//   summarySection: {
//     backgroundColor: "#f8f8f8",
//     padding: 15,
//     borderRadius: 8,
//     marginBottom: 20,
//   },
//   summaryRow: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     marginBottom: 10,
//   },
//   summaryLabel: {
//     fontSize: 14,
//     color: "#666",
//   },
//   summaryValue: {
//     fontSize: 14,
//     fontWeight: "600",
//   },
//   totalRow: {
//     borderTopWidth: 1,
//     borderTopColor: "#ddd",
//     paddingTop: 10,
//     marginTop: 5,
//   },
//   totalLabel: {
//     fontSize: 16,
//     fontWeight: "bold",
//   },
//   totalValue: {
//     fontSize: 18,
//     fontWeight: "bold",
//     color: "#FF6B6B",
//   },
//   checkoutContainer: {
//     padding: 15,
//     borderTopWidth: 1,
//     borderTopColor: "#eee",
//     backgroundColor: "#fff",
//   },
//   checkoutButton: {
//     backgroundColor: "#FF6B6B",
//     borderRadius: 8,
//     padding: 15,
//     alignItems: "center",
//   },
//   checkoutButtonDisabled: {
//     backgroundColor: "#ccc",
//   },
//   checkoutButtonText: {
//     color: "#fff",
//     fontSize: 18,
//     fontWeight: "bold",
//   },
// });

// export default CartScreen;
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Alert,
  ScrollView,
  TextInput,
  ActivityIndicator,
  StatusBar,
} from "react-native";
import { useSelector, useDispatch } from "react-redux";
import {
  removeFromCart,
  updateQuantity,
  clearCart,
} from "../store/slices/cartSlice";
import { orderAPI } from "../services/api";
import Icon from "react-native-vector-icons/MaterialIcons";
import * as Location from "expo-location";

const CartScreen = ({ navigation }) => {
  const cart = useSelector((state) => state.cart);
  const { user, token } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);

  React.useEffect(() => {
    getCurrentLocation();
  }, []);

  const getCurrentLocation = async () => {
    try {
      setLocationLoading(true);

      let serviceEnabled = await Location.hasServicesEnabledAsync();
      if (!serviceEnabled) {
        Alert.alert(
          "Location Services Disabled",
          "Please enable location services on your device"
        );
        setLocationLoading(false);
        return;
      }

      let { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        handleUseDefaultLocation();
        return;
      }

      let locationResult = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        timeout: 10000,
      });

      setLocation(locationResult.coords);

      try {
        let addressResponse = await Location.reverseGeocodeAsync({
          latitude: locationResult.coords.latitude,
          longitude: locationResult.coords.longitude,
        });

        if (addressResponse.length > 0) {
          const address = addressResponse[0];
          const fullAddress = [
            address.name,
            address.street,
            address.district,
            address.city,
            address.region,
          ]
            .filter(Boolean)
            .join(", ");

          setDeliveryAddress(
            fullAddress || user?.address || "Current Location"
          );
        } else {
          setDeliveryAddress(user?.address || "Current Location");
        }
      } catch (geocodeError) {
        setDeliveryAddress(user?.address || "Current Location");
      }
    } catch (error) {
      console.error("Location error:", error);
      handleUseDefaultLocation();
    } finally {
      setLocationLoading(false);
    }
  };

  const handleUseDefaultLocation = () => {
    const defaultLocation = {
      latitude: 23.8103,
      longitude: 90.4125,
    };
    setLocation(defaultLocation);
    setDeliveryAddress(user?.address || "Dhaka, Bangladesh");
  };

  const handlePlaceOrder = async () => {
    if (!deliveryAddress.trim()) {
      Alert.alert("Error", "Please enter delivery address");
      return;
    }

    const finalLocation = location || {
      latitude: 23.8103,
      longitude: 90.4125,
    };

    setLoading(true);

    try {
      const orderData = {
        restaurantId: cart.restaurant._id,
        items: cart.items.map((item) => ({
          productId: item._id,
          quantity: item.quantity,
          specialInstructions: item.specialInstructions || "",
        })),
        deliveryAddress: deliveryAddress,
        deliveryLocation: {
          latitude: finalLocation.latitude,
          longitude: finalLocation.longitude,
          address: deliveryAddress,
        },
        paymentMethod: "cash_on_delivery",
        specialInstructions: specialInstructions,
      };

      const response = await orderAPI.create(orderData);
      dispatch(clearCart());

      Alert.alert(
        "Order Placed!",
        `Your order #${response.data.orderId} has been placed successfully.`,
        [
          {
            text: "Track Order",
            onPress: () =>
              navigation.navigate("OrderTracking", {
                orderId: response.data._id,
              }),
          },
          {
            text: "Continue Shopping",
            onPress: () => navigation.navigate("Home"),
          },
        ]
      );
    } catch (error) {
      console.error("Order error:", error);
      const message = error.response?.data?.message || "Failed to place order";
      Alert.alert("Error", message);
    } finally {
      setLoading(false);
    }
  };

  const renderCartItem = ({ item }) => (
    <View style={styles.cartItem}>
      <Image
        source={{ uri: item.image || "https://via.placeholder.com/150" }}
        style={styles.itemImage}
        defaultSource={require("../../assets/placeholder.png")}
      />
      <View style={styles.itemDetails}>
        <Text style={styles.itemName} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.itemPrice}>৳{item.price}</Text>
      </View>
      <View style={styles.quantityContainer}>
        <TouchableOpacity
          style={styles.quantityButton}
          onPress={() => handleQuantityChange(item.id, item.quantity - 1)}
        >
          <Icon name="remove" size={18} color="#FF6B6B" />
        </TouchableOpacity>
        <Text style={styles.quantityText}>{item.quantity}</Text>
        <TouchableOpacity
          style={styles.quantityButton}
          onPress={() => handleQuantityChange(item.id, item.quantity + 1)}
        >
          <Icon name="add" size={18} color="#FF6B6B" />
        </TouchableOpacity>
      </View>
      <TouchableOpacity
        style={styles.removeButton}
        onPress={() => dispatch(removeFromCart(item.id))}
      >
        <Icon name="delete-outline" size={22} color="#999" />
      </TouchableOpacity>
    </View>
  );

  const handleQuantityChange = (productId, newQuantity) => {
    if (newQuantity === 0) {
      dispatch(removeFromCart(productId));
    } else {
      dispatch(updateQuantity({ productId, quantity: newQuantity }));
    }
  };

  const calculateTotals = () => {
    const subtotal = cart.totalAmount;
    const deliveryFee = subtotal >= 500 ? 0 : 30;
    const tax = subtotal * 0.05;
    const total = subtotal + deliveryFee + tax;

    return { subtotal, deliveryFee, tax, total };
  };

  const { subtotal, deliveryFee, tax, total } = calculateTotals();

  if (cart.items.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <StatusBar backgroundColor="#fff" barStyle="dark-content" />
        <View style={styles.emptyIcon}>
          <Icon name="shopping-cart" size={100} color="#E8E8E8" />
        </View>
        <Text style={styles.emptyTitle}>Your cart is empty</Text>
        <Text style={styles.emptyText}>
          Browse restaurants and add some delicious food to your cart!
        </Text>
        <TouchableOpacity
          style={styles.continueShoppingButton}
          onPress={() => navigation.navigate("Home")}
        >
          <Text style={styles.continueShoppingText}>Browse Restaurants</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#fff" barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back-ios" size={20} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Your Cart</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Restaurant Info */}
        <View style={styles.restaurantCard}>
          <View style={styles.restaurantInfo}>
            <Text style={styles.restaurantName}>{cart.restaurant.name}</Text>
            <Text style={styles.restaurantAddress} numberOfLines={2}>
              {cart.restaurant.address}
            </Text>
          </View>
          <Icon name="restaurant" size={20} color="#FF6B6B" />
        </View>

        {/* Cart Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Items</Text>
          <FlatList
            data={cart.items}
            renderItem={renderCartItem}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
        </View>

        {/* Delivery Address */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Delivery Address</Text>
            {locationLoading && (
              <ActivityIndicator size="small" color="#FF6B6B" />
            )}
          </View>

          <TextInput
            style={styles.textInput}
            placeholder="Enter your delivery address..."
            placeholderTextColor="#999"
            value={deliveryAddress}
            onChangeText={setDeliveryAddress}
            multiline
            numberOfLines={3}
          />

          <TouchableOpacity
            style={styles.locationButton}
            onPress={getCurrentLocation}
            disabled={locationLoading}
          >
            <Icon name="my-location" size={18} color="#FF6B6B" />
            <Text style={styles.locationButtonText}>
              {locationLoading ? "Getting Location..." : "Use Current Location"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Special Instructions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Special Instructions</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Any special instructions for the restaurant?"
            placeholderTextColor="#999"
            value={specialInstructions}
            onChangeText={setSpecialInstructions}
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Order Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.sectionTitle}>Order Summary</Text>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>৳{subtotal.toFixed(2)}</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Delivery Fee</Text>
            <Text style={styles.summaryValue}>
              {deliveryFee === 0 ? "FREE" : `৳${deliveryFee.toFixed(2)}`}
            </Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Tax (5%)</Text>
            <Text style={styles.summaryValue}>৳{tax.toFixed(2)}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>৳{total.toFixed(2)}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Checkout Footer */}
      <View style={styles.footer}>
        <View style={styles.totalContainer}>
          <Text style={styles.footerTotalLabel}>Total Amount</Text>
          <Text style={styles.footerTotalValue}>৳{total.toFixed(2)}</Text>
        </View>
        <TouchableOpacity
          style={[
            styles.checkoutButton,
            (loading || locationLoading) && styles.checkoutButtonDisabled,
          ]}
          onPress={handlePlaceOrder}
          disabled={loading || locationLoading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.checkoutButtonText}>Place Order</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1A1A1A",
  },
  headerRight: {
    width: 24,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#fff",
  },
  emptyIcon: {
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#333",
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 22,
  },
  continueShoppingButton: {
    backgroundColor: "#FF6B6B",
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  continueShoppingText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  restaurantCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  restaurantInfo: {
    flex: 1,
  },
  restaurantName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1A1A1A",
    marginBottom: 4,
  },
  restaurantAddress: {
    fontSize: 14,
    color: "#666",
    lineHeight: 18,
  },
  section: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1A1A1A",
    marginBottom: 12,
  },
  cartItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },
  itemImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  itemDetails: {
    flex: 1,
    marginLeft: 12,
  },
  itemName: {
    fontSize: 15,
    fontWeight: "500",
    color: "#333",
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 15,
    fontWeight: "600",
    color: "#FF6B6B",
  },
  quantityContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
    borderRadius: 8,
    padding: 4,
    marginHorizontal: 8,
  },
  quantityButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E8E8E8",
  },
  quantityText: {
    marginHorizontal: 12,
    fontSize: 15,
    fontWeight: "600",
    color: "#333",
    minWidth: 20,
    textAlign: "center",
  },
  removeButton: {
    padding: 6,
  },
  separator: {
    height: 1,
    backgroundColor: "#F0F0F0",
    marginVertical: 4,
  },
  textInput: {
    borderWidth: 1,
    borderColor: "#E8E8E8",
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: "#333",
    textAlignVertical: "top",
    backgroundColor: "#F8F9FA",
    minHeight: 80,
  },
  locationButton: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    padding: 12,
    backgroundColor: "#F0F8FF",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E1F0FF",
  },
  locationButtonText: {
    marginLeft: 8,
    color: "#FF6B6B",
    fontSize: 14,
    fontWeight: "500",
  },
  summaryCard: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: "#666",
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
  },
  divider: {
    height: 1,
    backgroundColor: "#F0F0F0",
    marginVertical: 12,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1A1A1A",
  },
  totalValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FF6B6B",
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
    paddingBottom: 20,
  },
  totalContainer: {
    flex: 1,
  },
  footerTotalLabel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 2,
  },
  footerTotalValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FF6B6B",
  },
  checkoutButton: {
    backgroundColor: "#FF6B6B",
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    minWidth: 140,
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  checkoutButtonDisabled: {
    backgroundColor: "#CCC",
  },
  checkoutButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default CartScreen;
