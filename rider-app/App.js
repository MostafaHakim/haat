import React from "react";
import { Provider } from "react-redux";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { store } from "./src/store/store";
import AuthScreen from "./src/screens/AuthScreen";
import DashboardScreen from "./src/screens/DashboardScreen";
import AvailableOrdersScreen from "./src/screens/AvailableOrdersScreen";
import ActiveOrderScreen from "./src/screens/ActiveOrderScreen";
import EarningsScreen from "./src/screens/EarningsScreen";
import ProfileScreen from "./src/screens/ProfileScreen";
import OrderDetailScreen from "./src/screens/OrderDetailScreen";
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
        } else if (route.name === "Active") {
          iconName = "delivery-dining";
        } else if (route.name === "Earnings") {
          iconName = "attach-money";
        } else if (route.name === "Profile") {
          iconName = "person";
        }

        return <Icon name={iconName} size={size} color={color} />;
      },
      tabBarActiveTintColor: "#4CAF50",
      tabBarInactiveTintColor: "gray",
      headerStyle: {
        backgroundColor: "#4CAF50",
      },
      headerTintColor: "#fff",
      headerTitleStyle: {
        fontWeight: "bold",
      },
    })}
  >
    <Tab.Screen name="Dashboard" component={DashboardScreen} />
    <Tab.Screen name="Orders" component={AvailableOrdersScreen} />
    <Tab.Screen name="Active" component={ActiveOrderScreen} />
    <Tab.Screen name="Earnings" component={EarningsScreen} />
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
              headerStyle: { backgroundColor: "#4CAF50" },
              headerTintColor: "#fff",
            }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </Provider>
  );
}
