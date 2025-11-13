import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
  Switch,
} from "react-native";
import { useSelector, useDispatch } from "react-redux";
import { userAPI, orderAPI } from "../services/api";
import { logout, updateUser } from "../store/slices/authSlice";
import Icon from "react-native-vector-icons/MaterialIcons";

const ProfileScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(false);
  const [orderStats, setOrderStats] = useState({
    total: 0,
    delivered: 0,
    pending: 0,
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [locationEnabled, setLocationEnabled] = useState(true);

  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    try {
      setLoading(true);

      // Load order statistics
      const ordersResponse = await orderAPI.getMyOrders({
        page: 1,
        limit: 50,
        status: "all",
      });

      const orders = ordersResponse.data.orders;
      setRecentOrders(orders.slice(0, 5));

      // Calculate order stats
      const stats = {
        total: orders.length,
        delivered: orders.filter((order) => order.status === "delivered")
          .length,
        pending: orders.filter((order) =>
          [
            "pending",
            "confirmed",
            "preparing",
            "ready",
            "assigned",
            "picked_up",
            "on_the_way",
          ].includes(order.status)
        ).length,
      };

      setOrderStats(stats);
    } catch (error) {
      console.error("Load profile data error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: () => {
          dispatch(logout());
          navigation.reset({
            index: 0,
            routes: [{ name: "Auth" }],
          });
        },
      },
    ]);
  };

  const handleEditProfile = () => {
    Alert.alert(
      "Coming Soon",
      "Profile editing feature will be available soon!"
    );
  };

  const handleContactSupport = () => {
    Alert.alert(
      "Contact Support",
      "Call: 123-456-7890\nEmail: support@fooddelivery.com"
    );
  };

  const OrderStatCard = ({ title, value, color }) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statTitle}>{title}</Text>
    </View>
  );

  const MenuItem = ({ icon, title, subtitle, onPress, danger = false }) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <View style={[styles.menuIcon, danger && styles.menuIconDanger]}>
        <Icon name={icon} size={20} color={danger ? "#F44336" : "#666"} />
      </View>
      <View style={styles.menuText}>
        <Text style={[styles.menuTitle, danger && styles.menuTitleDanger]}>
          {title}
        </Text>
        {subtitle && <Text style={styles.menuSubtitle}>{subtitle}</Text>}
      </View>
      <Icon name="chevron-right" size={20} color="#999" />
    </TouchableOpacity>
  );

  const SettingItem = ({ icon, title, value, onValueChange }) => (
    <View style={styles.settingItem}>
      <View style={styles.settingLeft}>
        <View style={styles.settingIcon}>
          <Icon name={icon} size={20} color="#666" />
        </View>
        <Text style={styles.settingTitle}>{title}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: "#767577", true: "#81b0ff" }}
        thumbColor={value ? "#FF6B6B" : "#f4f3f4"}
      />
    </View>
  );

  const RecentOrderItem = ({ order }) => (
    <TouchableOpacity
      style={styles.orderItem}
      onPress={() =>
        navigation.navigate("OrderTracking", { orderId: order._id })
      }
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
      <Text style={styles.restaurantName}>{order.restaurantId.name}</Text>
      <View style={styles.orderFooter}>
        <Text style={styles.orderTotal}>৳{order.totalAmount.toFixed(2)}</Text>
        <Text style={styles.orderDate}>
          {new Date(order.createdAt).toLocaleDateString()}
        </Text>
      </View>
    </TouchableOpacity>
  );

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
      cancelled: "#F44336",
    };
    return colors[status] || "#666";
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#FF6B6B" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Profile Header */}
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.editAvatarButton}
            onPress={handleEditProfile}
          >
            <Icon name="edit" size={16} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.userInfo}>
          <Text style={styles.userName}>{user?.name || "User"}</Text>
          <Text style={styles.userEmail}>
            {user?.email || "user@example.com"}
          </Text>
          <Text style={styles.userPhone}>
            {user?.phone || "No phone number"}
          </Text>
        </View>

        <TouchableOpacity style={styles.editButton} onPress={handleEditProfile}>
          <Icon name="edit" size={18} color="#FF6B6B" />
          <Text style={styles.editButtonText}>Edit</Text>
        </TouchableOpacity>
      </View>

      {/* Order Statistics */}
      <View style={styles.statsSection}>
        <Text style={styles.sectionTitle}>Order Statistics</Text>
        <View style={styles.statsGrid}>
          <OrderStatCard
            title="Total Orders"
            value={orderStats.total}
            color="#FF6B6B"
          />
          <OrderStatCard
            title="Delivered"
            value={orderStats.delivered}
            color="#4CAF50"
          />
          <OrderStatCard
            title="Pending"
            value={orderStats.pending}
            color="#FF9800"
          />
        </View>
      </View>

      {/* Recent Orders */}
      {recentOrders.length > 0 && (
        <View style={styles.ordersSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Orders</Text>
            <TouchableOpacity onPress={() => navigation.navigate("Home")}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>

          {recentOrders.map((order) => (
            <RecentOrderItem key={order._id} order={order} />
          ))}
        </View>
      )}

      {/* Settings */}
      <View style={styles.settingsSection}>
        <Text style={styles.sectionTitle}>Preferences</Text>

        <SettingItem
          icon="notifications"
          title="Push Notifications"
          value={notificationsEnabled}
          onValueChange={setNotificationsEnabled}
        />

        <SettingItem
          icon="location-on"
          title="Location Services"
          value={locationEnabled}
          onValueChange={setLocationEnabled}
        />
      </View>

      {/* Support & Information */}
      <View style={styles.menuSection}>
        <Text style={styles.sectionTitle}>Support</Text>

        <MenuItem
          icon="help"
          title="Help & Support"
          subtitle="Get help with your orders"
          onPress={handleContactSupport}
        />

        <MenuItem
          icon="description"
          title="Terms of Service"
          subtitle="App usage terms and conditions"
        />

        <MenuItem
          icon="security"
          title="Privacy Policy"
          subtitle="How we handle your data"
        />

        <MenuItem
          icon="star"
          title="Rate Our App"
          subtitle="Share your experience with us"
        />
      </View>

      {/* Account Actions */}
      <View style={styles.menuSection}>
        <Text style={styles.sectionTitle}>Account</Text>

        <MenuItem
          icon="payment"
          title="Payment Methods"
          subtitle="Manage your payment options"
        />

        <MenuItem
          icon="location-history"
          title="Addresses"
          subtitle="Manage delivery addresses"
        />

        <MenuItem
          icon="favorite"
          title="Favorite Restaurants"
          subtitle="Your favorite food spots"
        />

        <MenuItem
          icon="logout"
          title="Logout"
          subtitle="Sign out of your account"
          onPress={handleLogout}
          danger
        />
      </View>

      {/* App Version */}
      <View style={styles.footer}>
        <Text style={styles.versionText}>Food Delivery App v1.0.0</Text>
        <Text style={styles.copyrightText}>
          © 2024 Food Delivery. All rights reserved.
        </Text>
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
    padding: 25,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  avatarContainer: {
    position: "relative",
    marginRight: 20,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#FF6B6B",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    color: "#fff",
    fontSize: 32,
    fontWeight: "bold",
  },
  editAvatarButton: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#FF6B6B",
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: "#666",
    marginBottom: 2,
  },
  userPhone: {
    fontSize: 14,
    color: "#888",
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f8f8",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  editButtonText: {
    color: "#FF6B6B",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 4,
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
  },
  statCard: {
    backgroundColor: "#f8f8f8",
    padding: 15,
    borderRadius: 8,
    width: "30%",
    alignItems: "center",
    borderLeftWidth: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 12,
    color: "#666",
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
  restaurantName: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
    marginBottom: 8,
  },
  orderFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  orderTotal: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FF6B6B",
  },
  orderDate: {
    fontSize: 12,
    color: "#666",
  },
  settingsSection: {
    backgroundColor: "#fff",
    padding: 20,
    marginBottom: 10,
  },
  settingItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  settingLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  settingIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  settingTitle: {
    fontSize: 16,
    color: "#333",
    fontWeight: "500",
  },
  menuSection: {
    backgroundColor: "#fff",
    padding: 20,
    marginBottom: 10,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  menuIconDanger: {
    backgroundColor: "#FFEBEE",
  },
  menuText: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    color: "#333",
    marginBottom: 2,
  },
  menuTitleDanger: {
    color: "#F44336",
  },
  menuSubtitle: {
    fontSize: 14,
    color: "#666",
  },
  footer: {
    alignItems: "center",
    padding: 25,
    marginBottom: 20,
  },
  versionText: {
    fontSize: 14,
    color: "#999",
    marginBottom: 4,
  },
  copyrightText: {
    fontSize: 12,
    color: "#999",
  },
});

export default ProfileScreen;
