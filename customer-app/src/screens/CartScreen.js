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
      // Calculate totals
      const subtotal = cart.totalAmount;
      const deliveryFee = subtotal >= 500 ? 0 : 30;
      const taxAmount = subtotal * 0.05;
      const totalAmount = subtotal + deliveryFee + taxAmount;

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

        // Add missing required fields
        orderId: `CL-${Date.now()}`,
        customerId: user?._id || "65a1b2c3d4e5f67890123456",
        customerName: user?.name || "Customer",
        customerPhone: user?.phone || "0123456789",
        subtotal: subtotal,
        deliveryFee: deliveryFee,
        taxAmount: taxAmount,
        totalAmount: totalAmount,
      };

      console.log("Submitting Order Data:", JSON.stringify(orderData, null, 2));

      // Temporary: Add detailed error logging
      const response = await orderAPI.create(orderData);

      console.log("Order response:", response.data);

      dispatch(clearCart());

      Alert.alert(
        "Order Placed!",
        `Your order #${response.data.data.orderId} has been placed successfully.`,
        [
          {
            text: "Track Order",
            onPress: () =>
              navigation.navigate("OrderTracking", {
                orderId: response.data.data._id,
              }),
          },
          {
            text: "Continue Shopping",
            onPress: () => navigation.navigate("Home"),
          },
        ]
      );
    } catch (error) {
      console.error("Full order error:", error);

      // Detailed error information
      let errorMessage = "Failed to place order";

      if (error.response) {
        // Server responded with error status
        console.log("Error response data:", error.response.data);
        console.log("Error response status:", error.response.status);

        errorMessage =
          error.response.data?.message ||
          error.response.data?.error ||
          `Server error (${error.response.status})`;
      } else if (error.request) {
        // Request was made but no response received
        console.log("Error request:", error.request);
        errorMessage = "No response from server. Please check your connection.";
      } else {
        // Something else happened
        errorMessage = error.message || "Unknown error occurred";
      }

      Alert.alert("Order Failed", errorMessage);
    } finally {
      setLoading(false);
    }
  };

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
          onPress={() => handleQuantityChange(item._id, item.quantity - 1)}
        >
          <Icon name="remove" size={18} color="#FF6B6B" />
        </TouchableOpacity>
        <Text style={styles.quantityText}>{item.quantity}</Text>
        <TouchableOpacity
          style={styles.quantityButton}
          onPress={() => handleQuantityChange(item._id, item.quantity + 1)}
        >
          <Icon name="add" size={18} color="#FF6B6B" />
        </TouchableOpacity>
      </View>
      <TouchableOpacity
        style={styles.removeButton}
        onPress={() => dispatch(removeFromCart(item._id))}
      >
        <Icon name="delete-outline" size={22} color="#999" />
      </TouchableOpacity>
    </View>
  );

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
            keyExtractor={(item) => item._id}
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
