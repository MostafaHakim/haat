import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Switch,
} from "react-native";
import { useSelector, useDispatch } from "react-redux";
import { userAPI } from "../services/api";
import { logout, setAvailability, updateUser } from "../store/slices/authSlice";
import Icon from "react-native-vector-icons/MaterialIcons";

const ProfileScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
    phone: "",
    vehicleType: "",
    licenseNumber: "",
  });

  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        vehicleType: user.vehicleType || "",
        licenseNumber: user.licenseNumber || "",
      });
    }
  }, [user]);

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

  const handleAvailabilityToggle = async (value) => {
    try {
      dispatch(setAvailability(value));

      await userAPI.updateLocation({
        isAvailable: value,
        ...(user?.location || {}),
      });

      Alert.alert(
        value ? "You are now online" : "You are now offline",
        value
          ? "You will receive delivery requests"
          : "You will not receive new delivery requests"
      );
    } catch (error) {
      console.error("Toggle availability error:", error);
      Alert.alert("Error", "Failed to update availability");
    }
  };

  const ProfileSection = ({ title, children }) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );

  const ProfileItem = ({ icon, label, value, onPress }) => (
    <TouchableOpacity style={styles.profileItem} onPress={onPress}>
      <View style={styles.profileItemLeft}>
        <Icon name={icon} size={20} color="#666" />
        <Text style={styles.profileLabel}>{label}</Text>
      </View>
      <View style={styles.profileItemRight}>
        <Text style={styles.profileValue}>{value}</Text>
        {onPress && <Icon name="chevron-right" size={20} color="#999" />}
      </View>
    </TouchableOpacity>
  );

  const MenuItem = ({ icon, title, subtitle, onPress, danger }) => (
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

  if (!user) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Profile Header */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user.name ? user.name.charAt(0).toUpperCase() : "R"}
          </Text>
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{user.name}</Text>
          <Text style={styles.userEmail}>{user.email}</Text>
          <Text style={styles.userType}>Delivery Rider</Text>
        </View>
      </View>

      {/* Availability Toggle */}
      <ProfileSection title="Availability">
        <View style={styles.availabilityItem}>
          <View style={styles.availabilityInfo}>
            <Text style={styles.availabilityLabel}>
              {user.isAvailable ? "🟢 Online" : "🔴 Offline"}
            </Text>
            <Text style={styles.availabilitySubtext}>
              {user.isAvailable
                ? "Accepting delivery requests"
                : "Not accepting new requests"}
            </Text>
          </View>
          <Switch
            value={user.isAvailable || false}
            onValueChange={handleAvailabilityToggle}
            trackColor={{ false: "#767577", true: "#81b0ff" }}
            thumbColor={user.isAvailable ? "#4CAF50" : "#f4f3f4"}
          />
        </View>
      </ProfileSection>

      {/* Personal Information */}
      <ProfileSection title="Personal Information">
        <ProfileItem icon="person" label="Full Name" value={user.name} />
        <ProfileItem icon="email" label="Email" value={user.email} />
        <ProfileItem icon="phone" label="Phone" value={user.phone} />
      </ProfileSection>

      {/* Vehicle Information */}
      <ProfileSection title="Vehicle Information">
        <ProfileItem
          icon="two-wheeler"
          label="Vehicle Type"
          value={
            user.vehicleType
              ? user.vehicleType.charAt(0).toUpperCase() +
                user.vehicleType.slice(1)
              : "Not set"
          }
        />
        <ProfileItem
          icon="badge"
          label="License Number"
          value={user.licenseNumber || "Not set"}
        />
      </ProfileSection>

      {/* App Settings */}
      <ProfileSection title="App Settings">
        <MenuItem
          icon="notifications"
          title="Push Notifications"
          subtitle="Order alerts and updates"
        />
        <MenuItem
          icon="location-on"
          title="Location Services"
          subtitle="Required for delivery tracking"
        />
        <MenuItem
          icon="volume-up"
          title="Sound & Vibration"
          subtitle="Delivery request alerts"
        />
      </ProfileSection>

      {/* Support */}
      <ProfileSection title="Support">
        <MenuItem
          icon="help"
          title="Help & Support"
          subtitle="Get help with the app"
        />
        <MenuItem
          icon="description"
          title="Terms of Service"
          subtitle="App usage terms"
        />
        <MenuItem
          icon="security"
          title="Privacy Policy"
          subtitle="How we handle your data"
        />
      </ProfileSection>

      {/* Account Actions */}
      <ProfileSection title="Account">
        <MenuItem
          icon="edit"
          title="Edit Profile"
          subtitle="Update your information"
        />
        <MenuItem
          icon="history"
          title="Delivery History"
          subtitle="View past deliveries"
          onPress={() => navigation.navigate("Earnings")}
        />
        <MenuItem
          icon="payments"
          title="Payment Methods"
          subtitle="Manage your earnings"
        />
        <MenuItem
          icon="logout"
          title="Logout"
          subtitle="Sign out of your account"
          onPress={handleLogout}
          danger
        />
      </ProfileSection>

      {/* App Version */}
      <View style={styles.footer}>
        <Text style={styles.versionText}>Food Delivery Rider App v1.0.0</Text>
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
  header: {
    backgroundColor: "#fff",
    padding: 25,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#4CAF50",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 20,
  },
  avatarText: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "bold",
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
    marginBottom: 4,
  },
  userType: {
    fontSize: 14,
    color: "#4CAF50",
    fontWeight: "500",
  },
  section: {
    backgroundColor: "#fff",
    marginBottom: 10,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginTop: 20,
    marginBottom: 15,
  },
  availabilityItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
  },
  availabilityInfo: {
    flex: 1,
  },
  availabilityLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  availabilitySubtext: {
    fontSize: 14,
    color: "#666",
  },
  profileItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  profileItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  profileLabel: {
    fontSize: 16,
    color: "#333",
    marginLeft: 12,
  },
  profileItemRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  profileValue: {
    fontSize: 16,
    color: "#666",
    marginRight: 8,
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
  },
});

export default ProfileScreen;
