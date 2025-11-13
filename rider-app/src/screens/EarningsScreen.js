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
import { orderAPI } from "../services/api";
import Icon from "react-native-vector-icons/MaterialIcons";

const EarningsScreen = ({ navigation }) => {
  const [earnings, setEarnings] = useState({
    today: 0,
    weekly: 0,
    monthly: 0,
    total: 0,
  });
  const [orderHistory, setOrderHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [timeFilter, setTimeFilter] = useState("today"); // today, weekly, monthly

  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    loadEarningsData();
  }, [timeFilter]);

  const loadEarningsData = async () => {
    try {
      setLoading(true);

      // Load order history
      const response = await orderAPI.getMyOrders({
        page: 1,
        limit: 50,
        status: "all",
      });

      const orders = response.data.orders;
      setOrderHistory(orders);

      // Calculate earnings
      const today = new Date();
      const todayStart = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate()
      );

      const todayOrders = orders.filter(
        (order) =>
          new Date(order.createdAt) >= todayStart &&
          ["delivered", "picked_up", "on_the_way"].includes(order.status)
      );

      const weeklyOrders = orders.filter((order) => {
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        return (
          new Date(order.createdAt) >= weekAgo &&
          ["delivered", "picked_up", "on_the_way"].includes(order.status)
        );
      });

      const monthlyOrders = orders.filter((order) => {
        const monthAgo = new Date(
          today.getFullYear(),
          today.getMonth() - 1,
          today.getDate()
        );
        return (
          new Date(order.createdAt) >= monthAgo &&
          ["delivered", "picked_up", "on_the_way"].includes(order.status)
        );
      });

      const calculatedEarnings = {
        today: todayOrders.reduce(
          (sum, order) => sum + (order.deliveryFee || 0),
          0
        ),
        weekly: weeklyOrders.reduce(
          (sum, order) => sum + (order.deliveryFee || 0),
          0
        ),
        monthly: monthlyOrders.reduce(
          (sum, order) => sum + (order.deliveryFee || 0),
          0
        ),
        total: orders.reduce((sum, order) => sum + (order.deliveryFee || 0), 0),
      };

      setEarnings(calculatedEarnings);
    } catch (error) {
      console.error("Load earnings error:", error);
      Alert.alert("Error", "Failed to load earnings data");
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadEarningsData();
    setRefreshing(false);
  };

  const getFilteredOrders = () => {
    const today = new Date();

    switch (timeFilter) {
      case "today":
        const todayStart = new Date(
          today.getFullYear(),
          today.getMonth(),
          today.getDate()
        );
        return orderHistory.filter(
          (order) =>
            new Date(order.createdAt) >= todayStart &&
            ["delivered", "picked_up", "on_the_way"].includes(order.status)
        );

      case "weekly":
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        return orderHistory.filter(
          (order) =>
            new Date(order.createdAt) >= weekAgo &&
            ["delivered", "picked_up", "on_the_way"].includes(order.status)
        );

      case "monthly":
        const monthAgo = new Date(
          today.getFullYear(),
          today.getMonth() - 1,
          today.getDate()
        );
        return orderHistory.filter(
          (order) =>
            new Date(order.createdAt) >= monthAgo &&
            ["delivered", "picked_up", "on_the_way"].includes(order.status)
        );

      default:
        return orderHistory.filter((order) =>
          ["delivered", "picked_up", "on_the_way"].includes(order.status)
        );
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return (
      date.toLocaleDateString() +
      " " +
      date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    );
  };

  const getStatusColor = (status) => {
    const colors = {
      delivered: "#4CAF50",
      picked_up: "#2196F3",
      on_the_way: "#FF9800",
    };
    return colors[status] || "#666";
  };

  const TimeFilterButton = ({ period, label }) => (
    <TouchableOpacity
      style={[
        styles.filterButton,
        timeFilter === period && styles.filterButtonActive,
      ]}
      onPress={() => setTimeFilter(period)}
    >
      <Text
        style={[
          styles.filterText,
          timeFilter === period && styles.filterTextActive,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  const EarningsCard = ({ title, amount, subtitle, trend }) => (
    <View style={styles.earningsCard}>
      <Text style={styles.earningsTitle}>{title}</Text>
      <Text style={styles.earningsAmount}>৳{amount}</Text>
      {subtitle && <Text style={styles.earningsSubtitle}>{subtitle}</Text>}
      {trend && (
        <View style={styles.trendContainer}>
          <Icon
            name={trend > 0 ? "trending-up" : "trending-down"}
            size={16}
            color={trend > 0 ? "#4CAF50" : "#F44336"}
          />
          <Text
            style={[
              styles.trendText,
              { color: trend > 0 ? "#4CAF50" : "#F44336" },
            ]}
          >
            {Math.abs(trend)}%
          </Text>
        </View>
      )}
    </View>
  );

  const OrderHistoryItem = ({ order }) => (
    <View style={styles.orderItem}>
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

      <Text style={styles.restaurantName}>{order.restaurantId.name}</Text>

      <View style={styles.orderDetails}>
        <Text style={styles.orderTime}>{formatTime(order.createdAt)}</Text>
        <Text style={styles.orderEarning}>+৳{order.deliveryFee || 0}</Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Loading earnings data...</Text>
      </View>
    );
  }

  const filteredOrders = getFilteredOrders();
  const currentEarnings = earnings[timeFilter] || 0;
  const deliveryCount = filteredOrders.length;

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>My Earnings</Text>
        <Text style={styles.subtitle}>
          Track your delivery earnings and performance
        </Text>
      </View>

      {/* Quick Stats */}
      <View style={styles.statsSection}>
        <EarningsCard
          title="Today's Earnings"
          amount={earnings.today}
          subtitle={`${
            orderHistory.filter((order) => {
              const today = new Date();
              const todayStart = new Date(
                today.getFullYear(),
                today.getMonth(),
                today.getDate()
              );
              return (
                new Date(order.createdAt) >= todayStart &&
                ["delivered", "picked_up", "on_the_way"].includes(order.status)
              );
            }).length
          } deliveries`}
        />

        <View style={styles.statsRow}>
          <EarningsCard
            title="This Week"
            amount={earnings.weekly}
            subtitle="7 days"
            style={styles.halfCard}
          />
          <EarningsCard
            title="This Month"
            amount={earnings.monthly}
            subtitle="30 days"
            style={styles.halfCard}
          />
        </View>
      </View>

      {/* Time Filter */}
      <View style={styles.filterSection}>
        <Text style={styles.sectionTitle}>Earnings Overview</Text>
        <View style={styles.filterContainer}>
          <TimeFilterButton period="today" label="Today" />
          <TimeFilterButton period="weekly" label="This Week" />
          <TimeFilterButton period="monthly" label="This Month" />
        </View>
      </View>

      {/* Current Period Summary */}
      <View style={styles.summarySection}>
        <View style={styles.summaryCard}>
          <View style={styles.summaryItem}>
            <Icon name="attach-money" size={24} color="#4CAF50" />
            <View style={styles.summaryText}>
              <Text style={styles.summaryLabel}>Total Earnings</Text>
              <Text style={styles.summaryValue}>৳{currentEarnings}</Text>
            </View>
          </View>

          <View style={styles.summaryItem}>
            <Icon name="local-shipping" size={24} color="#2196F3" />
            <View style={styles.summaryText}>
              <Text style={styles.summaryLabel}>Deliveries Completed</Text>
              <Text style={styles.summaryValue}>{deliveryCount}</Text>
            </View>
          </View>

          <View style={styles.summaryItem}>
            <Icon name="speed" size={24} color="#FF9800" />
            <View style={styles.summaryText}>
              <Text style={styles.summaryLabel}>Average per Delivery</Text>
              <Text style={styles.summaryValue}>
                ৳
                {deliveryCount > 0
                  ? (currentEarnings / deliveryCount).toFixed(2)
                  : "0.00"}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Order History */}
      <View style={styles.historySection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Delivery History</Text>
          <Text style={styles.deliveryCount}>{deliveryCount} deliveries</Text>
        </View>

        {filteredOrders.length === 0 ? (
          <View style={styles.emptyHistory}>
            <Icon name="receipt" size={48} color="#ddd" />
            <Text style={styles.emptyText}>No deliveries found</Text>
            <Text style={styles.emptySubtext}>
              {timeFilter === "today"
                ? "You haven't completed any deliveries today"
                : `You haven't completed any deliveries this ${timeFilter}`}
            </Text>
          </View>
        ) : (
          filteredOrders.map((order) => (
            <OrderHistoryItem key={order._id} order={order} />
          ))
        )}
      </View>

      {/* Total Earnings */}
      <View style={styles.totalSection}>
        <View style={styles.totalCard}>
          <Text style={styles.totalLabel}>All Time Earnings</Text>
          <Text style={styles.totalAmount}>৳{earnings.total}</Text>
          <Text style={styles.totalSubtext}>
            {
              orderHistory.filter((order) =>
                ["delivered", "picked_up", "on_the_way"].includes(order.status)
              ).length
            }{" "}
            total deliveries
          </Text>
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
  header: {
    backgroundColor: "#fff",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
  },
  statsSection: {
    padding: 15,
  },
  earningsCard: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 12,
    marginBottom: 10,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  earningsTitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  earningsAmount: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  earningsSubtitle: {
    fontSize: 12,
    color: "#999",
  },
  trendContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  trendText: {
    fontSize: 12,
    fontWeight: "500",
    marginLeft: 4,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  halfCard: {
    width: "48%",
  },
  filterSection: {
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
  filterContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  filterButton: {
    flex: 1,
    paddingVertical: 12,
    marginHorizontal: 4,
    backgroundColor: "#f8f8f8",
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#eee",
  },
  filterButtonActive: {
    backgroundColor: "#4CAF50",
    borderColor: "#4CAF50",
  },
  filterText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#666",
  },
  filterTextActive: {
    color: "#fff",
    fontWeight: "600",
  },
  summarySection: {
    padding: 15,
  },
  summaryCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  summaryItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  summaryText: {
    flex: 1,
    marginLeft: 15,
  },
  summaryLabel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  historySection: {
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
  deliveryCount: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
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
  restaurantName: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
    marginBottom: 8,
  },
  orderDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  orderTime: {
    fontSize: 12,
    color: "#666",
  },
  orderEarning: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#4CAF50",
  },
  emptyHistory: {
    alignItems: "center",
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
  },
  totalSection: {
    padding: 15,
    marginBottom: 20,
  },
  totalCard: {
    backgroundColor: "#4CAF50",
    padding: 25,
    borderRadius: 12,
    alignItems: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  totalLabel: {
    fontSize: 16,
    color: "#fff",
    marginBottom: 8,
  },
  totalAmount: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 4,
  },
  totalSubtext: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.8)",
  },
});

export default EarningsScreen;
