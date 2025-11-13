import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const RestaurantsScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Restaurants</Text>
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

export default RestaurantsScreen;
