import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Switch,
  RefreshControl,
} from "react-native";
import { useSelector, useDispatch } from "react-redux";
import { userAPI, orderAPI } from "../services/api";
import { setAvailability, updateUser } from "../store/slices/authSlice";
import { updateStats } from "../store/slices/ordersSlice";
import * as Location from "expo-location";
import Icon from "react-native-vector-icons/MaterialIcons";

const DashboardScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingLocation, setUpdatingLocation] = useState(false);
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { stats, activeOrder } = useSelector((state) => state.orders);

  useEffect(() => {
    initializeRider();
  }, []);

  const initializeRider = async () => {
    try {
      setLoading(true);
      await Promise.all([requestLocationPermission(), loadRiderStats()]);
    } catch (error) {
      console.error("Initialize rider error:", error);
      Alert.alert("Error", "Failed to initialize rider dashboard");
    } finally {
      setLoading(false);
    }
  };

  const requestLocationPermission = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission denied",
          "Need location permission to receive delivery requests"
        );
        return;
      }

      // Start location tracking
      await startLocationTracking();
    } catch (error) {
      console.error("Location permission error:", error);
    }
  };

  const startLocationTracking = async () => {
    try {
      let locationData;

      // Development mode-এ সবসময় mock location ব্যবহার করুন
      if (__DEV__) {
        console.log("DEV MODE: Using mock location");
        locationData = {
          latitude: 23.8103, // Dhaka
          longitude: 90.4125,
          address: "Mock Location - Dhaka",
        };
      } else {
        // Production-এ real location
        let location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
          timeout: 10000,
        });

        locationData = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          address: "Current Location",
        };
      }

      // Backend-এ আপডেট করুন
      await userAPI.updateLocation({
        ...locationData,
        isAvailable: user?.isAvailable || false,
      });

      console.log("Location tracking successful");
    } catch (error) {
      console.error("Location tracking failed:", error);

      // Final fallback - সবক্ষেত্রে mock location
      console.log("Using final fallback mock location");
      await userAPI.updateLocation({
        latitude: 23.8103,
        longitude: 90.4125,
        address: "Fallback Location",
        isAvailable: user?.isAvailable || false,
      });
    }
  };
  const loadRiderStats = async () => {
    try {
      // This would typically come from a dedicated stats API
      const today = new Date().toDateString();
      const response = await orderAPI.getMyOrders({
        page: 1,
        limit: 100,
        status: "all",
      });

      const todayOrders = response.data.orders.filter(
        (order) =>
          new Date(order.createdAt).toDateString() === today &&
          ["delivered", "picked_up", "assigned"].includes(order.status)
        // "on_the_way" এর জায়গায় "assigned" ব্যবহার করুন
      );

      const todayEarnings = todayOrders.reduce(
        (total, order) => total + (order.deliveryFee || 0),
        0
      );
      const totalEarnings = response.data.orders.reduce(
        (total, order) => total + (order.deliveryFee || 0),
        0
      );

      dispatch(
        updateStats({
          todayEarnings,
          todayDeliveries: todayOrders.length,
          totalEarnings,
          totalDeliveries: response.data.orders.length,
        })
      );
    } catch (error) {
      console.error("Load stats error:", error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadRiderStats(), startLocationTracking()]);
    setRefreshing(false);
  };

  const handleAvailabilityToggle = async (value) => {
    try {
      dispatch(setAvailability(value));

      // প্রথমে কারেন্ট লোকেশন নিন
      let currentLocation = null;
      try {
        const location = await Location.getCurrentPositionAsync({});
        currentLocation = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          address: "Current Location",
        };
      } catch (locationError) {
        console.error("Location fetch error:", locationError);
        // যদি লোকেশন না মেলে, শুধু availability আপডেট করুন
      }

      // বেকেন্ডে সঠিক ফরম্যাটে ডাটা পাঠান
      await userAPI.updateLocation({
        ...currentLocation, // সরাসরি latitude, longitude, address
        isAvailable: value, // ✅ নতুন value ব্যবহার করুন
      });

      if (value) {
        Alert.alert(
          "You are now available",
          "You will receive delivery requests"
        );
      } else {
        Alert.alert(
          "You are now offline",
          "You will not receive new delivery requests"
        );
      }
    } catch (error) {
      console.error("Toggle availability error:", error);
      Alert.alert("Error", "Failed to update availability");
    }
  };
  const updateCurrentLocation = async () => {
    try {
      setUpdatingLocation(true);
      await startLocationTracking();
      Alert.alert("Success", "Location updated successfully");
    } catch (error) {
      console.error("Update location error:", error);
      Alert.alert("Error", "Failed to update location");
    } finally {
      setUpdatingLocation(false);
    }
  };

  const StatCard = ({ title, value, subtitle, color, icon }) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <View style={styles.statHeader}>
        <Text style={styles.statValue}>{value}</Text>
        <Icon name={icon} size={24} color={color} />
      </View>
      <Text style={styles.statTitle}>{title}</Text>
      {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Setting up your dashboard...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Welcome Section */}
      <View style={styles.welcomeSection}>
        <View>
          <Text style={styles.welcomeText}>Welcome back, {user?.name}!</Text>
          <Text style={styles.riderId}>Rider ID: {user?._id?.slice(-8)}</Text>
        </View>
        <View style={styles.vehicleBadge}>
          <Icon name="two-wheeler" size={24} color="#fff" />
          <Text style={styles.vehicleText}>{user?.vehicleType}</Text>
        </View>
      </View>

      {/* Availability Toggle */}
      <View style={styles.availabilitySection}>
        <View style={styles.availabilityHeader}>
          <Text style={styles.availabilityText}>
            {user?.isAvailable ? "🟢 Online - Accepting Orders" : "🔴 Offline"}
          </Text>
          <Switch
            value={user?.isAvailable || false}
            onValueChange={handleAvailabilityToggle}
            trackColor={{ false: "#767577", true: "#81b0ff" }}
            thumbColor={user?.isAvailable ? "#4CAF50" : "#f4f3f4"}
          />
        </View>
        <Text style={styles.availabilitySubtext}>
          {user?.isAvailable
            ? "You will receive delivery requests from nearby restaurants"
            : "Go online to start receiving delivery requests"}
        </Text>
      </View>

      {/* Active Order Alert */}
      {activeOrder && (
        <TouchableOpacity
          style={styles.activeOrderAlert}
          onPress={() => navigation.navigate("Active")}
        >
          <View style={styles.activeOrderHeader}>
            <Icon name="local-shipping" size={24} color="#fff" />
            <Text style={styles.activeOrderTitle}>Active Delivery</Text>
            <Icon name="arrow-forward" size={20} color="#fff" />
          </View>
          <Text style={styles.activeOrderText}>
            Order #{activeOrder.orderId} - {activeOrder.status}
          </Text>
        </TouchableOpacity>
      )}

      {/* Stats Section */}
      <View style={styles.statsSection}>
        <Text style={styles.sectionTitle}>Today's Performance</Text>
        <View style={styles.statsGrid}>
          <StatCard
            title="Today's Earnings"
            value={`৳${stats.todayEarnings}`}
            color="#4CAF50"
            icon="attach-money"
          />
          <StatCard
            title="Today's Deliveries"
            value={stats.todayDeliveries}
            color="#2196F3"
            icon="local-shipping"
          />
        </View>

        <View style={styles.statsGrid}>
          <StatCard
            title="Total Earnings"
            value={`৳${stats.totalEarnings}`}
            subtitle="All time"
            color="#FF9800"
            icon="account-balance-wallet"
          />
          <StatCard
            title="Total Deliveries"
            value={stats.totalDeliveries}
            subtitle="All time"
            color="#9C27B0"
            icon="list-alt"
          />
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.actionsSection}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate("Orders")}
          >
            <Icon name="list-alt" size={24} color="#4CAF50" />
            <Text style={styles.actionText}>Available Orders</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={updateCurrentLocation}
            disabled={updatingLocation}
          >
            {updatingLocation ? (
              <ActivityIndicator size="small" color="#4CAF50" />
            ) : (
              <Icon name="my-location" size={24} color="#4CAF50" />
            )}
            <Text style={styles.actionText}>Update Location</Text>
          </TouchableOpacity>

          {activeOrder && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate("Active")}
            >
              <Icon name="directions-bike" size={24} color="#4CAF50" />
              <Text style={styles.actionText}>Active Delivery</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate("Earnings")}
          >
            <Icon name="bar-chart" size={24} color="#4CAF50" />
            <Text style={styles.actionText}>View Earnings</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Tips Section */}
      <View style={styles.tipsSection}>
        <Text style={styles.sectionTitle}>Delivery Tips</Text>
        <View style={styles.tipItem}>
          <Icon name="check-circle" size={16} color="#4CAF50" />
          <Text style={styles.tipText}>
            Always confirm order details with restaurant
          </Text>
        </View>
        <View style={styles.tipItem}>
          <Icon name="check-circle" size={16} color="#4CAF50" />
          <Text style={styles.tipText}>
            Keep customer updated on delivery status
          </Text>
        </View>
        <View style={styles.tipItem}>
          <Icon name="check-circle" size={16} color="#4CAF50" />
          <Text style={styles.tipText}>Handle food packages with care</Text>
        </View>
        <View style={styles.tipItem}>
          <Icon name="check-circle" size={16} color="#4CAF50" />
          <Text style={styles.tipText}>Follow traffic rules and stay safe</Text>
        </View>
      </View>
    </ScrollView>
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
  },
  loadingText: {
    marginTop: 10,
    color: "#666",
  },
  welcomeSection: {
    backgroundColor: "#fff",
    padding: 20,
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  riderId: {
    fontSize: 14,
    color: "#666",
  },
  vehicleBadge: {
    backgroundColor: "#4CAF50",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  vehicleText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 4,
    textTransform: "capitalize",
  },
  availabilitySection: {
    backgroundColor: "#fff",
    padding: 20,
    marginBottom: 10,
  },
  availabilityHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  availabilityText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  availabilitySubtext: {
    fontSize: 14,
    color: "#666",
  },
  activeOrderAlert: {
    backgroundColor: "#FF9800",
    padding: 15,
    margin: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  activeOrderHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  activeOrderTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 8,
    flex: 1,
  },
  activeOrderText: {
    color: "#fff",
    fontSize: 14,
  },
  statsSection: {
    backgroundColor: "#fff",
    padding: 20,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 15,
  },
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  statCard: {
    backgroundColor: "#f8f8f8",
    padding: 15,
    borderRadius: 8,
    width: "48%",
    borderLeftWidth: 4,
  },
  statHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 5,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  statTitle: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  statSubtitle: {
    fontSize: 12,
    color: "#999",
    marginTop: 2,
  },
  actionsSection: {
    backgroundColor: "#fff",
    padding: 20,
    marginBottom: 10,
  },
  actionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  actionButton: {
    backgroundColor: "#f8f8f8",
    padding: 15,
    borderRadius: 8,
    width: "48%",
    marginBottom: 10,
    alignItems: "center",
  },
  actionText: {
    marginTop: 8,
    fontSize: 12,
    color: "#333",
    fontWeight: "500",
    textAlign: "center",
  },
  tipsSection: {
    backgroundColor: "#fff",
    padding: 20,
    marginBottom: 10,
  },
  tipItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  tipText: {
    fontSize: 14,
    color: "#666",
    marginLeft: 8,
    flex: 1,
    lineHeight: 20,
  },
});

export default DashboardScreen;
