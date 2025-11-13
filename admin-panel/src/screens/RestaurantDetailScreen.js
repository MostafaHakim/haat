import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const RestaurantDetailScreen = ({ route }) => {
  // const { restaurantId } = route.params;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Restaurant Detail</Text>
      {/* <Text>Restaurant ID: {restaurantId}</Text> */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
});

export default RestaurantDetailScreen;
