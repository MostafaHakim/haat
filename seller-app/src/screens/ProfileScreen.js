import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useSelector, useDispatch } from "react-redux";
import Icon from "react-native-vector-icons/MaterialIcons";
import { restaurantAPI } from "../services/api"; // Assuming restaurantAPI is available for seller's restaurant data
import { logout } from "../store/slices/authSlice"; // Assuming an authSlice with a logout action

const ProfileScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRestaurantData = async () => {
      try {
        setLoading(true);
        const response = await restaurantAPI.getMyRestaurant();
        setRestaurant(response.data);
      } catch (err) {
        console.error("Failed to fetch restaurant data:", err);
        setError("Failed to load restaurant data.");
        Alert.alert("Error", "Failed to load restaurant data.");
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchRestaurantData();
    } else {
      setLoading(false);
      setError("User not logged in.");
    }
  }, [user]);

  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to log out?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Logout",
          onPress: () => {
            dispatch(logout());
            // Navigate to AuthScreen or LoginScreen after logout
            navigation.replace("Auth"); // Assuming 'Auth' is the route name for your authentication screen
          },
        },
      ],
      { cancelable: false }
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#FF6B6B" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => navigation.goBack()} // Or implement a retry mechanism
        >
          <Text style={styles.retryButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.profileHeader}>
        <Icon name="account-circle" size={80} color="#FF6B6B" />
        <Text style={styles.userName}>{user?.name || "Seller Name"}</Text>
        <Text style={styles.userEmail}>{user?.email || "seller@example.com"}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Restaurant Information</Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Name:</Text>
          <Text style={styles.infoValue}>{restaurant?.name || "N/A"}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Address:</Text>
          <Text style={styles.infoValue}>{restaurant?.address || "N/A"}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Phone:</Text>
          <Text style={styles.infoValue}>{restaurant?.phone || "N/A"}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Status:</Text>
          <Text style={styles.infoValue}>
            {restaurant?.isActive ? "🟢 Online" : "🔴 Offline"}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => Alert.alert("Edit Restaurant", "Edit restaurant details functionality coming soon!")}
        >
          <Icon name="edit" size={20} color="#fff" />
          <Text style={styles.editButtonText}>Edit Restaurant</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account Settings</Text>
        <TouchableOpacity
          style={styles.settingItem}
          onPress={() => Alert.alert("Change Password", "Change password functionality coming soon!")}
        >
          <Icon name="lock" size={24} color="#333" />
          <Text style={styles.settingText}>Change Password</Text>
          <Icon name="chevron-right" size={24} color="#999" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.settingItem}
          onPress={() => Alert.alert("Notifications", "Notification settings functionality coming soon!")}
        >
          <Icon name="notifications" size={24} color="#333" />
          <Text style={styles.settingText}>Notifications</Text>
          <Icon name="chevron-right" size={24} color="#999" />
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Icon name="logout" size={24} color="#fff" />
        <Text style={styles.logoutButtonText}>Logout</Text>
      </TouchableOpacity>
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
    backgroundColor: "#f8f8f8",
  },
  loadingText: {
    marginTop: 10,
    color: "#666",
    fontSize: 16,
  },
  errorText: {
    color: "#FF6B6B",
    fontSize: 16,
    marginBottom: 10,
  },
  retryButton: {
    backgroundColor: "#FF6B6B",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  profileHeader: {
    backgroundColor: "#fff",
    padding: 20,
    alignItems: "center",
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  userName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginTop: 10,
  },
  userEmail: {
    fontSize: 16,
    color: "#666",
    marginTop: 5,
  },
  section: {
    backgroundColor: "#fff",
    padding: 20,
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 15,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  infoLabel: {
    fontSize: 16,
    color: "#666",
    fontWeight: "500",
  },
  infoValue: {
    fontSize: 16,
    color: "#333",
    flexShrink: 1, // Allow text to wrap
    textAlign: "right",
  },
  editButton: {
    flexDirection: "row",
    backgroundColor: "#FF6B6B",
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    marginTop: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  editButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 10,
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  settingText: {
    flex: 1,
    fontSize: 16,
    color: "#333",
    marginLeft: 15,
  },
  logoutButton: {
    flexDirection: "row",
    backgroundColor: "#FF6B6B",
    paddingVertical: 15,
    borderRadius: 8,
    margin: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  logoutButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 10,
  },
});

export default ProfileScreen;
