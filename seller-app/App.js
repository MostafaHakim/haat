import React from "react";
import { Provider } from "react-redux";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { store } from "./src/store/store";
import AuthScreen from "./src/screens/AuthScreen";
import DashboardScreen from "./src/screens/DashboardScreen";
import OrdersScreen from "./src/screens/OrdersScreen";
import MenuScreen from "./src/screens/MenuScreen";
import ProfileScreen from "./src/screens/ProfileScreen";
import OrderDetailScreen from "./src/screens/OrderDetailScreen";
import AddProductScreen from "./src/screens/AddProductScreen";
import Icon from "react-native-vector-icons/MaterialIcons";

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const TabNavigator = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      tabBarIcon: ({ focused, color, size }) => {
        let iconName;

        if (route.name === "Dashboard") {
          iconName = "dashboard";
        } else if (route.name === "Orders") {
          iconName = "list-alt";
        } else if (route.name === "Menu") {
          iconName = "restaurant-menu";
        } else if (route.name === "Profile") {
          iconName = "person";
        }

        return <Icon name={iconName} size={size} color={color} />;
      },
      tabBarActiveTintColor: "#FF6B6B",
      tabBarInactiveTintColor: "gray",
      headerStyle: {
        backgroundColor: "#FF6B6B",
      },
      headerTintColor: "#fff",
      headerTitleStyle: {
        fontWeight: "bold",
      },
    })}
  >
    <Tab.Screen name="Dashboard" component={DashboardScreen} />
    <Tab.Screen name="Orders" component={OrdersScreen} />
    <Tab.Screen name="Menu" component={MenuScreen} />
    <Tab.Screen name="Profile" component={ProfileScreen} />
  </Tab.Navigator>
);

export default function App() {
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
            name="Main"
            component={TabNavigator}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="OrderDetail"
            component={OrderDetailScreen}
            options={{
              title: "Order Details",
              headerStyle: { backgroundColor: "#FF6B6B" },
              headerTintColor: "#fff",
            }}
          />
          <Stack.Screen
            name="AddProduct"
            component={AddProductScreen}
            options={{
              title: "Add Product",
              headerStyle: { backgroundColor: "#FF6B6B" },
              headerTintColor: "#fff",
            }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </Provider>
  );
}
