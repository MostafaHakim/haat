import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';

const AuthScreen = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Admin Panel</Text>
      <Button
        title="Login"
        onPress={() => navigation.replace('Main')}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
  },
});

export default AuthScreen;
