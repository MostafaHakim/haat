import React, { useEffect } from "react";
import { Provider } from "react-redux";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { store } from "./src/store/store";
import { initializeSocket } from "./src/services/socket";
import AuthScreen from "./src/screens/AuthScreen";
import HomeScreen from "./src/screens/HomeScreen";
import RestaurantScreen from "./src/screens/RestaurantScreen";
import CartScreen from "./src/screens/CartScreen";
import OrderTrackingScreen from "./src/screens/OrderTrackingScreen";
import ProfileScreen from "./src/screens/ProfileScreen";

const Stack = createStackNavigator();

export default function App() {
  useEffect(() => {
    // Initialize socket connection when app starts
    initializeSocket();

    return () => {
      // Cleanup socket connection if needed
    };
  }, []);

  return (
    <Provider store={store}>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Auth">
          <Stack.Screen
            name="Auth"
            component={AuthScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Home"
            component={HomeScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Restaurant"
            component={RestaurantScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Cart"
            component={CartScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="OrderTracking"
            component={OrderTrackingScreen}
            options={{
              title: "Track Order",
              headerStyle: {
                backgroundColor: "#FF6B6B",
              },
              headerTintColor: "#fff",
              headerTitleStyle: {
                fontWeight: "bold",
              },
            }}
          />
          <Stack.Screen
            name="Profile"
            component={ProfileScreen}
            options={{
              title: "Profile",
              headerStyle: {
                backgroundColor: "#FF6B6B",
              },
              headerTintColor: "#fff",
              headerTitleStyle: {
                fontWeight: "bold",
              },
            }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </Provider>
  );
}
