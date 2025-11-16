// import React, { useEffect } from "react";
// import { Provider } from "react-redux";
// import { NavigationContainer } from "@react-navigation/native";
// import { createStackNavigator } from "@react-navigation/stack";
// import { store } from "./src/store/store";
// import { initializeSocket } from "./src/services/socket";
// import AuthScreen from "./src/screens/AuthScreen";
// import HomeScreen from "./src/screens/HomeScreen";
// import RestaurantScreen from "./src/screens/RestaurantScreen";
// import CartScreen from "./src/screens/CartScreen";
// import OrderTrackingScreen from "./src/screens/OrderTrackingScreen";
// import ProfileScreen from "./src/screens/ProfileScreen";

// const Stack = createStackNavigator();

// export default function App() {
//   useEffect(() => {
//     // Initialize socket connection when app starts
//     initializeSocket();

//     return () => {
//       // Cleanup socket connection if needed
//     };
//   }, []);

//   return (
//     <Provider store={store}>
//       <NavigationContainer>
//         <Stack.Navigator initialRouteName="Auth">
//           <Stack.Screen
//             name="Auth"
//             component={AuthScreen}
//             options={{ headerShown: false }}
//           />
//           <Stack.Screen
//             name="Home"
//             component={HomeScreen}
//             options={{ headerShown: false }}
//           />
//           <Stack.Screen
//             name="Restaurant"
//             component={RestaurantScreen}
//             options={{ headerShown: false }}
//           />
//           <Stack.Screen
//             name="Cart"
//             component={CartScreen}
//             options={{ headerShown: false }}
//           />
//           <Stack.Screen
//             name="OrderTracking"
//             component={OrderTrackingScreen}
//             options={{
//               title: "Track Order",
//               headerStyle: {
//                 backgroundColor: "#FF6B6B",
//               },
//               headerTintColor: "#fff",
//               headerTitleStyle: {
//                 fontWeight: "bold",
//               },
//             }}
//           />
//           <Stack.Screen
//             name="Profile"
//             component={ProfileScreen}
//             options={{
//               title: "Profile",
//               headerStyle: {
//                 backgroundColor: "#FF6B6B",
//               },
//               headerTintColor: "#fff",
//               headerTitleStyle: {
//                 fontWeight: "bold",
//               },
//             }}
//           />
//         </Stack.Navigator>
//       </NavigationContainer>
//     </Provider>
//   );
// }
import React, { useEffect } from "react";
import { Provider } from "react-redux";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import Icon from "react-native-vector-icons/MaterialIcons";

import { store } from "./src/store/store";
import { initializeSocket } from "./src/services/socket";

import AuthScreen from "./src/screens/AuthScreen";
import HomeScreen from "./src/screens/HomeScreen";
import RestaurantScreen from "./src/screens/RestaurantScreen";
import CartScreen from "./src/screens/CartScreen";
import OrderTrackingScreen from "./src/screens/OrderTrackingScreen";
import ProfileScreen from "./src/screens/ProfileScreen";

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// --------------------------------------------------
// 🔥 Bottom Tab Navigator (Home / Cart / Profile)
// --------------------------------------------------
const BottomTabs = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      tabBarIcon: ({ color, size }) => {
        let iconName;

        if (route.name === "Home") iconName = "home";
        else if (route.name === "Cart") iconName = "shopping-cart";
        else if (route.name === "Profile") iconName = "person";

        return <Icon name={iconName} size={size} color={color} />;
      },
      tabBarActiveTintColor: "#FF6B6B",
      tabBarInactiveTintColor: "gray",
      headerShown: false,
    })}
  >
    <Tab.Screen name="Home" component={HomeScreen} />
    <Tab.Screen name="Cart" component={CartScreen} />
    <Tab.Screen name="Profile" component={ProfileScreen} />
  </Tab.Navigator>
);

// --------------------------------------------------
// 🔥 Full App (Stack + Tabs + Socket)
// --------------------------------------------------
export default function App() {
  useEffect(() => {
    initializeSocket();
    return () => {};
  }, []);

  return (
    <Provider store={store}>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Auth">
          {/* Auth Screen */}
          <Stack.Screen
            name="Auth"
            component={AuthScreen}
            options={{ headerShown: false }}
          />

          {/* Main App after login (Tabs) */}
          <Stack.Screen
            name="Main"
            component={BottomTabs}
            options={{ headerShown: false }}
          />

          {/* Restaurant Screen */}
          <Stack.Screen
            name="Restaurant"
            component={RestaurantScreen}
            options={{ headerShown: false }}
          />

          {/* Order Tracking */}
          <Stack.Screen
            name="OrderTracking"
            component={OrderTrackingScreen}
            options={{
              title: "Track Order",
              headerStyle: { backgroundColor: "#FF6B6B" },
              headerTintColor: "#fff",
              headerTitleStyle: { fontWeight: "bold" },
            }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </Provider>
  );
}
