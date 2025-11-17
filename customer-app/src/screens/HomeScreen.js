// import React, { useEffect, useState } from "react";
// import {
//   View,
//   Text,
//   StyleSheet,
//   FlatList,
//   TouchableOpacity,
//   Image,
//   TextInput,
//   Alert,
//   ActivityIndicator,
// } from "react-native";
// import { useSelector, useDispatch } from "react-redux";
// import { restaurantAPI, orderAPI } from "../services/api";
// import * as Location from "expo-location";
// import Icon from "react-native-vector-icons/MaterialIcons";

// const HomeScreen = ({ navigation }) => {
//   const [restaurants, setRestaurants] = useState([]);
//   const [recentOrders, setRecentOrders] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [ordersLoading, setOrdersLoading] = useState(true);
//   const [searchQuery, setSearchQuery] = useState("");
//   const [location, setLocation] = useState(null);
//   const [locationError, setLocationError] = useState(false);
//   const [locationLoading, setLocationLoading] = useState(false);
//   const { user } = useSelector((state) => state.auth);

//   useEffect(() => {
//     getLocationAndRestaurants();
//     fetchRecentOrders();
//   }, []);

//   const getLocationAndRestaurants = async () => {
//     try {
//       setLocationLoading(true);
//       setLocationError(false);
//       console.log("Requesting location permission...");

//       let { status } = await Location.requestForegroundPermissionsAsync();

//       if (status !== "granted") {
//         console.log("Location permission denied");
//         setLocationError(true);
//         Alert.alert(
//           "Location Permission Required",
//           "We need location access to show restaurants near you. You can still browse all restaurants.",
//           [
//             {
//               text: "OK",
//               onPress: () => fetchAllRestaurants(),
//             },
//           ]
//         );
//         return;
//       }

//       console.log("Getting current position...");

//       // Try to get last known position first (faster)
//       let lastPosition = await Location.getLastKnownPositionAsync();
//       if (lastPosition) {
//         console.log("Using last known position:", lastPosition.coords);
//         setLocation(lastPosition.coords);
//         await fetchNearbyRestaurants(lastPosition.coords);
//         return;
//       }

//       // If no last known position, get fresh location with better options
//       let currentPosition = await Location.getCurrentPositionAsync({
//         accuracy: Location.Accuracy.High,
//         timeout: 10000, // 10 seconds timeout
//         maximumAge: 30000, // Accept location up to 30 seconds old
//       });

//       console.log("Fresh location obtained:", currentPosition.coords);
//       setLocation(currentPosition.coords);
//       await fetchNearbyRestaurants(currentPosition.coords);
//     } catch (error) {
//       console.error("Location error details:", error);
//       setLocationError(true);

//       // Try using a default location as fallback
//       const defaultLocation = {
//         latitude: 23.8103, // Default to Dhaka coordinates
//         longitude: 90.4125,
//       };

//       console.log("Using default location:", defaultLocation);
//       setLocation(defaultLocation);
//       await fetchNearbyRestaurants(defaultLocation);
//     } finally {
//       setLocationLoading(false);
//     }
//   };

//   const fetchAllRestaurants = async () => {
//     try {
//       setLoading(true);
//       const response = await restaurantAPI.getAll();
//       setRestaurants(response.data);
//       console.log("Fetched all restaurants:", response.data.length);
//     } catch (error) {
//       console.error("Fetch all restaurants error:", error);
//       Alert.alert("Error", "Failed to load restaurants");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const fetchNearbyRestaurants = async (coords) => {
//     try {
//       setLoading(true);
//       console.log("Fetching nearby restaurants with coords:", coords);

//       const response = await restaurantAPI.getNearby({
//         latitude: coords.latitude,
//         longitude: coords.longitude,
//         maxDistance: 50,
//       });

//       console.log("Nearby restaurants response:", response.data);

//       if (response.data && response.data.length > 0) {
//         setRestaurants(response.data);
//       } else {
//         console.log("No nearby restaurants found, fetching all restaurants");
//         await fetchAllRestaurants();
//       }
//     } catch (error) {
//       console.error("Fetch nearby restaurants error:", error);
//       // Fallback to all restaurants if nearby fails
//       await fetchAllRestaurants();
//     } finally {
//       setLoading(false);
//     }
//   };

