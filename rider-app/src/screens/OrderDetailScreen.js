import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import Icon from 'react-native-vector-icons/MaterialIcons';

const OrderDetailScreen = ({ route, navigation }) => {
  // Mock data for demonstration. In a real app, you'd get this from route.params
  const order = route.params?.order || {
    id: 'ORD123',
    customerName: 'John Doe',
    deliveryAddress: '123 Main St, Anytown, USA',
    restaurantName: 'The Burger Joint',
    restaurantAddress: '456 Oak Ave, Anytown, USA',
    items: [
      { name: 'Classic Burger', quantity: 1 },
      { name: 'Fries', quantity: 1 },
    ],
    total: 15.99,
    restaurantLocation: {
      latitude: 37.78825,
      longitude: -122.4324,
    },
    deliveryLocation: {
      latitude: 37.7749,
      longitude: -122.4194,
    },
  };

  const handleAcceptOrder = () => {
    // Logic to accept the order
    console.log('Order accepted');
    navigation.goBack();
  };

  const handleDeclineOrder = () => {
    // Logic to decline the order
    console.log('Order declined');
    navigation.goBack();
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.mapContainer}>
        <MapView
          style={styles.map}
          initialRegion={{
            latitude: 37.78825,
            longitude: -122.4324,
            latitudeDelta: 0.0922,
            longitudeDelta: 0.0421,
          }}
        >
          <Marker coordinate={order.restaurantLocation} title={order.restaurantName} pinColor="blue" />
          <Marker coordinate={order.deliveryLocation} title={order.customerName} pinColor="green" />
        </MapView>
      </View>

      <View style={styles.detailsContainer}>
        <Text style={styles.header}>Order Details</Text>

        <View style={styles.detailItem}>
          <Icon name="person" size={20} color="#555" />
          <Text style={styles.detailText}>{order.customerName}</Text>
        </View>

        <View style={styles.detailItem}>
          <Icon name="home" size={20} color="#555" />
          <Text style={styles.detailText}>{order.deliveryAddress}</Text>
        </View>

        <View style={styles.detailItem}>
          <Icon name="restaurant" size={20} color="#555" />
          <Text style={styles.detailText}>{order.restaurantName}</Text>
        </View>

        <View style={styles.detailItem}>
          <Icon name="list" size={20} color="#555" />
          <View>
            {order.items.map((item, index) => (
              <Text key={index} style={styles.detailText}>
                {item.quantity}x {item.name}
              </Text>
            ))}
          </View>
        </View>

        <View style={styles.totalContainer}>
          <Text style={styles.totalText}>Total:</Text>
          <Text style={styles.totalAmount}>${order.total.toFixed(2)}</Text>
        </View>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={[styles.button, styles.acceptButton]} onPress={handleAcceptOrder}>
          <Text style={styles.buttonText}>Accept Order</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, styles.declineButton]} onPress={handleDeclineOrder}>
          <Text style={styles.buttonText}>Decline Order</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  mapContainer: {
    height: 250,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  detailsContainer: {
    padding: 20,
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: -20,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  detailText: {
    marginLeft: 15,
    fontSize: 16,
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  totalText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
  },
  button: {
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  acceptButton: {
    backgroundColor: '#4CAF50',
  },
  declineButton: {
    backgroundColor: '#f44336',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default OrderDetailScreen;
