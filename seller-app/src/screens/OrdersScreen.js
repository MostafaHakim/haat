import React, { useEffect, useState } from "react";
import {
  View,
  ScrollView,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
  TextInput,
} from "react-native";
import { useSelector, useDispatch } from "react-redux";
import { orderAPI } from "../services/api";
import {
  fetchOrdersStart,
  fetchOrdersSuccess,
  fetchOrdersFailure,
  updateOrderStatus,
} from "../store/slices/ordersSlice";
import Icon from "react-native-vector-icons/MaterialIcons";

const OrdersScreen = ({ navigation }) => {
  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const dispatch = useDispatch();
  const { orders, stats } = useSelector((state) => state.orders);

  useEffect(() => {
    loadOrders();
  }, [filter]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      dispatch(fetchOrdersStart());

      const response = await orderAPI.getRestaurantOrders({
        status: filter === "all" ? undefined : filter,
        page: 1,
        limit: 100,
      });

      dispatch(
        fetchOrdersSuccess({
          orders: response.data.orders,
          stats: response.data.stats,
        })
      );
    } catch (error) {
      console.error("Load orders error:", error);
      dispatch(fetchOrdersFailure("Failed to load orders"));
      Alert.alert("Error", "Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadOrders();
    setRefreshing(false);
  };

  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      await orderAPI.updateStatus(orderId, { status: newStatus });
      dispatch(updateOrderStatus({ orderId, status: newStatus }));
      Alert.alert("Success", `Order status updated to ${newStatus}`);
    } catch (error) {
      console.error("Update status error:", error);
      Alert.alert("Error", "Failed to update order status");
    }
  };

  const showStatusUpdateDialog = (order) => {
    const statusOptions = {
      pending: ["confirmed", "rejected"],
      confirmed: ["preparing", "rejected"],
      preparing: ["ready", "rejected"],
      ready: ["rejected"], // Rider will pick up from here
    };

    const availableStatuses = statusOptions[order.status] || [];

    if (availableStatuses.length === 0) {
      Alert.alert("Info", "No further actions available for this order");
      return;
    }

    Alert.alert(
      "Update Order Status",
      `Current status: ${order.status}`,
      availableStatuses
        .map((status) => ({
          text: status.charAt(0).toUpperCase() + status.slice(1),
          onPress: () => handleStatusUpdate(order._id, status),
        }))
        .concat([{ text: "Cancel", style: "cancel" }])
    );
  };

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.orderId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerId.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filter === "all" || order.status === filter;
    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status) => {
    const colors = {
      pending: "#FFA500",
      confirmed: "#2196F3",
      preparing: "#FF9800",
      ready: "#4CAF50",
      assigned: "#9C27B0",
      picked_up: "#673AB7",
      on_the_way: "#3F51B5",
      delivered: "#4CAF50",
      rejected: "#F44336",
      cancelled: "#F44336",
    };
    return colors[status] || "#666";
  };

  const renderOrderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.orderCard}
      onPress={() => navigation.navigate("OrderDetail", { orderId: item._id })}
    >
      <View style={styles.orderHeader}>
        <View>
          <Text style={styles.orderId}>#{item.orderId}</Text>
          <Text style={styles.customerName}>{item.customerId.name}</Text>
        </View>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(item.status) },
          ]}
        >
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>

      <View style={styles.orderDetails}>
        <Text style={styles.orderItems}>
          {item.items.length} item{item.items.length !== 1 ? "s" : ""}
        </Text>
        <Text style={styles.orderTotal}>৳{item.totalAmount.toFixed(2)}</Text>
      </View>

      <Text style={styles.orderTime}>
        {new Date(item.createdAt).toLocaleString()}
      </Text>

      <View style={styles.orderActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() =>
            navigation.navigate("OrderDetail", { orderId: item._id })
          }
        >
          <Icon name="visibility" size={18} color="#666" />
          <Text style={styles.actionText}>View</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => showStatusUpdateDialog(item)}
        >
          <Icon name="update" size={18} color="#666" />
          <Text style={styles.actionText}>Update</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => {
            /* Handle call */
          }}
        >
          <Icon name="call" size={18} color="#666" />
          <Text style={styles.actionText}>Call</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const FilterButton = ({ status, label }) => (
    <TouchableOpacity
      style={[
        styles.filterButton,
        filter === status && styles.filterButtonActive,
      ]}
      onPress={() => setFilter(status)}
    >
      <Text
        style={[
          styles.filterText,
          filter === status && styles.filterTextActive,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#FF6B6B" />
        <Text style={styles.loadingText}>Loading orders...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by order ID or customer name..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <Icon name="search" size={20} color="#666" style={styles.searchIcon} />
      </View>

      {/* Filter Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterContainer}
      >
        <FilterButton status="all" label="All Orders" />
        <FilterButton status="pending" label="Pending" />
        <FilterButton status="confirmed" label="Confirmed" />
        <FilterButton status="preparing" label="Preparing" />
        <FilterButton status="ready" label="Ready" />
        <FilterButton status="delivered" label="Delivered" />
      </ScrollView>

      {/* Orders List */}
      <FlatList
        data={filteredOrders}
        renderItem={renderOrderItem}
        keyExtractor={(item) => item._id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.ordersList}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="receipt" size={64} color="#ddd" />
            <Text style={styles.emptyText}>No orders found</Text>
            <Text style={styles.emptySubtext}>
              {filter === "all"
                ? "You have no orders yet"
                : `No ${filter} orders`}
            </Text>
          </View>
        }
      />
    </View>
  );
};

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
  searchContainer: {
    position: "relative",
    marginBottom: 15,
  },
  searchInput: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 15,
    paddingLeft: 45,
    fontSize: 16,
  },
  searchIcon: {
    position: "absolute",
    left: 15,
    top: 15,
  },
  filterContainer: {
    marginBottom: 15,
  },
  filterButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: "#fff",
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  filterButtonActive: {
    backgroundColor: "#FF6B6B",
    borderColor: "#FF6B6B",
  },
  filterText: {
    color: "#666",
    fontWeight: "500",
  },
  filterTextActive: {
    color: "#fff",
    fontWeight: "600",
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
    marginBottom: 10,
  },
  orderId: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  customerName: {
    fontSize: 14,
    color: "#666",
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  statusText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "bold",
    textTransform: "capitalize",
  },
  orderDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  orderItems: {
    fontSize: 14,
    color: "#666",
  },
  orderTotal: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FF6B6B",
  },
  orderTime: {
    fontSize: 12,
    color: "#999",
    marginBottom: 12,
  },
  orderActions: {
    flexDirection: "row",
    justifyContent: "space-around",
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    paddingTop: 12,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
  },
  actionText: {
    marginLeft: 5,
    fontSize: 12,
    color: "#666",
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
  },
});

export default OrdersScreen;