//   const fetchRecentOrders = async () => {
//     try {
//       setOrdersLoading(true);
//       const response = await orderAPI.getMyOrders({ limit: 3 });
//       setRecentOrders(response.data.orders);
//     } catch (error) {
//       console.error("Fetch orders error:", error);
//     } finally {
//       setOrdersLoading(false);
//     }
//   };

//   const retryLocation = async () => {
//     await getLocationAndRestaurants();
//   };

//   const renderRestaurantItem = ({ item }) => (
//     <TouchableOpacity
//       style={styles.restaurantCard}
//       onPress={() =>
//         navigation.navigate("Restaurant", { restaurantId: item._id })
//       }
//     >
//       <Image
//         source={{ uri: item.image || "https://via.placeholder.com/150" }}
//         style={styles.restaurantImage}
//         defaultSource={require("../../assets/placeholder.png")}
//       />
//       <View style={styles.restaurantInfo}>
//         <Text style={styles.restaurantName}>{item.name}</Text>
//         <Text style={styles.restaurantCuisine}>{item.cuisineType}</Text>
//         <Text style={styles.restaurantAddress}>{item.address}</Text>
//         <Text style={styles.restaurantRating}>⭐ {item.rating || "New"}</Text>
//         {location && !locationError && (
//           <Text style={styles.deliveryInfo}>Delivery: 30-45 min</Text>
//         )}
//       </View>
//     </TouchableOpacity>
//   );

//   const renderOrderItem = ({ item }) => (
//     <TouchableOpacity
//       style={styles.orderCard}
//       onPress={() =>
//         navigation.navigate("OrderTracking", { orderId: item._id })
//       }
//     >
//       <View style={styles.orderHeader}>
//         <Text style={styles.orderId}>#{item.orderId}</Text>
//         <View
//           style={[
//             styles.statusBadge,
//             { backgroundColor: getStatusColor(item.status) },
//           ]}
//         >
//           <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
//         </View>
//       </View>
//       <Text style={styles.restaurantName}>{item.restaurantId.name}</Text>
//       <Text style={styles.orderTotal}>৳{item.totalAmount.toFixed(2)}</Text>
//       <Text style={styles.orderDate}>
//         {new Date(item.createdAt).toLocaleDateString()}
//       </Text>
//     </TouchableOpacity>
//   );

//   const getStatusColor = (status) => {
//     const colors = {
//       pending: "#FFA500",
//       confirmed: "#2196F3",
//       preparing: "#FF9800",
//       ready: "#4CAF50",
//       assigned: "#9C27B0",
//       picked_up: "#673AB7",
//       on_the_way: "#3F51B5",
//       delivered: "#4CAF50",
//       cancelled: "#F44336",
//     };
//     return colors[status] || "#666";
//   };

//   const getStatusText = (status) => {
//     const texts = {
//       pending: "Pending",
//       confirmed: "Confirmed",
//       preparing: "Preparing",
//       ready: "Ready",
//       assigned: "Rider Assigned",
//       picked_up: "Picked Up",
//       on_the_way: "On the Way",
//       delivered: "Delivered",
//       cancelled: "Cancelled",
//     };
//     return texts[status] || status;
//   };

//   const filteredRestaurants = restaurants.filter(
//     (restaurant) =>
//       restaurant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
//       restaurant.cuisineType.toLowerCase().includes(searchQuery.toLowerCase())
//   );

//   // Show loading only if both location and restaurants are loading
//   if (loading && locationLoading) {
//     return (
//       <View style={styles.centered}>
//         <ActivityIndicator size="large" color="#FF6B6B" />
//         <Text style={styles.loadingText}>Finding restaurants near you...</Text>
//         <Text style={styles.subLoadingText}>This may take a few seconds</Text>
//       </View>
//     );
//   }

