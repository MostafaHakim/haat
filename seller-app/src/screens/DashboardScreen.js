import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useSelector, useDispatch } from "react-redux";
import { orderAPI, restaurantAPI } from "../services/api";
import {
  fetchOrdersSuccess,
  fetchTodayOrdersSuccess,
} from "../store/slices/ordersSlice";
import Icon from "react-native-vector-icons/MaterialIcons";

const DashboardScreen = ({ navigation }) => {
  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const dispatch = useDispatch();
  const { stats, todayOrders } = useSelector((state) => state.orders);
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      await Promise.all([fetchRestaurant(), fetchTodayOrders()]);
    } catch (error) {
      console.error("Dashboard load error:", error);
      Alert.alert("Error", "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const fetchRestaurant = async () => {
    try {
      const response = await restaurantAPI.getMyRestaurant();
      setRestaurant(response.data);
    } catch (error) {
      console.error("Fetch restaurant error:", error);
    }
  };

  const fetchTodayOrders = async () => {
    try {
      const response = await orderAPI.getRestaurantOrders({
        page: 1,
        limit: 50,
        status: "all",
      });

      const today = new Date().toDateString();
      const todayOrders = response.data.orders.filter(
        (order) => new Date(order.createdAt).toDateString() === today
      );

      dispatch(fetchTodayOrdersSuccess(todayOrders));

      // Calculate stats
      const stats = {
        total: todayOrders.length,
        pending: todayOrders.filter((order) => order.status === "pending")
          .length,
        preparing: todayOrders.filter((order) => order.status === "preparing")
          .length,
        ready: todayOrders.filter((order) => order.status === "ready").length,
        completed: todayOrders.filter((order) =>
          ["delivered", "picked_up", "on_the_way"].includes(order.status)
        ).length,
      };

      dispatch(fetchOrdersSuccess({ orders: response.data.orders, stats }));
    } catch (error) {
      console.error("Fetch orders error:", error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: "#FFA500",
      preparing: "#FF9800",
      ready: "#4CAF50",
      delivered: "#4CAF50",
      default: "#666",
    };
    return colors[status] || colors.default;
  };

  const StatCard = ({ title, value, color, icon }) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <View style={styles.statHeader}>
        <Text style={styles.statValue}>{value}</Text>
        <Icon name={icon} size={24} color={color} />
      </View>
      <Text style={styles.statTitle}>{title}</Text>
    </View>
  );

  const RecentOrderItem = ({ order }) => (
    <TouchableOpacity
      style={styles.orderItem}
      onPress={() => navigation.navigate("OrderDetail", { orderId: order._id })}
    >
      <View style={styles.orderHeader}>
        <Text style={styles.orderId}>#{order.orderId}</Text>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(order.status) },
          ]}
        >
          <Text style={styles.statusText}>{order.status}</Text>
        </View>
      </View>
      <Text style={styles.customerName}>{order.customerId.name}</Text>
      <Text style={styles.orderTotal}>৳{order.totalAmount.toFixed(2)}</Text>
      <Text style={styles.orderTime}>
        {new Date(order.createdAt).toLocaleTimeString()}
      </Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#FF6B6B" />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
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
        <Text style={styles.welcomeText}>Welcome back, {user?.name}!</Text>
        <Text style={styles.restaurantName}>{restaurant?.name}</Text>
        <Text style={styles.restaurantStatus}>
          {restaurant?.isActive ? "🟢 Online" : "🔴 Offline"}
        </Text>
      </View>

      {/* Stats Section */}
      <View style={styles.statsSection}>
        <Text style={styles.sectionTitle}>Today's Overview</Text>
        <View style={styles.statsGrid}>
          <StatCard
            title="Total Orders"
            value={stats.total}
            color="#FF6B6B"
            icon="receipt"
          />
          <StatCard
            title="Pending"
            value={stats.pending}
            color="#FFA500"
            icon="schedule"
          />
          <StatCard
            title="Preparing"
            value={stats.preparing}
            color="#FF9800"
            icon="restaurant"
          />
          <StatCard
            title="Ready"
            value={stats.ready}
            color="#4CAF50"
            icon="check-circle"
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
            <Icon name="list-alt" size={24} color="#FF6B6B" />
            <Text style={styles.actionText}>View All Orders</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate("Menu")}
          >
            <Icon name="restaurant-menu" size={24} color="#FF6B6B" />
            <Text style={styles.actionText}>Manage Menu</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate("AddProduct")}
          >
            <Icon name="add-circle" size={24} color="#FF6B6B" />
            <Text style={styles.actionText}>Add Product</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate("Profile")}
          >
            <Icon name="settings" size={24} color="#FF6B6B" />
            <Text style={styles.actionText}>Settings</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Recent Orders */}
      <View style={styles.ordersSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Orders</Text>
          <TouchableOpacity onPress={() => navigation.navigate("Orders")}>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>

        {todayOrders.length === 0 ? (
          <View style={styles.emptyOrders}>
            <Icon name="receipt" size={48} color="#ddd" />
            <Text style={styles.emptyText}>No orders today</Text>
            <Text style={styles.emptySubtext}>New orders will appear here</Text>
          </View>
        ) : (
          todayOrders
            .slice(0, 5)
            .map((order) => <RecentOrderItem key={order._id} order={order} />)
        )}
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
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
  },
  restaurantName: {
    fontSize: 18,
    color: "#FF6B6B",
    fontWeight: "600",
    marginBottom: 5,
  },
  restaurantStatus: {
    fontSize: 14,
    color: "#666",
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
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  statCard: {
    backgroundColor: "#f8f8f8",
    padding: 15,
    borderRadius: 8,
    width: "48%",
    marginBottom: 10,
    borderLeftWidth: 4,
  },
  statHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 5,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
  },
  statTitle: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
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
  ordersSection: {
    backgroundColor: "#fff",
    padding: 20,
    marginBottom: 10,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  seeAllText: {
    color: "#FF6B6B",
    fontWeight: "600",
  },
  orderItem: {
    backgroundColor: "#f8f8f8",
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  orderId: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "bold",
    textTransform: "capitalize",
  },
  customerName: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 4,
  },
  orderTotal: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FF6B6B",
    marginBottom: 4,
  },
  orderTime: {
    fontSize: 12,
    color: "#666",
  },
  emptyOrders: {
    alignItems: "center",
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
    marginTop: 10,
    marginBottom: 5,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
  },
});

export default DashboardScreen;
