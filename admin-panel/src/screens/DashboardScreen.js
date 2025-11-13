import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from "react-native";
import { useSelector, useDispatch } from "react-redux";
import { adminAPI } from "../services/api";
import {
  setDashboardStats,
  setRecentActivities,
} from "../store/slices/dashboardSlice";
import Icon from "react-native-vector-icons/MaterialIcons";
import { LineChart, BarChart, PieChart } from "react-native-chart-kit";

const { width } = Dimensions.get("window");

const DashboardScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [chartPeriod, setChartPeriod] = useState("week");
  const dispatch = useDispatch();
  const { stats, activities } = useSelector((state) => state.dashboard);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [statsResponse, activitiesResponse] = await Promise.all([
        adminAPI.getDashboardStats(),
        adminAPI.getRecentActivities(),
      ]);

      dispatch(setDashboardStats(statsResponse.data));
      dispatch(setRecentActivities(activitiesResponse.data));
    } catch (error) {
      console.error("Load dashboard error:", error);
      Alert.alert("Error", "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const StatCard = ({ title, value, subtitle, color, icon, onPress }) => (
    <TouchableOpacity
      style={[styles.statCard, { borderLeftColor: color }]}
      onPress={onPress}
    >
      <View style={styles.statHeader}>
        <View>
          <Text style={styles.statValue}>{value}</Text>
          <Text style={styles.statTitle}>{title}</Text>
          {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
        </View>
        <View style={[styles.statIcon, { backgroundColor: color }]}>
          <Icon name={icon} size={24} color="#fff" />
        </View>
      </View>
    </TouchableOpacity>
  );

  const ActivityItem = ({ activity }) => {
    const getActivityIcon = (type) => {
      const icons = {
        order: "receipt",
        user: "person",
        restaurant: "restaurant",
      };
      return icons[type] || "notifications";
    };

    const getActivityColor = (type) => {
      const colors = {
        order: "#4CAF50",
        user: "#2196F3",
        restaurant: "#FF9800",
      };
      return colors[type] || "#666";
    };

    return (
      <View style={styles.activityItem}>
        <View
          style={[
            styles.activityIcon,
            { backgroundColor: getActivityColor(activity.type) },
          ]}
        >
          <Icon name={getActivityIcon(activity.type)} size={16} color="#fff" />
        </View>
        <View style={styles.activityContent}>
          <Text style={styles.activityTitle}>{activity.title}</Text>
          <Text style={styles.activityDescription}>{activity.description}</Text>
          <Text style={styles.activityTime}>
            {new Date(activity.timestamp).toLocaleString()}
          </Text>
        </View>
      </View>
    );
  };

  const renderRevenueChart = () => {
    // Mock data for chart - in real app, this would come from API
    const chartData = {
      labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
      datasets: [
        {
          data: [12000, 15000, 18000, 13000, 22000, 19000, 25000],
          color: (opacity = 1) => `rgba(33, 150, 243, ${opacity})`,
        },
      ],
    };

    const chartConfig = {
      backgroundColor: "#ffffff",
      backgroundGradientFrom: "#ffffff",
      backgroundGradientTo: "#ffffff",
      decimalPlaces: 0,
      color: (opacity = 1) => `rgba(33, 150, 243, ${opacity})`,
      labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
      style: {
        borderRadius: 16,
      },
      propsForDots: {
        r: "4",
        strokeWidth: "2",
        stroke: "#2196F3",
      },
    };

    return (
      <View style={styles.chartContainer}>
        <View style={styles.chartHeader}>
          <Text style={styles.chartTitle}>Revenue Overview</Text>
          <View style={styles.periodSelector}>
            {["today", "week", "month", "year"].map((period) => (
              <TouchableOpacity
                key={period}
                style={[
                  styles.periodButton,
                  chartPeriod === period && styles.periodButtonActive,
                ]}
                onPress={() => setChartPeriod(period)}
              >
                <Text
                  style={[
                    styles.periodText,
                    chartPeriod === period && styles.periodTextActive,
                  ]}
                >
                  {period.charAt(0).toUpperCase() + period.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        <LineChart
          data={chartData}
          width={width - 40}
          height={220}
          chartConfig={chartConfig}
          bezier
          style={styles.chart}
        />
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Welcome Header */}
      <View style={styles.header}>
        <Text style={styles.welcomeText}>Admin Dashboard</Text>
        <Text style={styles.dateText}>
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </Text>
      </View>

      {/* Key Metrics */}
      <View style={styles.metricsSection}>
        <Text style={styles.sectionTitle}>Key Metrics</Text>
        <View style={styles.statsGrid}>
          <StatCard
            title="Total Revenue"
            value={`৳${stats.revenue?.month?.toLocaleString() || "0"}`}
            subtitle="This month"
            color="#4CAF50"
            icon="attach-money"
            onPress={() => navigation.navigate("Analytics")}
          />
          <StatCard
            title="Total Orders"
            value={stats.orders?.total?.toLocaleString() || "0"}
            subtitle={`${stats.orders?.today || "0"} today`}
            color="#2196F3"
            icon="receipt"
            onPress={() => navigation.navigate("Orders")}
          />
        </View>

        <View style={styles.statsGrid}>
          <StatCard
            title="Total Users"
            value={stats.users?.total?.toLocaleString() || "0"}
            subtitle={`${stats.users?.today || "0"} new today`}
            color="#FF9800"
            icon="people"
            onPress={() => navigation.navigate("Users")}
          />
          <StatCard
            title="Restaurants"
            value={stats.restaurants?.total?.toLocaleString() || "0"}
            subtitle={`${stats.restaurants?.active || "0"} active`}
            color="#9C27B0"
            icon="restaurant"
            onPress={() => navigation.navigate("Restaurants")}
          />
        </View>
      </View>

      {/* Revenue Chart */}
      {renderRevenueChart()}

      {/* Quick Stats */}
      <View style={styles.quickStatsSection}>
        <Text style={styles.sectionTitle}>Quick Stats</Text>
        <View style={styles.quickStatsGrid}>
          <View style={styles.quickStat}>
            <Text style={styles.quickStatValue}>
              {stats.riders?.total || "0"}
            </Text>
            <Text style={styles.quickStatLabel}>Total Riders</Text>
          </View>
          <View style={styles.quickStat}>
            <Text style={styles.quickStatValue}>
              {stats.riders?.active || "0"}
            </Text>
            <Text style={styles.quickStatLabel}>Active Riders</Text>
          </View>
          <View style={styles.quickStat}>
            <Text style={styles.quickStatValue}>
              {stats.orders?.week || "0"}
            </Text>
            <Text style={styles.quickStatLabel}>Orders This Week</Text>
          </View>
          <View style={styles.quickStat}>
            <Text style={styles.quickStatValue}>
              ৳{stats.revenue?.today?.toLocaleString() || "0"}
            </Text>
            <Text style={styles.quickStatLabel}>Today's Revenue</Text>
          </View>
        </View>
      </View>

      {/* Recent Activities */}
      <View style={styles.activitiesSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Activities</Text>
          <TouchableOpacity>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>

        {activities.length === 0 ? (
          <View style={styles.emptyActivities}>
            <Icon name="notifications" size={48} color="#ddd" />
            <Text style={styles.emptyText}>No recent activities</Text>
          </View>
        ) : (
          activities
            .slice(0, 5)
            .map((activity, index) => (
              <ActivityItem key={index} activity={activity} />
            ))
        )}
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
  loadingText: {
    marginTop: 10,
    color: "#666",
  },
  header: {
    backgroundColor: "#fff",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  dateText: {
    fontSize: 14,
    color: "#666",
  },
  metricsSection: {
    padding: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 15,
  },
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  statCard: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 12,
    width: "48%",
    borderLeftWidth: 4,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  statHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  statValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  statSubtitle: {
    fontSize: 12,
    color: "#999",
    marginTop: 2,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  chartContainer: {
    backgroundColor: "#fff",
    margin: 15,
    borderRadius: 12,
    padding: 15,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  chartHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  periodSelector: {
    flexDirection: "row",
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
    padding: 2,
  },
  periodButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  periodButtonActive: {
    backgroundColor: "#2196F3",
  },
  periodText: {
    fontSize: 12,
    color: "#666",
    fontWeight: "500",
  },
  periodTextActive: {
    color: "#fff",
  },
  chart: {
    borderRadius: 16,
  },
  quickStatsSection: {
    backgroundColor: "#fff",
    padding: 20,
    margin: 15,
    borderRadius: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  quickStatsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  quickStat: {
    width: "48%",
    alignItems: "center",
    padding: 15,
    backgroundColor: "#f8f8f8",
    borderRadius: 8,
    marginBottom: 10,
  },
  quickStatValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2196F3",
    marginBottom: 4,
  },
  quickStatLabel: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
  },
  activitiesSection: {
    backgroundColor: "#fff",
    margin: 15,
    borderRadius: 12,
    padding: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  seeAllText: {
    color: "#2196F3",
    fontWeight: "600",
  },
  activityItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  activityIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 2,
  },
  activityDescription: {
    fontSize: 12,
    color: "#666",
    marginBottom: 4,
  },
  activityTime: {
    fontSize: 10,
    color: "#999",
  },
  emptyActivities: {
    alignItems: "center",
    padding: 20,
  },
  emptyText: {
    fontSize: 14,
    color: "#666",
    marginTop: 8,
  },
});

export default DashboardScreen;