//   return (
//     <View style={styles.container}>
//       <View style={styles.header}>
//         <Text style={styles.greeting}>Hello, {user?.name}!</Text>
//         <Text style={styles.subtitle}>What would you like to order today?</Text>
//       </View>

//       <TextInput
//         style={styles.searchInput}
//         placeholder="Search restaurants or cuisines..."
//         value={searchQuery}
//         onChangeText={setSearchQuery}
//       />

//       {/* Location Status Banner */}
//       {locationError ? (
//         <View style={styles.locationErrorBanner}>
//           <Icon name="location-off" size={20} color="#FFF" />
//           <Text style={styles.locationErrorText}>Using default location</Text>
//           <TouchableOpacity onPress={retryLocation}>
//             <Text style={styles.retryText}>Retry</Text>
//           </TouchableOpacity>
//         </View>
//       ) : location ? (
//         <View style={styles.locationSuccessBanner}>
//           <Icon name="my-location" size={16} color="#4CAF50" />
//           <Text style={styles.locationSuccessText}>
//             Showing restaurants near you
//           </Text>
//         </View>
//       ) : null}

//       {/* Recent Orders Section */}
//       {recentOrders.length > 0 && (
//         <View style={styles.section}>
//           <View style={styles.sectionHeader}>
//             <Text style={styles.sectionTitle}>Recent Orders</Text>
//             <TouchableOpacity
//               onPress={() => navigation.navigate("OrderHistory")}
//             >
//               <Text style={styles.seeAllText}>See All</Text>
//             </TouchableOpacity>
//           </View>
//           {ordersLoading ? (
//             <ActivityIndicator size="small" color="#FF6B6B" />
//           ) : (
//             <FlatList
//               data={recentOrders}
//               renderItem={renderOrderItem}
//               keyExtractor={(item) => item._id}
//               horizontal
//               showsHorizontalScrollIndicator={false}
//               contentContainerStyle={styles.ordersList}
//             />
//           )}
//         </View>
//       )}

//       {/* Restaurants Section */}
//       <View style={styles.section}>
//         <View style={styles.sectionHeader}>
//           <Text style={styles.sectionTitle}>
//             {locationError ? "All Restaurants" : "Nearby Restaurants"}
//           </Text>
//           <TouchableOpacity onPress={retryLocation}>
//             <Icon name="refresh" size={20} color="#FF6B6B" />
//           </TouchableOpacity>
//         </View>

