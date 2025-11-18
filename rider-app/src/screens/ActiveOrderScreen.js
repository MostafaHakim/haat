import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";
import { useSelector, useDispatch } from "react-redux";
import { orderAPI, userAPI } from "../services/api";
import {
  updateActiveOrder,
  clearActiveOrder,
  updateOrderStatus,
  addToHistory,
} from "../store/slices/ordersSlice";
import { setAvailability } from "../store/slices/authSlice";
import * as Location from "expo-location";
import Icon from "react-native-vector-icons/MaterialIcons";
import io from "socket.io-client";

const { width, height } = Dimensions.get("window");

const ActiveOrderScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [riderLocation, setRiderLocation] = useState(null);
  const [socket, setSocket] = useState(null);
  const [region, setRegion] = useState(null);
  const [eta, setEta] = useState(null);
  const mapRef = useRef(null);

  const dispatch = useDispatch();
  const { activeOrder } = useSelector((state) => state.orders);
  const { user, token } = useSelector((state) => state.auth);

  useEffect(() => {
    if (activeOrder) {
      initializeOrderTracking();
      setupWebSocket();
      startLocationTracking();
    } else {
      setLoading(false);
    }

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [activeOrder]);

  const initializeOrderTracking = async () => {
    try {
      setLoading(true);

      // Get current location
      let location = await Location.getCurrentPositionAsync({});
      setRiderLocation(location.coords);

      // Calculate initial region for map
      const restaurantLocation = {
        latitude: activeOrder.restaurantId.location.coordinates[1],
        longitude: activeOrder.restaurantId.location.coordinates[0],
      };

      const deliveryLocation = {
        latitude: activeOrder.deliveryLocation.latitude,
        longitude: activeOrder.deliveryLocation.longitude,
      };

      const initialRegion = calculateRegion(
        restaurantLocation,
        deliveryLocation
      );
      setRegion(initialRegion);

      // Calculate initial ETA
      calculateETA(location.coords, deliveryLocation);
    } catch (error) {
      console.error("Initialize order tracking error:", error);
      Alert.alert("Error", "Failed to initialize order tracking");
    } finally {
      setLoading(false);
    }
  };

  const setupWebSocket = () => {
    const newSocket = io("https://haat-zkun.onrender.com", {
      transports: ["websocket"],
    });

    newSocket.on("connect", () => {
      console.log("Connected to WebSocket");
      newSocket.emit("join-user", user.id);
    });

    newSocket.on("order-status-updated", (data) => {
      if (data.orderId === activeOrder._id) {
        dispatch(updateActiveOrder(data.order));
      }
    });

    newSocket.on("disconnect", () => {
      console.log("Disconnected from WebSocket");
    });

    setSocket(newSocket);
  };

  const startLocationTracking = async () => {
    // Update location every 30 seconds
    const locationInterval = setInterval(async () => {
      if (!activeOrder) {
        clearInterval(locationInterval);
        return;
      }

      try {
        let location = await Location.getCurrentPositionAsync({});
        setRiderLocation(location.coords);

        // Update rider location in backend
        await userAPI.updateLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          address: "Current Location",
        });

        // Emit location update via socket
        if (socket) {
          socket.emit("rider-location-update", {
            orderId: activeOrder._id,
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            restaurantId: activeOrder.restaurantId._id,
            customerId: activeOrder.customerId._id,
          });
        }

        // Update ETA
        calculateETA(location.coords, activeOrder.deliveryLocation);
      } catch (error) {
        console.error("Location tracking error:", error);
      }
    }, 30000);

    return () => clearInterval(locationInterval);
  };

  const calculateRegion = (loc1, loc2) => {
    const minLat = Math.min(loc1.latitude, loc2.latitude);
    const maxLat = Math.max(loc1.latitude, loc2.latitude);
    const minLng = Math.min(loc1.longitude, loc2.longitude);
    const maxLng = Math.max(loc1.longitude, loc2.longitude);

    const latitude = (minLat + maxLat) / 2;
    const longitude = (minLng + maxLng) / 2;
    const latitudeDelta = (maxLat - minLat) * 1.5;
    const longitudeDelta = (maxLng - minLng) * 1.5;

    return {
      latitude,
      longitude,
      latitudeDelta: Math.max(latitudeDelta, 0.01),
      longitudeDelta: Math.max(longitudeDelta, 0.01),
    };
  };

  const calculateETA = (currentLocation, destination) => {
    if (!currentLocation || !destination) return;

    const distance = calculateDistance(
      currentLocation.latitude,
      currentLocation.longitude,
      destination.latitude,
      destination.longitude
    );

    // Assuming average speed of 20 km/h in city traffic
    const averageSpeed = 20; // km/h
    const etaHours = distance / averageSpeed;
    const etaMinutes = Math.round(etaHours * 60);

    setEta(etaMinutes);
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
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
    return R * c;
  };

  const handleStatusUpdate = async (newStatus) => {
    try {
      setUpdatingStatus(true);

      const statusData = {
        status: newStatus,
        location: riderLocation,
      };

      const response = await orderAPI.updateRiderStatus(
        activeOrder._id,
        statusData
      );

      // Update Redux store
      dispatch(
        updateOrderStatus({ orderId: activeOrder._id, status: newStatus })
      );
      dispatch(updateActiveOrder(response.data));

      // If order is delivered, clear active order and make rider available
      if (newStatus === "delivered") {
        dispatch(addToHistory(response.data));
        dispatch(clearActiveOrder());
        dispatch(setAvailability(true));

        Alert.alert(
          "Delivery Completed!",
          `Order #${activeOrder.orderId} has been delivered successfully.`,
          [
            {
              text: "View Earnings",
              onPress: () => navigation.navigate("Earnings"),
            },
            {
              text: "Find New Orders",
              onPress: () => navigation.navigate("Orders"),
            },
          ]
        );
      } else {
        Alert.alert("Success", `Order status updated to ${newStatus}`);
      }
    } catch (error) {
      console.error("Update status error:", error);
      Alert.alert("Error", "Failed to update order status");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const showStatusUpdateDialog = () => {
    const statusOptions = {
      assigned: ["picked_up"],
      picked_up: ["on_the_way"],
      on_the_way: ["delivered"],
    };

    const availableStatuses = statusOptions[activeOrder.status] || [];

    if (availableStatuses.length === 0) {
      Alert.alert("Info", "No further actions available for this order");
      return;
    }

    const statusLabels = {
      picked_up: "Mark as Picked Up",
      on_the_way: "Start Delivery",
      delivered: "Mark as Delivered",
    };

    Alert.alert(
      "Update Delivery Status",
      `Current status: ${activeOrder.status}`,
      availableStatuses
        .map((status) => ({
          text: statusLabels[status] || status,
          onPress: () => handleStatusUpdate(status),
        }))
        .concat([{ text: "Cancel", style: "cancel" }])
    );
  };

  const getStatusInfo = () => {
    const statusInfo = {
      assigned: {
        title: "Go to Restaurant",
        subtitle: "Head to the restaurant to pick up the order",
        icon: "restaurant",
        color: "#FF9800",
        nextAction: "Pick Up Order",
      },
      picked_up: {
        title: "Deliver to Customer",
        subtitle: "You have the order. Deliver it to the customer",
        icon: "motorcycle",
        color: "#2196F3",
        nextAction: "Start Delivery",
      },
      on_the_way: {
        title: "On the Way",
        subtitle: `ETA: ${eta} minutes`,
        icon: "navigation",
        color: "#4CAF50",
        nextAction: "Mark Delivered",
      },
    };

    return statusInfo[activeOrder.status] || {};
  };

  const renderMap = () => {
    if (!region || !activeOrder) return null;

    const restaurantLocation = {
      latitude: activeOrder.restaurantId.location.coordinates[1],
      longitude: activeOrder.restaurantId.location.coordinates[0],
    };

    const deliveryLocation = {
      latitude: activeOrder.deliveryLocation.latitude,
      longitude: activeOrder.deliveryLocation.longitude,
    };

    return (
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          style={styles.map}
          region={region}
          showsUserLocation={true}
          showsMyLocationButton={true}
        >
          {/* Restaurant Marker */}
          <Marker
            coordinate={restaurantLocation}
            title={activeOrder.restaurantId.name}
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
            description={activeOrder.deliveryAddress}
          >
            <View style={styles.deliveryMarker}>
              <Icon name="home" size={20} color="#fff" />
            </View>
          </Marker>

          {/* Rider Marker */}
          {riderLocation && (
            <Marker coordinate={riderLocation} title="Your Location">
              <View style={styles.riderMarker}>
                <Icon name="person" size={16} color="#fff" />
              </View>
            </Marker>
          )}

          {/* Route from restaurant to delivery location */}
          <Polyline
            coordinates={[restaurantLocation, deliveryLocation]}
            strokeColor="#4CAF50"
            strokeWidth={4}
            lineDashPattern={[5, 5]}
          />

          {/* Route from rider to next destination */}
          {riderLocation && (
            <Polyline
              coordinates={[
                riderLocation,
                activeOrder.status === "assigned"
                  ? restaurantLocation
                  : deliveryLocation,
              ]}
              strokeColor="#2196F3"
              strokeWidth={3}
            />
          )}
        </MapView>

        {/* ETA Overlay */}
        {eta && activeOrder.status === "on_the_way" && (
          <View style={styles.etaOverlay}>
            <Text style={styles.etaTitle}>Estimated Arrival</Text>
            <Text style={styles.etaTime}>{eta} min</Text>
          </View>
        )}
      </View>
    );
  };

  const renderOrderInfo = () => {
    const statusInfo = getStatusInfo();

    return (
      <View style={styles.orderInfoContainer}>
        <View style={styles.statusHeader}>
          <View
            style={[styles.statusIcon, { backgroundColor: statusInfo.color }]}
          >
            <Icon name={statusInfo.icon} size={24} color="#fff" />
          </View>
          <View style={styles.statusText}>
            <Text style={styles.statusTitle}>{statusInfo.title}</Text>
            <Text style={styles.statusSubtitle}>{statusInfo.subtitle}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Order Details */}
        <View style={styles.detailsSection}>
          <Text style={styles.sectionTitle}>Order Details</Text>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Order ID:</Text>
            <Text style={styles.detailValue}>#{activeOrder.orderId}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Restaurant:</Text>
            <Text style={styles.detailValue}>
              {activeOrder.restaurantId.name}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Customer:</Text>
            <Text style={styles.detailValue}>{activeOrder.customerName}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Delivery Address:</Text>
            <Text style={styles.detailValue} numberOfLines={2}>
              {activeOrder.deliveryAddress}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Items:</Text>
            <Text style={styles.detailValue}>
              {activeOrder.items.length} item
              {activeOrder.items.length !== 1 ? "s" : ""}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Delivery Fee:</Text>
            <Text style={styles.deliveryFee}>
              ৳{activeOrder.deliveryFee || 30}
            </Text>
          </View>
        </View>

        {/* Customer Contact */}
        <View style={styles.contactSection}>
          <Text style={styles.sectionTitle}>Customer Contact</Text>
          <View style={styles.contactButtons}>
            <TouchableOpacity style={styles.contactButton}>
              <Icon name="call" size={20} color="#4CAF50" />
              <Text style={styles.contactButtonText}>Call</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.contactButton}>
              <Icon name="message" size={20} color="#4CAF50" />
              <Text style={styles.contactButtonText}>Message</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.contactButton}>
              <Icon name="directions" size={20} color="#4CAF50" />
              <Text style={styles.contactButtonText}>Navigate</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  if (!activeOrder) {
    return (
      <View style={styles.centered}>
        <Icon name="local-shipping" size={64} color="#ddd" />
        <Text style={styles.noOrderTitle}>No Active Delivery</Text>
        <Text style={styles.noOrderText}>
          You don't have any active deliveries at the moment.
        </Text>
        <TouchableOpacity
          style={styles.findOrdersButton}
          onPress={() => navigation.navigate("Orders")}
        >
          <Text style={styles.findOrdersText}>Find Available Orders</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Setting up delivery tracking...</Text>
      </View>
    );
  }

  const statusInfo = getStatusInfo();

  return (
    <View style={styles.container}>
      {/* Map Section */}
      {renderMap()}

      {/* Order Info Section */}
      <ScrollView
        style={styles.infoContainer}
        showsVerticalScrollIndicator={false}
      >
        {renderOrderInfo()}
      </ScrollView>

      {/* Action Button */}
      <View style={styles.actionContainer}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: statusInfo.color }]}
          onPress={showStatusUpdateDialog}
          disabled={updatingStatus}
        >
          {updatingStatus ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Icon name="check" size={20} color="#fff" />
              <Text style={styles.actionButtonText}>
                {statusInfo.nextAction}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f8f8",
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
  },
  noOrderTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#666",
    marginTop: 16,
    marginBottom: 8,
  },
  noOrderText: {
    fontSize: 16,
    color: "#999",
    textAlign: "center",
    marginBottom: 30,
  },
  findOrdersButton: {
    backgroundColor: "#4CAF50",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  findOrdersText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  mapContainer: {
    height: height * 0.4,
    position: "relative",
  },
  map: {
    width: "100%",
    height: "100%",
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
    padding: 6,
    borderRadius: 15,
  },
  etaOverlay: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    elevation: 3,
  },
  etaTitle: {
    fontSize: 12,
    color: "#666",
    marginBottom: 4,
  },
  etaTime: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#4CAF50",
  },
  infoContainer: {
    flex: 1,
  },
  orderInfoContainer: {
    backgroundColor: "#fff",
    margin: 15,
    borderRadius: 12,
    padding: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  statusHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  statusIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  statusText: {
    flex: 1,
  },
  statusTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  statusSubtitle: {
    fontSize: 14,
    color: "#666",
  },
  divider: {
    height: 1,
    backgroundColor: "#f0f0f0",
    marginBottom: 20,
  },
  detailsSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 15,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    color: "#333",
    fontWeight: "600",
    flex: 1,
    textAlign: "right",
  },
  deliveryFee: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#4CAF50",
  },
  contactSection: {
    marginBottom: 10,
  },
  contactButtons: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  contactButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f8f8",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 5,
    justifyContent: "center",
  },
  contactButtonText: {
    marginLeft: 6,
    fontSize: 14,
    color: "#4CAF50",
    fontWeight: "500",
  },
  actionContainer: {
    padding: 15,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 8,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  actionButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 8,
  },
});

export default ActiveOrderScreen;
