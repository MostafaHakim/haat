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
  TextInput,
  Switch,
  Modal,
} from "react-native";
import { useSelector, useDispatch } from "react-redux";
import { adminAPI } from "../services/api";
import { setUsers, updateUserStatus } from "../store/slices/usersSlice";
import Icon from "react-native-vector-icons/MaterialIcons";

const UsersScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [userTypeFilter, setUserTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [userDetailModal, setUserDetailModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userDetails, setUserDetails] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const dispatch = useDispatch();
  const { users, total, currentPage, totalPages } = useSelector(
    (state) => state.users
  );

  useEffect(() => {
    loadUsers();
  }, [userTypeFilter, statusFilter]);

  const loadUsers = async (page = 1) => {
    try {
      setLoading(true);
      const response = await adminAPI.getUsers({
        page,
        limit: 20,
        userType: userTypeFilter !== "all" ? userTypeFilter : undefined,
        search: searchQuery || undefined,
      });

      dispatch(
        setUsers({
          users: response.data.users,
          total: response.data.total,
          currentPage: response.data.currentPage,
          totalPages: response.data.totalPages,
        })
      );
    } catch (error) {
      console.error("Load users error:", error);
      Alert.alert("Error", "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadUsers();
    setRefreshing(false);
  };

  const handleSearch = () => {
    loadUsers(1);
  };

  const handleUserStatusChange = async (userId, currentStatus) => {
    try {
      const newStatus = !currentStatus;
      await adminAPI.updateUserStatus(userId, { isActive: newStatus });

      dispatch(updateUserStatus({ userId, isActive: newStatus }));

      Alert.alert("Success", `User ${newStatus ? "activated" : "deactivated"}`);
    } catch (error) {
      console.error("Update user status error:", error);
      Alert.alert("Error", "Failed to update user status");
    }
  };

  const loadUserDetails = async (user) => {
    try {
      setDetailLoading(true);
      setSelectedUser(user);
      const response = await adminAPI.getUserById(user._id);
      setUserDetails(response.data);
      setUserDetailModal(true);
    } catch (error) {
      console.error("Load user details error:", error);
      Alert.alert("Error", "Failed to load user details");
    } finally {
      setDetailLoading(false);
    }
  };

  const getUserTypeColor = (userType) => {
    const colors = {
      customer: "#4CAF50",
      seller: "#FF9800",
      rider: "#2196F3",
      admin: "#9C27B0",
    };
    return colors[userType] || "#666";
  };

  const renderUserItem = ({ item }) => (
    <TouchableOpacity
      style={styles.userCard}
      onPress={() => loadUserDetails(item)}
    >
      <View style={styles.userHeader}>
        <View style={styles.userAvatar}>
          <Text style={styles.avatarText}>
            {item.name ? item.name.charAt(0).toUpperCase() : "U"}
          </Text>
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{item.name}</Text>
          <Text style={styles.userEmail}>{item.email}</Text>
          <View style={styles.userMeta}>
            <View
              style={[
                styles.userType,
                { backgroundColor: getUserTypeColor(item.userType) },
              ]}
            >
              <Text style={styles.userTypeText}>{item.userType}</Text>
            </View>
            <Text style={styles.userPhone}>{item.phone}</Text>
          </View>
        </View>
        <View style={styles.userActions}>
          <Switch
            value={item.isActive !== false}
            onValueChange={() =>
              handleUserStatusChange(item._id, item.isActive !== false)
            }
            trackColor={{ false: "#767577", true: "#81b0ff" }}
            thumbColor={item.isActive !== false ? "#4CAF50" : "#f4f3f4"}
          />
        </View>
      </View>

      <View style={styles.userFooter}>
        <Text style={styles.userDate}>
          Joined: {new Date(item.createdAt).toLocaleDateString()}
        </Text>
        <View style={styles.statusIndicator}>
          <View
            style={[
              styles.statusDot,
              {
                backgroundColor:
                  item.isActive !== false ? "#4CAF50" : "#F44336",
              },
            ]}
          />
          <Text style={styles.statusText}>
            {item.isActive !== false ? "Active" : "Inactive"}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const FilterButton = ({ filter, currentFilter, label, onPress }) => (
    <TouchableOpacity
      style={[
        styles.filterButton,
        currentFilter === filter && styles.filterButtonActive,
      ]}
      onPress={onPress}
    >
      <Text
        style={[
          styles.filterText,
          currentFilter === filter && styles.filterTextActive,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  const UserDetailModal = () => (
    <Modal
      visible={userDetailModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setUserDetailModal(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          {detailLoading ? (
            <View style={styles.modalLoading}>
              <ActivityIndicator size="large" color="#2196F3" />
              <Text style={styles.loadingText}>Loading user details...</Text>
            </View>
          ) : userDetails ? (
            <>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>User Details</Text>
                <TouchableOpacity onPress={() => setUserDetailModal(false)}>
                  <Icon name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalBody}>
                {/* User Basic Info */}
                <View style={styles.detailSection}>
                  <Text style={styles.sectionTitle}>Basic Information</Text>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Name:</Text>
                    <Text style={styles.detailValue}>
                      {userDetails.user.name}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Email:</Text>
                    <Text style={styles.detailValue}>
                      {userDetails.user.email}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Phone:</Text>
                    <Text style={styles.detailValue}>
                      {userDetails.user.phone}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>User Type:</Text>
                    <View
                      style={[
                        styles.userType,
                        {
                          backgroundColor: getUserTypeColor(
                            userDetails.user.userType
                          ),
                        },
                      ]}
                    >
                      <Text style={styles.userTypeText}>
                        {userDetails.user.userType}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Status:</Text>
                    <Text
                      style={[
                        styles.statusText,
                        {
                          color:
                            userDetails.user.isActive !== false
                              ? "#4CAF50"
                              : "#F44336",
                        },
                      ]}
                    >
                      {userDetails.user.isActive !== false
                        ? "Active"
                        : "Inactive"}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Joined:</Text>
                    <Text style={styles.detailValue}>
                      {new Date(userDetails.user.createdAt).toLocaleString()}
                    </Text>
                  </View>
                </View>

                {/* Additional Info based on user type */}
                {userDetails.user.userType === "seller" &&
                  userDetails.restaurant && (
                    <View style={styles.detailSection}>
                      <Text style={styles.sectionTitle}>
                        Restaurant Information
                      </Text>
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Restaurant Name:</Text>
                        <Text style={styles.detailValue}>
                          {userDetails.restaurant.name}
                        </Text>
                      </View>
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Cuisine Type:</Text>
                        <Text style={styles.detailValue}>
                          {userDetails.restaurant.cuisineType}
                        </Text>
                      </View>
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Address:</Text>
                        <Text style={styles.detailValue}>
                          {userDetails.restaurant.address}
                        </Text>
                      </View>
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Status:</Text>
                        <Text
                          style={[
                            styles.statusText,
                            {
                              color: userDetails.restaurant.isActive
                                ? "#4CAF50"
                                : "#F44336",
                            },
                          ]}
                        >
                          {userDetails.restaurant.isActive
                            ? "Active"
                            : "Inactive"}
                        </Text>
                      </View>
                    </View>
                  )}

                {/* Orders History */}
                {userDetails.orders && userDetails.orders.length > 0 && (
                  <View style={styles.detailSection}>
                    <Text style={styles.sectionTitle}>
                      Recent Orders ({userDetails.orders.length})
                    </Text>
                    {userDetails.orders.slice(0, 5).map((order) => (
                      <View key={order._id} style={styles.orderItem}>
                        <Text style={styles.orderId}>#{order.orderId}</Text>
                        <Text style={styles.orderAmount}>
                          ৳{order.totalAmount}
                        </Text>
                        <Text style={styles.orderStatus}>{order.status}</Text>
                        <Text style={styles.orderDate}>
                          {new Date(order.createdAt).toLocaleDateString()}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
              </ScrollView>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() =>
                    handleUserStatusChange(
                      userDetails.user._id,
                      userDetails.user.isActive !== false
                    )
                  }
                >
                  <Text style={styles.actionButtonText}>
                    {userDetails.user.isActive !== false
                      ? "Deactivate User"
                      : "Activate User"}
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          ) : null}
        </View>
      </View>
    </Modal>
  );

  if (loading && users.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Loading users...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search users by name, email, or phone..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={handleSearch}
        />
        <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
          <Icon name="search" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Filters */}
      <View style={styles.filtersContainer}>
        <Text style={styles.filterLabel}>User Type:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.filterRow}>
            <FilterButton
              filter="all"
              currentFilter={userTypeFilter}
              label="All Users"
              onPress={() => setUserTypeFilter("all")}
            />
            <FilterButton
              filter="customer"
              currentFilter={userTypeFilter}
              label="Customers"
              onPress={() => setUserTypeFilter("customer")}
            />
            <FilterButton
              filter="seller"
              currentFilter={userTypeFilter}
              label="Sellers"
              onPress={() => setUserTypeFilter("seller")}
            />
            <FilterButton
              filter="rider"
              currentFilter={userTypeFilter}
              label="Riders"
              onPress={() => setUserTypeFilter("rider")}
            />
          </View>
        </ScrollView>
      </View>

      {/* Users List */}
      <FlatList
        data={users}
        renderItem={renderUserItem}
        keyExtractor={(item) => item._id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.usersList}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="people" size={64} color="#ddd" />
            <Text style={styles.emptyText}>No users found</Text>
            <Text style={styles.emptySubtext}>
              {userTypeFilter !== "all"
                ? `No ${userTypeFilter} users found`
                : "No users match your search criteria"}
            </Text>
          </View>
        }
        ListFooterComponent={
          currentPage < totalPages ? (
            <TouchableOpacity
              style={styles.loadMoreButton}
              onPress={() => loadUsers(currentPage + 1)}
            >
              <Text style={styles.loadMoreText}>Load More</Text>
            </TouchableOpacity>
          ) : null
        }
      />

      <UserDetailModal />
    </View>
  );
};

// ScrollView import যোগ করুন
import { ScrollView } from "react-native";

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
    flexDirection: "row",
    marginBottom: 15,
  },
  searchInput: {
    flex: 1,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    marginRight: 10,
  },
  searchButton: {
    backgroundColor: "#2196F3",
    width: 50,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  filtersContainer: {
    marginBottom: 15,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  filterRow: {
    flexDirection: "row",
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#fff",
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  filterButtonActive: {
    backgroundColor: "#2196F3",
    borderColor: "#2196F3",
  },
  filterText: {
    fontSize: 12,
    color: "#666",
    fontWeight: "500",
  },
  filterTextActive: {
    color: "#fff",
    fontWeight: "600",
  },
  usersList: {
    paddingBottom: 20,
  },
  userCard: {
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
  userHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  userAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#2196F3",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  avatarText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 14,
    color: "#666",
    marginBottom: 6,
  },
  userMeta: {
    flexDirection: "row",
    alignItems: "center",
  },
  userType: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 8,
  },
  userTypeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "bold",
    textTransform: "capitalize",
  },
  userPhone: {
    fontSize: 12,
    color: "#666",
  },
  userActions: {
    marginLeft: 10,
  },
  userFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    paddingTop: 12,
  },
  userDate: {
    fontSize: 12,
    color: "#666",
  },
  statusIndicator: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "500",
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
  loadMoreButton: {
    backgroundColor: "#2196F3",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
  loadMoreText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 12,
    width: "100%",
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  modalBody: {
    padding: 20,
  },
  modalLoading: {
    padding: 40,
    alignItems: "center",
  },
  detailSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  detailValue: {
    fontSize: 14,
    color: "#333",
    fontWeight: "600",
  },
  orderItem: {
    backgroundColor: "#f8f8f8",
    padding: 10,
    borderRadius: 6,
    marginBottom: 8,
  },
  orderId: {
    fontSize: 12,
    fontWeight: "600",
    color: "#333",
  },
  orderAmount: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#2196F3",
  },
  orderStatus: {
    fontSize: 12,
    color: "#666",
    textTransform: "capitalize",
  },
  orderDate: {
    fontSize: 10,
    color: "#999",
  },
  modalActions: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  actionButton: {
    backgroundColor: "#2196F3",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  actionButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default UsersScreen;
