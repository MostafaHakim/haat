import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useSelector, useDispatch } from "react-redux";
import { orderAPI } from "../services/api";
import {
  fetchAvailableOrdersSuccess,
  removeAvailableOrder,
  setActiveOrder,
} from "../store/slices/ordersSlice";
import { setAvailability } from "../store/slices/authSlice";
import Icon from "react-native-vector-icons/MaterialIcons";
import { Audio } from "expo-av"; // Make sure to install expo-av: expo install expo-av

const AvailableOrdersScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [acceptingOrder, setAcceptingOrder] = useState(null);
  const [sound, setSound] = useState();
  const dispatch = useDispatch();
  const { availableOrders } = useSelector((state) => state.orders);
  const { user } = useSelector((state) => state.auth);
  const { activeOrder } = useSelector((state) => state.orders);

  async function playSound() {
    console.log("Loading Sound");
    // Add your sound file in assets folder and uncomment the line below
    // const { sound } = await Audio.Sound.createAsync( require('../assets/notification.mp3'));
    // setSound(sound);

    // console.log("Playing Sound");
    // await sound.playAsync();
  }

  useEffect(() => {
    return sound
      ? () => {
          console.log("Unloading Sound");
          sound.unloadAsync();
        }
      : undefined;
  }, [sound]);

  useEffect(() => {
    if (availableOrders.length > 0) {
      playSound();
      const timer = setTimeout(() => {
        if (sound) {
          sound.stopAsync();
        }
      }, 20000);
      return () => clearTimeout(timer);
    }
  }, [availableOrders]);

  useEffect(() => {
    console.log("AvailableOrders Screen - User:", user);
    console.log("User location:", user?.location);
    loadAvailableOrders();
  }, []);

  // ActiveOrderScreen.js - লোকেশন ট্র্যাকিং যোগ করুন
  useEffect(() => {
    let locationInterval;

    if (activeOrder && activeOrder.status !== "delivered") {
      // Update location every 30 seconds
      locationInterval = setInterval(async () => {
        try {
          const location = await Location.getCurrentPositionAsync({});
          const locationData = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            address: "Current Location",
          };

          // Update rider location in backend
          await userAPI.updateLocation(locationData);

          // Update local state
          setRiderLocation(locationData);
        } catch (error) {
          console.warn("Location update failed:", error);
        }
      }, 30000);
    }

    return () => {
      if (locationInterval) {
        clearInterval(locationInterval);
      }
    };
  }, [activeOrder]);

  const loadAvailableOrders = async () => {
    try {
      setLoading(true);
      console.log("Loading available orders...");

      const response = await orderAPI.getAvailable();
      console.log("API Response:", response.data);

      // ✅ সঠিক response structure handle করুন
      const ordersData = response.data.data || response.data || [];
      console.log("Orders data to dispatch:", ordersData);

      dispatch(fetchAvailableOrdersSuccess(ordersData));
    } catch (error) {
      console.error("Load available orders error:", error);
      console.log("Error details:", error.response?.data);
      Alert.alert("Error", "Failed to load available orders");
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAvailableOrders();
    setRefreshing(false);
  };

  const handleAcceptOrder = async (order) => {
    if (sound) {
      sound.stopAsync();
    }
    try {
      setAcceptingOrder(order._id);

      console.log("🔄 Accepting order:", order._id);
      const response = await orderAPI.acceptOrder(order._id);
      console.log("✅ Order accepted:", response.data);

      if (response.data.success) {
        dispatch(setActiveOrder(response.data.data));
        dispatch(removeAvailableOrder(order._id));
        dispatch(setAvailability(false));

        Alert.alert("Success 🎉", "Order accepted successfully!");
      } else {
        Alert.alert(
          "Failed",
          response.data.message || "Failed to accept order"
        );
      }
    } catch (error) {
      console.error("❌ Accept Error:", error.response?.data);
      const message =
        error.response?.data?.message || "Server error. Try again.";
      Alert.alert("Accept Failed", message);
    } finally {
      setAcceptingOrder(null);
    }
  };

  const handleRejectOrder = (order) => {
    if (sound) {
      sound.stopAsync();
    }
    dispatch(removeAvailableOrder(order._id));
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return "N/A";

    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return (R * c).toFixed(1);
  };

  const getDeliveryFee = (order) => {
    return order.deliveryFee || 30;
  };

  const renderOrderItem = ({ item }) => {
    console.log("Rendering order item:", item);

    const restaurant = item.restaurantId || {};
    const distance =
      user?.location && restaurant.location
        ? calculateDistance(
            user.location.latitude,
            user.location.longitude,
            restaurant.location.coordinates?.[1] ||
              restaurant.location.latitude,
            restaurant.location.coordinates?.[0] ||
              restaurant.location.longitude
          )
        : "N/A";

    return (
      <View style={styles.orderCard}>
        <View style={styles.orderHeader}>
          <View>
            <Text style={styles.orderId}>#{item.orderId}</Text>
            <Text style={styles.restaurantName}>
              {restaurant.name || "Unknown Restaurant"}
            </Text>
          </View>
          <View style={styles.distanceBadge}>
            <Icon name="location-on" size={14} color="#fff" />
            <Text style={styles.distanceText}>{distance} km</Text>
          </View>
        </View>

        <View style={styles.orderDetails}>
          <View style={styles.detailRow}>
            <Icon name="place" size={16} color="#666" />
            <Text style={styles.detailText} numberOfLines={2}>
              {restaurant.address || "Address not available"}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Icon name="person" size={16} color="#666" />
            <Text style={styles.detailText}>
              {item.customerName || "Customer"}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Icon name="list-alt" size={16} color="#666" />
            <Text style={styles.detailText}>
              {item.items?.length || 0} item
              {(item.items?.length || 0) !== 1 ? "s" : ""}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Icon name="attach-money" size={16} color="#666" />
            <Text style={styles.detailText}>
              Delivery Fee: ৳{getDeliveryFee(item)}
            </Text>
          </View>
        </View>

        <View style={styles.orderFooter}>
          <View style={styles.orderMeta}>
            <Text style={styles.orderTime}>
              {item.createdAt
                ? new Date(item.createdAt).toLocaleTimeString()
                : "Time N/A"}
            </Text>
            <Text style={styles.orderTotal}>
              Total: ৳{item.totalAmount?.toFixed(2) || "0.00"}
            </Text>
          </View>

          <TouchableOpacity
            style={[
              styles.acceptButton,
              (!user?.isAvailable || acceptingOrder) &&
                styles.acceptButtonDisabled,
            ]}
            onPress={() => handleAcceptOrder(item)}
            disabled={!user?.isAvailable || acceptingOrder}
          >
            {acceptingOrder === item._id ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Icon name="check" size={18} color="#fff" />
                <Text style={styles.acceptButtonText}>Accept</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // Debug info দেখান (শুধু development-এ)
  const DebugInfo = () => (
    <View style={styles.debugInfo}>
      <Text style={styles.debugText}>
        Orders: {availableOrders.length} | User Online:{" "}
        {user?.isAvailable ? "Yes" : "No"} | Location:{" "}
        {user?.location ? "Set" : "Not Set"}
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Loading available orders...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header Info */}
      <View style={styles.header}>
        <Text style={styles.title}>Available Orders</Text>
        <Text style={styles.subtitle}>
          {availableOrders.length} order
          {availableOrders.length !== 1 ? "s" : ""} available nearby
        </Text>

        {!user?.isAvailable && (
          <View style={styles.offlineWarning}>
            <Icon name="warning" size={16} color="#FF9800" />
            <Text style={styles.offlineText}>
              You are offline. Go online to accept orders.
            </Text>
          </View>
        )}
      </View>

      {/* Debug Info */}
      {__DEV__ && <DebugInfo />}

      {/* Orders List */}
      <FlatList
        data={availableOrders}
        renderItem={renderOrderItem}
        keyExtractor={(item) => item._id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.ordersList}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="local-shipping" size={64} color="#ddd" />
            <Text style={styles.emptyText}>No available orders</Text>
            <Text style={styles.emptySubtext}>
              {user?.isAvailable
                ? "New orders will appear here when available"
                : "Go online to see available orders"}
            </Text>
            {!user?.isAvailable && (
              <TouchableOpacity
                style={styles.goOnlineButton}
                onPress={() => dispatch(setAvailability(true))}
              >
                <Text style={styles.goOnlineText}>Go Online</Text>
              </TouchableOpacity>
            )}
          </View>
        }
      />
    </View>
  );
};

// Styles-এ debug info যোগ করুন
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f8f8",
    padding: 15,
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
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    marginBottom: 10,
  },
  offlineWarning: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF3E0",
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
  },
  offlineText: {
    marginLeft: 8,
    color: "#FF9800",
    fontSize: 14,
    fontWeight: "500",
  },
  ordersList: {
    paddingBottom: 20,
  },
  orderCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  orderId: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  restaurantName: {
    fontSize: 14,
    color: "#4CAF50",
    fontWeight: "600",
  },
  distanceBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#4CAF50",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  distanceText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
    marginLeft: 4,
  },
  orderDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  detailText: {
    fontSize: 14,
    color: "#666",
    marginLeft: 8,
    flex: 1,
  },
  orderFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    paddingTop: 12,
  },
  orderMeta: {
    flex: 1,
  },
  orderTime: {
    fontSize: 12,
    color: "#666",
    marginBottom: 2,
  },
  orderTotal: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
  },
  acceptButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#4CAF50",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  acceptButtonDisabled: {
    backgroundColor: "#ccc",
  },
  acceptButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 4,
  },
  emptyContainer: {
    alignItems: "center",
    padding: 40,
    marginTop: 50,
  },
  emptyText: {
    fontSize: 18,
    color: "#666",
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
    marginBottom: 20,
  },
  goOnlineButton: {
    backgroundColor: "#4CAF50",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 6,
  },
  goOnlineText: {
    color: "#fff",
    fontWeight: "600",
  },
  debugInfo: {
    backgroundColor: "#f0f0f0",
    padding: 8,
    borderRadius: 4,
    marginBottom: 10,
  },
  debugText: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
  },
});

export default AvailableOrdersScreen;