//         {loading ? (
//           <View style={styles.loadingContainer}>
//             <ActivityIndicator size="large" color="#FF6B6B" />
//             <Text style={styles.loadingText}>Loading restaurants...</Text>
//           </View>
//         ) : (
//           <FlatList
//             data={filteredRestaurants}
//             renderItem={renderRestaurantItem}
//             keyExtractor={(item) => item._id}
//             showsVerticalScrollIndicator={false}
//             contentContainerStyle={styles.listContainer}
//             ListEmptyComponent={
//               <View style={styles.emptyContainer}>
//                 <Icon name="restaurant" size={50} color="#DDD" />
//                 <Text style={styles.emptyText}>No restaurants found</Text>
//                 <Text style={styles.emptySubText}>
//                   Try adjusting your search or check back later
//                 </Text>
//               </View>
//             }
//           />
//         )}
//       </View>
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     padding: 20,
//     backgroundColor: "#fff",
//   },
//   centered: {
//     flex: 1,
//     justifyContent: "center",
//     alignItems: "center",
//   },
//   loadingContainer: {
//     padding: 40,
//     alignItems: "center",
//   },
//   loadingText: {
//     marginTop: 10,
//     color: "#666",
//     fontSize: 16,
//   },
//   subLoadingText: {
//     marginTop: 5,
//     color: "#999",
//     fontSize: 12,
//   },
//   header: {
//     marginBottom: 20,
//   },
//   greeting: {
//     fontSize: 24,
//     fontWeight: "bold",
//     marginBottom: 5,
//     color: "#333",
//   },
//   subtitle: {
//     fontSize: 16,
//     color: "#666",
//   },
//   searchInput: {
//     borderWidth: 1,
//     borderColor: "#ddd",
//     padding: 15,
//     borderRadius: 8,
//     marginBottom: 15,
//     fontSize: 16,
//     backgroundColor: "#f9f9f9",
//   },
//   locationErrorBanner: {
//     flexDirection: "row",
//     alignItems: "center",
//     backgroundColor: "#FF6B6B",
//     padding: 12,
//     borderRadius: 8,
//     marginBottom: 15,
//   },
//   locationSuccessBanner: {
//     flexDirection: "row",
//     alignItems: "center",
//     backgroundColor: "#E8F5E8",
//     padding: 12,
//     borderRadius: 8,
//     marginBottom: 15,
//     borderLeftWidth: 4,
//     borderLeftColor: "#4CAF50",
//   },
//   locationErrorText: {
//     color: "#FFF",
//     marginLeft: 8,
//     flex: 1,
//     fontSize: 14,
//   },
//   locationSuccessText: {
//     color: "#2E7D32",
//     marginLeft: 8,
//     flex: 1,
//     fontSize: 14,
//     fontWeight: "500",
//   },
//   retryText: {
//     color: "#FFF",
//     fontWeight: "bold",
//     textDecorationLine: "underline",
//   },
//   section: {
//     marginBottom: 25,
//   },
//   sectionHeader: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//     marginBottom: 15,
//   },
//   sectionTitle: {
//     fontSize: 20,
//     fontWeight: "bold",
//     color: "#333",
//   },
//   seeAllText: {
//     color: "#FF6B6B",
//     fontWeight: "600",
//   },
//   ordersList: {
//     paddingRight: 20,
//   },
//   orderCard: {
//     backgroundColor: "#fff",
//     borderRadius: 12,
//     padding: 15,
//     marginRight: 15,
//     width: 280,
//     elevation: 2,
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 1 },
//     shadowOpacity: 0.1,
//     shadowRadius: 3,
//   },
//   orderHeader: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//     marginBottom: 10,
//   },
//   orderId: {
//     fontSize: 14,
//     fontWeight: "600",
//     color: "#333",
//   },
//   statusBadge: {
//     paddingHorizontal: 8,
//     paddingVertical: 4,
//     borderRadius: 12,
//   },
//   statusText: {
//     color: "#fff",
//     fontSize: 10,
//     fontWeight: "bold",
//   },
//   restaurantName: {
//     fontSize: 16,
//     fontWeight: "600",
//     marginBottom: 5,
//     color: "#333",
//   },
//   orderTotal: {
//     fontSize: 16,
//     fontWeight: "bold",
//     color: "#FF6B6B",
//     marginBottom: 5,
//   },
//   orderDate: {
//     fontSize: 12,
//     color: "#666",
//   },
//   listContainer: {
//     paddingBottom: 20,
//   },
//   restaurantCard: {
//     flexDirection: "row",
//     backgroundColor: "#fff",
//     borderRadius: 12,
//     marginBottom: 15,
//     overflow: "hidden",
//     elevation: 2,
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 1 },
//     shadowOpacity: 0.1,
//     shadowRadius: 3,
//   },
//   restaurantImage: {
//     width: 100,
//     height: 100,
//   },
//   restaurantInfo: {
//     flex: 1,
//     padding: 15,
//     justifyContent: "space-between",
//   },
//   restaurantName: {
//     fontSize: 18,
//     fontWeight: "bold",
//     marginBottom: 5,
//     color: "#333",
//   },
//   restaurantCuisine: {
//     fontSize: 14,
//     color: "#FF6B6B",
//     marginBottom: 5,
//   },
//   restaurantAddress: {
//     fontSize: 12,
//     color: "#666",
//     marginBottom: 5,
//   },
//   restaurantRating: {
//     fontSize: 12,
//     color: "#666",
//   },
//   deliveryInfo: {
//     fontSize: 12,
//     color: "#4CAF50",
//     marginTop: 5,
//   },
//   emptyContainer: {
//     alignItems: "center",
//     padding: 40,
//   },
//   emptyText: {
//     textAlign: "center",
//     color: "#666",
//     fontSize: 16,
//     marginTop: 10,
//     marginBottom: 5,
//   },
//   emptySubText: {
//     textAlign: "center",
//     color: "#999",
//     fontSize: 14,
//   },
// });

