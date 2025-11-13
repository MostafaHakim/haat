import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const UserDetailScreen = ({ route }) => {
  // const { userId } = route.params;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>User Detail</Text>
      {/* <Text>User ID: {userId}</Text> */}
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

export default UserDetailScreen;
