import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
} from "react-native";
import { useSelector, useDispatch } from "react-redux";
import MapView, { Marker, Polyline } from "react-native-maps";
import { orderAPI } from "../services/api";
import {
  updateOrderStatus,
  updateRiderLocation,
} from "../store/slices/orderSlice";
import Icon from "react-native-vector-icons/MaterialIcons";
import io from "socket.io-client";

const { width } = Dimensions.get("window");

const OrderTrackingScreen = ({ route, navigation }) => {
  const { orderId } = route.params;
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [riderLocation, setRiderLocation] = useState(null);
  const [eta, setEta] = useState(null);
  const [socket, setSocket] = useState(null);

  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const progressAnim = useRef(new Animated.Value(0)).current;

  const statusSteps = [
    { key: "pending", label: "Order Placed", icon: "receipt" },
    { key: "confirmed", label: "Confirmed", icon: "check-circle" },
    { key: "preparing", label: "Preparing", icon: "restaurant" },
    { key: "ready", label: "Ready", icon: "done" },
    { key: "assigned", label: "Rider Assigned", icon: "person" },
    { key: "picked_up", label: "Picked Up", icon: "package" },
    { key: "on_the_way", label: "On the Way", icon: "motorcycle" },
    { key: "delivered", label: "Delivered", icon: "home" },
  ];

  useEffect(() => {
    fetchOrderDetails();
    setupWebSocket();

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [orderId]);

  useEffect(() => {
    if (order) {
      animateProgress();
      calculateETA();
    }
  }, [order]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      const response = await orderAPI.getById(orderId);
      setOrder(response.data);
      dispatch(updateOrderStatus({ orderId, status: response.data.status }));
    } catch (error) {
      console.error("Fetch order error:", error);
      Alert.alert("Error", "Failed to load order details");
    } finally {
      setLoading(false);
    }
  };

  const setupWebSocket = () => {
    const newSocket = io("http://localhost:5000", {
      transports: ["websocket"],
    });

    newSocket.on("connect", () => {
      console.log("Connected to WebSocket");
      newSocket.emit("join-user", user.id);
    });

    newSocket.on("order-status-updated", (data) => {
      if (data.orderId === orderId) {
        setOrder(data.order);
        dispatch(updateOrderStatus({ orderId, status: data.order.status }));
        showStatusUpdateNotification(data.order.status);
      }
    });

    newSocket.on("rider-location-updated", (data) => {
      if (data.orderId === orderId) {
        setRiderLocation(data.location);
        dispatch(updateRiderLocation({ orderId, location: data.location }));
        calculateETA();
      }
    });

    newSocket.on("rider-assigned", (data) => {
      if (data.order._id === orderId) {
        setOrder(data.order);
        Alert.alert(
          "Rider Assigned!",
          `Rider ${data.order.riderId.name} is on the way to the restaurant.`
        );
      }
    });

    newSocket.on("disconnect", () => {
      console.log("Disconnected from WebSocket");
    });

    setSocket(newSocket);
  };

  const animateProgress = () => {
    const currentStatusIndex = statusSteps.findIndex(
      (step) => step.key === order.status
    );
    const progress = (currentStatusIndex + 1) / statusSteps.length;

    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 1000,
      useNativeDriver: false,
    }).start();
  };

  const calculateETA = () => {
    if (!order) return;

    let etaMinutes = 0;
    const now = new Date();
    const orderTime = new Date(order.createdAt);

    switch (order.status) {
      case "pending":
      case "confirmed":
        etaMinutes = order.estimatedPreparationTime + 30;
        break;
      case "preparing":
        etaMinutes =
          order.estimatedPreparationTime - (now - orderTime) / (1000 * 60) + 25;
        break;
      case "ready":
      case "assigned":
        etaMinutes = 20;
        break;
      case "picked_up":
      case "on_the_way":
        if (riderLocation && order.deliveryLocation) {
          // Simple distance calculation (in practice, use proper routing)
          const distance = calculateDistance(
            riderLocation.latitude,
            riderLocation.longitude,
            order.deliveryLocation.latitude,
            order.deliveryLocation.longitude
          );
          etaMinutes = (distance / 30) * 60; // Assuming 30 km/h average speed
        } else {
          etaMinutes = 15;
        }
        break;
      case "delivered":
        etaMinutes = 0;
        break;
      default:
        etaMinutes = 30;
    }

    setEta(Math.max(0, Math.round(etaMinutes)));
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const showStatusUpdateNotification = (status) => {
    const statusMessages = {
      confirmed: "Restaurant has confirmed your order!",
      preparing: "Your food is being prepared!",
      ready: "Your order is ready for pickup!",
      assigned: "A rider has been assigned to your order!",
      picked_up: "Rider has picked up your order!",
      on_the_way: "Your order is on the way!",
      delivered: "Order delivered! Enjoy your meal!",
    };

    if (statusMessages[status]) {
      Alert.alert("Order Update", statusMessages[status]);
    }
  };

  const getStatusIndex = (status) => {
    return statusSteps.findIndex((step) => step.key === status);
  };

  const getProgressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  const renderStatusTracker = () => {
    const currentStatusIndex = getStatusIndex(order.status);

    return (
      <View style={styles.statusContainer}>
        <Text style={styles.sectionTitle}>Order Status</Text>

        {/* Progress Bar */}
        <View style={styles.progressBarContainer}>
          <Animated.View
            style={[styles.progressBar, { width: getProgressWidth }]}
          />
        </View>

        {/* Status Steps */}
        <View style={styles.statusSteps}>
          {statusSteps.map((step, index) => {
            const isCompleted = index <= currentStatusIndex;
            const isCurrent = index === currentStatusIndex;

            return (
              <View key={step.key} style={styles.statusStep}>
                <View
                  style={[
                    styles.statusIconContainer,
                    isCompleted && styles.statusIconCompleted,
                    isCurrent && styles.statusIconCurrent,
                  ]}
                >
                  <Icon
                    name={step.icon}
                    size={16}
                    color={isCompleted ? "#fff" : "#999"}
                  />
                </View>
                <Text
                  style={[
                    styles.statusLabel,
                    isCompleted && styles.statusLabelCompleted,
                    isCurrent && styles.statusLabelCurrent,
                  ]}
                >
                  {step.label}
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  const renderOrderInfo = () => (
    <View style={styles.orderInfoContainer}>
      <Text style={styles.sectionTitle}>Order Details</Text>

      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>Order ID:</Text>
        <Text style={styles.infoValue}>{order.orderId}</Text>
      </View>

      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>Restaurant:</Text>
        <Text style={styles.infoValue}>{order.restaurantId.name}</Text>
      </View>

      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>Delivery Address:</Text>
        <Text style={styles.infoValue}>{order.deliveryAddress}</Text>
      </View>

      {order.riderId && (
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Rider:</Text>
          <Text style={styles.infoValue}>
            {order.riderId.name} ({order.riderId.vehicleType})
          </Text>
        </View>
      )}

      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>Total Amount:</Text>
        <Text style={styles.infoValue}>৳{order.totalAmount.toFixed(2)}</Text>
      </View>

      {eta !== null && eta > 0 && (
        <View style={styles.etaContainer}>
          <Icon name="access-time" size={20} color="#FF6B6B" />
          <Text style={styles.etaText}>
            Estimated delivery in {eta} minutes
          </Text>
        </View>
      )}
    </View>
  );

  const renderMap = () => {
    if (!order || !order.deliveryLocation) return null;

    const restaurantLocation = {
      latitude: order.restaurantId.location.coordinates[1],
      longitude: order.restaurantId.location.coordinates[0],
    };

    const deliveryLocation = {
      latitude: order.deliveryLocation.latitude,
      longitude: order.deliveryLocation.longitude,
    };

    const region = {
      latitude: (restaurantLocation.latitude + deliveryLocation.latitude) / 2,
      longitude:
        (restaurantLocation.longitude + deliveryLocation.longitude) / 2,
      latitudeDelta: 0.02,
      longitudeDelta: 0.02,
    };

    return (
      <View style={styles.mapContainer}>
        <Text style={styles.sectionTitle}>Live Tracking</Text>
        <MapView
          style={styles.map}
          region={region}
          showsUserLocation={true}
          showsMyLocationButton={true}
        >
          {/* Restaurant Marker */}
          <Marker
            coordinate={restaurantLocation}
            title={order.restaurantId.name}
            description="Restaurant"
          >
            <View style={styles.restaurantMarker}>
              <Icon name="restaurant" size={20} color="#fff" />
            </View>
          </Marker>

          {/* Delivery Location Marker */}
          <Marker
            coordinate={deliveryLocation}
            title="Delivery Location"
            description={order.deliveryAddress}
          >
            <View style={styles.deliveryMarker}>
              <Icon name="home" size={20} color="#fff" />
            </View>
          </Marker>

          {/* Rider Marker */}
          {riderLocation && (
            <Marker
              coordinate={riderLocation}
              title="Rider"
              description={order.riderId?.name}
            >
              <View style={styles.riderMarker}>
                <Icon name="motorcycle" size={20} color="#fff" />
              </View>
            </Marker>
          )}

          {/* Route from restaurant to delivery location */}
          <Polyline
            coordinates={[restaurantLocation, deliveryLocation]}
            strokeColor="#FF6B6B"
            strokeWidth={3}
          />
        </MapView>
      </View>
    );
  };

  const renderRiderInfo = () => {
    if (!order.riderId) return null;

    return (
      <View style={styles.riderInfoContainer}>
        <Text style={styles.sectionTitle}>Your Rider</Text>
        <View style={styles.riderDetails}>
          <View style={styles.riderAvatar}>
            <Text style={styles.riderInitial}>
              {order.riderId.name.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.riderText}>
            <Text style={styles.riderName}>{order.riderId.name}</Text>
            <Text style={styles.riderVehicle}>{order.riderId.vehicleType}</Text>
            <Text style={styles.riderPhone}>{order.riderId.phone}</Text>
          </View>
          <TouchableOpacity style={styles.callButton}>
            <Icon name="call" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#FF6B6B" />
        <Text style={styles.loadingText}>Loading order details...</Text>
      </View>
    );
  }

  if (!order) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Order not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {renderStatusTracker()}
      {renderOrderInfo()}
      {renderRiderInfo()}
      {renderMap()}

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={fetchOrderDetails}
        >
          <Icon name="refresh" size={20} color="#FF6B6B" />
          <Text style={styles.actionButtonText}>Refresh</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate("Home")}
        >
          <Icon name="home" size={20} color="#FF6B6B" />
          <Text style={styles.actionButtonText}>Home</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
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
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    color: "#666",
    fontSize: 16,
  },
  errorText: {
    fontSize: 18,
    color: "#666",
    textAlign: "center",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
    color: "#333",
  },
  statusContainer: {
    padding: 20,
    backgroundColor: "#f8f8f8",
    marginBottom: 10,
  },
  progressBarContainer: {
    height: 4,
    backgroundColor: "#e0e0e0",
    borderRadius: 2,
    marginBottom: 30,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    backgroundColor: "#FF6B6B",
    borderRadius: 2,
  },
  statusSteps: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  statusStep: {
    alignItems: "center",
    flex: 1,
  },
  statusIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
    borderWidth: 2,
    borderColor: "#e0e0e0",
  },
  statusIconCompleted: {
    backgroundColor: "#FF6B6B",
    borderColor: "#FF6B6B",
  },
  statusIconCurrent: {
    backgroundColor: "#FF6B6B",
    borderColor: "#FF6B6B",
    transform: [{ scale: 1.2 }],
  },
  statusLabel: {
    fontSize: 10,
    color: "#999",
    textAlign: "center",
    fontWeight: "500",
  },
  statusLabelCompleted: {
    color: "#333",
    fontWeight: "600",
  },
  statusLabelCurrent: {
    color: "#FF6B6B",
    fontWeight: "bold",
  },
  orderInfoContainer: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  infoValue: {
    fontSize: 14,
    color: "#333",
    fontWeight: "600",
    textAlign: "right",
    flex: 1,
    marginLeft: 10,
  },
  etaContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF5F5",
    padding: 15,
    borderRadius: 8,
    marginTop: 10,
  },
  etaText: {
    marginLeft: 10,
    fontSize: 16,
    color: "#FF6B6B",
    fontWeight: "600",
  },
  riderInfoContainer: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  riderDetails: {
    flexDirection: "row",
    alignItems: "center",
  },
  riderAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#FF6B6B",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  riderInitial: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  riderText: {
    flex: 1,
  },
  riderName: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
  },
  riderVehicle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 2,
  },
  riderPhone: {
    fontSize: 14,
    color: "#666",
  },
  callButton: {
    backgroundColor: "#4CAF50",
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  mapContainer: {
    padding: 20,
  },
  map: {
    width: "100%",
    height: 250,
    borderRadius: 12,
  },
  restaurantMarker: {
    backgroundColor: "#FF6B6B",
    padding: 8,
    borderRadius: 20,
  },
  deliveryMarker: {
    backgroundColor: "#4CAF50",
    padding: 8,
    borderRadius: 20,
  },
  riderMarker: {
    backgroundColor: "#2196F3",
    padding: 8,
    borderRadius: 20,
  },
  actionButtons: {
    flexDirection: "row",
    padding: 20,
    justifyContent: "space-around",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f8f8",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 120,
    justifyContent: "center",
  },
  actionButtonText: {
    marginLeft: 8,
    color: "#FF6B6B",
    fontWeight: "600",
  },
});

// TouchableOpacity import যোগ করুন
import { TouchableOpacity } from "react-native";

export default OrderTrackingScreen;
