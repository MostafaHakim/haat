import React from "react";
import { Provider } from "react-redux";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { store } from "./src/store/store";
import AuthScreen from "./src/screens/AuthScreen";
import DashboardScreen from "./src/screens/DashboardScreen";
import UsersScreen from "./src/screens/UsersScreen";
import RestaurantsScreen from "./src/screens/RestaurantsScreen";
import OrdersScreen from "./src/screens/OrdersScreen";
import RidersScreen from "./src/screens/RidersScreen";
import AnalyticsScreen from "./src/screens/AnalyticsScreen";
import UserDetailScreen from "./src/screens/UserDetailScreen";
import RestaurantDetailScreen from "./src/screens/RestaurantDetailScreen";
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
        } else if (route.name === "Users") {
          iconName = "people";
        } else if (route.name === "Restaurants") {
          iconName = "restaurant";
        } else if (route.name === "Orders") {
          iconName = "list-alt";
        } else if (route.name === "Riders") {
          iconName = "motorcycle";
        } else if (route.name === "Analytics") {
          iconName = "analytics";
        }

        return <Icon name={iconName} size={size} color={color} />;
      },
      tabBarActiveTintColor: "#2196F3",
      tabBarInactiveTintColor: "gray",
      headerStyle: {
        backgroundColor: "#2196F3",
      },
      headerTintColor: "#fff",
      headerTitleStyle: {
        fontWeight: "bold",
      },
    })}
  >
    <Tab.Screen name="Dashboard" component={DashboardScreen} />
    <Tab.Screen name="Users" component={UsersScreen} />
    <Tab.Screen name="Restaurants" component={RestaurantsScreen} />
    <Tab.Screen name="Orders" component={OrdersScreen} />
    <Tab.Screen name="Riders" component={RidersScreen} />
    <Tab.Screen name="Analytics" component={AnalyticsScreen} />
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
            name="UserDetail"
            component={UserDetailScreen}
            options={{
              title: "User Details",
              headerStyle: { backgroundColor: "#2196F3" },
              headerTintColor: "#fff",
            }}
          />
          <Stack.Screen
            name="RestaurantDetail"
            component={RestaurantDetailScreen}
            options={{
              title: "Restaurant Details",
              headerStyle: { backgroundColor: "#2196F3" },
              headerTintColor: "#fff",
            }}
          />
          <Stack.Screen
            name="OrderDetail"
            component={OrderDetailScreen}
            options={{
              title: "Order Details",
              headerStyle: { backgroundColor: "#2196F3" },
              headerTintColor: "#fff",
            }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </Provider>
  );
}
