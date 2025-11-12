import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const OrderDetailScreen = ({ route }) => {
  // const { orderId } = route.params;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Order Detail Screen</Text>
      {/* <Text>Order ID: {orderId}</Text> */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
});

export default OrderDetailScreen;
