import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const OrderDetailScreen = ({ route }) => {
  // const { orderId } = route.params;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Order Detail</Text>
      {/* <Text>Order ID: {orderId}</Text> */}
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

export default OrderDetailScreen;