// export default HomeScreen;
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
  ScrollView,
  RefreshControl,
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
  const [locationError, setLocationError] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    getLocationAndRestaurants();
    fetchRecentOrders();
  }, []);

  const getLocationAndRestaurants = async () => {
    try {
      setLocationLoading(true);
      setLocationError(false);
      console.log("Requesting location permission...");

      let { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        console.log("Location permission denied");
        setLocationError(true);
        Alert.alert(
          "Location Permission Required",
          "We need location access to show restaurants near you. You can still browse all restaurants.",
          [
            {
              text: "OK",
              onPress: () => fetchAllRestaurants(),
            },
          ]
        );
        return;
      }

      console.log("Getting current position...");

      let lastPosition = await Location.getLastKnownPositionAsync();
      if (lastPosition) {
        console.log("Using last known position:", lastPosition.coords);
        setLocation(lastPosition.coords);
        await fetchNearbyRestaurants(lastPosition.coords);
        return;
      }

      let currentPosition = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        timeout: 10000,
        maximumAge: 30000,
      });

      console.log("Fresh location obtained:", currentPosition.coords);
      setLocation(currentPosition.coords);
      await fetchNearbyRestaurants(currentPosition.coords);
    } catch (error) {
      console.error("Location error details:", error);
      setLocationError(true);
      const defaultLocation = {
        latitude: 23.8103,
        longitude: 90.4125,
      };
      console.log("Using default location:", defaultLocation);
      setLocation(defaultLocation);
      await fetchNearbyRestaurants(defaultLocation);
    } finally {
      setLocationLoading(false);
    }
  };

  const fetchAllRestaurants = async () => {
    try {
      setLoading(true);
      const response = await restaurantAPI.getAll();
      setRestaurants(response.data);
      console.log("Fetched all restaurants:", response.data.length);
    } catch (error) {
      console.error("Fetch all restaurants error:", error);
      Alert.alert("Error", "Failed to load restaurants");
    } finally {
      setLoading(false);
    }
  };

  const fetchNearbyRestaurants = async (coords) => {
    try {
      setLoading(true);
      console.log("Fetching nearby restaurants with coords:", coords);

      const response = await restaurantAPI.getNearby({
        latitude: coords.latitude,
        longitude: coords.longitude,
        maxDistance: 50,
      });

      console.log("Nearby restaurants response:", response.data);

      if (response.data && response.data.length > 0) {
        setRestaurants(response.data);
      } else {
        console.log("No nearby restaurants found, fetching all restaurants");
        await fetchAllRestaurants();
      }
    } catch (error) {
      console.error("Fetch nearby restaurants error:", error);
      await fetchAllRestaurants();
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

  const retryLocation = async () => {
    await getLocationAndRestaurants();
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([getLocationAndRestaurants(), fetchRecentOrders()]);
    setRefreshing(false);
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
        {location && !locationError && (
          <Text style={styles.deliveryInfo}>Delivery: 30-45 min</Text>
        )}
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
      <Text style={styles.restaurantName}>
        {item.restaurantId?.name || "Restaurant"}
      </Text>
      <Text style={styles.orderTotal}>
        ৳{item.totalAmount?.toFixed(2) || "0.00"}
      </Text>
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

  // Show loading only if both location and restaurants are loading
  if (loading && locationLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#FF6B6B" />
        <Text style={styles.loadingText}>Finding restaurants near you...</Text>
        <Text style={styles.subLoadingText}>This may take a few seconds</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#FF6B6B"]}
            tintColor="#FF6B6B"
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.greeting}>Hello, {user?.name}!</Text>
          <Text style={styles.subtitle}>
            What would you like to order today?
          </Text>
        </View>

        <TextInput
          style={styles.searchInput}
          placeholder="Search restaurants or cuisines..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />

        {/* Location Status Banner */}
        {locationError ? (
          <View style={styles.locationErrorBanner}>
            <Icon name="location-off" size={20} color="#FFF" />
            <Text style={styles.locationErrorText}>Using default location</Text>
            <TouchableOpacity onPress={retryLocation}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : location ? (
          <View style={styles.locationSuccessBanner}>
            <Icon name="my-location" size={16} color="#4CAF50" />
            <Text style={styles.locationSuccessText}>
              Showing restaurants near you
            </Text>
          </View>
        ) : null}

        {/* Recent Orders Section */}
        {recentOrders.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Orders</Text>
              <TouchableOpacity
                onPress={() => navigation.navigate("OrderHistory")}
              >
                <Text style={styles.seeAllText}>See All</Text>
              </TouchableOpacity>
            </View>
            {ordersLoading ? (
              <ActivityIndicator size="small" color="#FF6B6B" />
            ) : (
              <FlatList
                data={recentOrders}
                renderItem={renderOrderItem}
                keyExtractor={(item) => item._id}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.ordersList}
                scrollEnabled={true}
              />
            )}
          </View>
        )}

        {/* Restaurants Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {locationError ? "All Restaurants" : "Nearby Restaurants"}
            </Text>
            <TouchableOpacity onPress={retryLocation}>
              <Icon name="refresh" size={20} color="#FF6B6B" />
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#FF6B6B" />
              <Text style={styles.loadingText}>Loading restaurants...</Text>
            </View>
          ) : (
            <View style={styles.restaurantsList}>
              {filteredRestaurants.map((item) => (
                <TouchableOpacity
                  key={item._id}
                  style={styles.restaurantCard}
                  onPress={() =>
                    navigation.navigate("Restaurant", {
                      restaurantId: item._id,
                    })
                  }
                >
                  <Image
                    source={{
                      uri: item.image || "https://via.placeholder.com/150",
                    }}
                    style={styles.restaurantImage}
                    defaultSource={require("../../assets/placeholder.png")}
                  />
                  <View style={styles.restaurantInfo}>
                    <Text style={styles.restaurantName}>{item.name}</Text>
                    <Text style={styles.restaurantCuisine}>
                      {item.cuisineType}
                    </Text>
                    <Text style={styles.restaurantAddress}>{item.address}</Text>
                    <Text style={styles.restaurantRating}>
                      ⭐ {item.rating || "New"}
                    </Text>
                    {location && !locationError && (
                      <Text style={styles.deliveryInfo}>
                        Delivery: 30-45 min
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>
              ))}

              {filteredRestaurants.length === 0 && (
                <View style={styles.emptyContainer}>
                  <Icon name="restaurant" size={50} color="#DDD" />
                  <Text style={styles.emptyText}>No restaurants found</Text>
                  <Text style={styles.emptySubText}>
                    Try adjusting your search or check back later
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Bottom Spacer */}
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    paddingBottom: 40,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  loadingContainer: {
    padding: 40,
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    color: "#666",
    fontSize: 16,
  },
  subLoadingText: {
    marginTop: 5,
    color: "#999",
    fontSize: 12,
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
    marginBottom: 15,
    fontSize: 16,
    backgroundColor: "#f9f9f9",
  },
  locationErrorBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FF6B6B",
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
  },
  locationSuccessBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E8F5E8",
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
    borderLeftWidth: 4,
    borderLeftColor: "#4CAF50",
  },
  locationErrorText: {
    color: "#FFF",
    marginLeft: 8,
    flex: 1,
    fontSize: 14,
  },
  locationSuccessText: {
    color: "#2E7D32",
    marginLeft: 8,
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
  },
  retryText: {
    color: "#FFF",
    fontWeight: "bold",
    textDecorationLine: "underline",
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
  restaurantsList: {
    // Regular View for restaurants list
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
  emptyContainer: {
    alignItems: "center",
    padding: 40,
  },
  emptyText: {
    textAlign: "center",
    color: "#666",
    fontSize: 16,
    marginTop: 10,
    marginBottom: 5,
  },
  emptySubText: {
    textAlign: "center",
    color: "#999",
    fontSize: 14,
  },
  bottomSpacer: {
    height: 20,
  },
});

export default HomeScreen;
