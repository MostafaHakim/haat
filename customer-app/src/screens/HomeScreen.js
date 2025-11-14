import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  TextInput,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useSelector, useDispatch } from "react-redux";
import { restaurantAPI, orderAPI } from "../services/api";
import * as Location from "expo-location";
import Icon from "react-native-vector-icons/MaterialIcons";

const HomeScreen = ({ navigation }) => {
  const [restaurants, setRestaurants] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [location, setLocation] = useState(null);
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    getLocationAndRestaurants();
    fetchRecentOrders();
  }, []);

  const getLocationAndRestaurants = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission denied",
          "Need location permission to find nearby restaurants"
        );
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      setLocation(location.coords);

      await fetchNearbyRestaurants(location.coords);
    } catch (error) {
      console.error("Location error:", error);
      Alert.alert("Error", "Failed to get location");
    }
  };
  console.log(location);
  const fetchNearbyRestaurants = async (coords) => {
    try {
      setLoading(true);
      const response = await restaurantAPI.getNearby({
        latitude: coords.latitude,
        longitude: coords.longitude,
        maxDistance: 10,
      });
      if (response.data.length > 0) {
        setRestaurants(response.data);
      } else {
        const allRestaurantsResponse = await restaurantAPI.getAll();
        setRestaurants(allRestaurantsResponse.data);
      }
    } catch (error) {
      console.error("Fetch restaurants error:", error);
      Alert.alert("Error", "Failed to load restaurants");
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentOrders = async () => {
    try {
      setOrdersLoading(true);
      const response = await orderAPI.getMyOrders({ limit: 3 });
      setRecentOrders(response.data.orders);
    } catch (error) {
      console.error("Fetch orders error:", error);
    } finally {
      setOrdersLoading(false);
    }
  };

  const renderRestaurantItem = ({ item }) => (
    <TouchableOpacity
      style={styles.restaurantCard}
      onPress={() =>
        navigation.navigate("Restaurant", { restaurantId: item._id })
      }
    >
      <Image
        source={{ uri: item.image || "https://via.placeholder.com/150" }}
        style={styles.restaurantImage}
        defaultSource={require("../../assets/placeholder.png")}
      />
      <View style={styles.restaurantInfo}>
        <Text style={styles.restaurantName}>{item.name}</Text>
        <Text style={styles.restaurantCuisine}>{item.cuisineType}</Text>
        <Text style={styles.restaurantAddress}>{item.address}</Text>
        <Text style={styles.restaurantRating}>⭐ {item.rating || "New"}</Text>
        <Text style={styles.deliveryInfo}>Delivery: 30-45 min</Text>
      </View>
    </TouchableOpacity>
  );

  const renderOrderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.orderCard}
      onPress={() =>
        navigation.navigate("OrderTracking", { orderId: item._id })
      }
    >
      <View style={styles.orderHeader}>
        <Text style={styles.orderId}>#{item.orderId}</Text>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(item.status) },
          ]}
        >
          <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
        </View>
      </View>
      <Text style={styles.restaurantName}>{item.restaurantId.name}</Text>
      <Text style={styles.orderTotal}>৳{item.totalAmount.toFixed(2)}</Text>
      <Text style={styles.orderDate}>
        {new Date(item.createdAt).toLocaleDateString()}
      </Text>
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

  const getStatusText = (status) => {
    const texts = {
      pending: "Pending",
      confirmed: "Confirmed",
      preparing: "Preparing",
      ready: "Ready",
      assigned: "Rider Assigned",
      picked_up: "Picked Up",
      on_the_way: "On the Way",
      delivered: "Delivered",
      cancelled: "Cancelled",
    };
    return texts[status] || status;
  };

  const filteredRestaurants = restaurants.filter(
    (restaurant) =>
      restaurant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      restaurant.cuisineType.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#FF6B6B" />
        <Text style={styles.loadingText}>Finding restaurants near you...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.greeting}>Hello, {user?.name}!</Text>
        <Text style={styles.subtitle}>What would you like to order today?</Text>
      </View>

      <TextInput
        style={styles.searchInput}
        placeholder="Search restaurants or cuisines..."
        value={searchQuery}
        onChangeText={setSearchQuery}
      />

      {/* Recent Orders Section */}
      {recentOrders.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Orders</Text>
            <TouchableOpacity onPress={() => navigation.navigate("Profile")}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={recentOrders}
            renderItem={renderOrderItem}
            keyExtractor={(item) => item._id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.ordersList}
          />
        </View>
      )}

      {/* Nearby Restaurants Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Nearby Restaurants</Text>
        <FlatList
          data={filteredRestaurants}
          renderItem={renderRestaurantItem}
          keyExtractor={(item) => item._id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No restaurants found nearby</Text>
          }
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
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
    marginBottom: 20,
  },
  greeting: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 5,
    color: "#333",
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
  },
  searchInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    fontSize: 16,
    backgroundColor: "#f9f9f9",
  },
  section: {
    marginBottom: 25,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  seeAllText: {
    color: "#FF6B6B",
    fontWeight: "600",
  },
  ordersList: {
    paddingRight: 20,
  },
  orderCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 15,
    marginRight: 15,
    width: 280,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
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
  },
  restaurantName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 5,
    color: "#333",
  },
  orderTotal: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FF6B6B",
    marginBottom: 5,
  },
  orderDate: {
    fontSize: 12,
    color: "#666",
  },
  listContainer: {
    paddingBottom: 20,
  },
  restaurantCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 15,
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  restaurantImage: {
    width: 100,
    height: 100,
  },
  restaurantInfo: {
    flex: 1,
    padding: 15,
    justifyContent: "space-between",
  },
  restaurantName: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 5,
    color: "#333",
  },
  restaurantCuisine: {
    fontSize: 14,
    color: "#FF6B6B",
    marginBottom: 5,
  },
  restaurantAddress: {
    fontSize: 12,
    color: "#666",
    marginBottom: 5,
  },
  restaurantRating: {
    fontSize: 12,
    color: "#666",
  },
  deliveryInfo: {
    fontSize: 12,
    color: "#4CAF50",
    marginTop: 5,
  },
  emptyText: {
    textAlign: "center",
    color: "#666",
    fontSize: 16,
    marginTop: 50,
  },
});

export default HomeScreen;
