import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import {
  loginStart,
  loginSuccess,
  loginFailure,
} from "../store/slices/authSlice";
import { authAPI, restaurantAPI } from "../services/api";

const AuthScreen = ({ navigation }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    restaurantName: "",
    address: "",
    cuisineType: "",
  });
  const dispatch = useDispatch();
  const { loading } = useSelector((state) => state.auth);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async () => {
    const {
      email,
      password,
      name,
      phone,
      restaurantName,
      address,
      cuisineType,
    } = formData;

    if (!email || !password) {
      Alert.alert("Error", "Please fill in all required fields");
      return;
    }

    if (
      !isLogin &&
      (!name || !phone || !restaurantName || !address || !cuisineType)
    ) {
      Alert.alert("Error", "Please fill in all required fields");
      return;
    }

    dispatch(loginStart());

    try {
      let response;
      if (isLogin) {
        response = await authAPI.login({ email, password });
        dispatch(loginSuccess(response.data));
        navigation.replace("Main");
      } else {
        // Register as seller
        response = await authAPI.register({
          name,
          email,
          password,
          phone,
          userType: "seller",
          restaurantName,
        });

        // Dispatch login success to store the token
        dispatch(loginSuccess(response.data));

        // Create restaurant in the background. Don't await it.
        restaurantAPI.create({
          name: restaurantName,
          address,
          cuisineType,
          latitude: 23.8103, // Default coordinates (Dhaka)
          longitude: 90.4125,
        }).catch(err => {
          console.error("Failed to create restaurant in background:", err);
          // Optionally, you could dispatch an action to notify the user
          // or set a flag to prompt them to complete their profile later.
        });
        
        navigation.replace("Main");
      }
    } catch (error) {
      const message = error.response?.data?.message || "Something went wrong";
      dispatch(loginFailure(message));
      Alert.alert("Error", message);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>Seller Portal</Text>
          <Text style={styles.subtitle}>
            {isLogin
              ? "Sign in to your restaurant"
              : "Create your restaurant account"}
          </Text>
        </View>

        <View style={styles.form}>
          {!isLogin && (
            <>
              <Text style={styles.sectionTitle}>Personal Information</Text>
              <TextInput
                style={styles.input}
                placeholder="Full Name"
                value={formData.name}
                onChangeText={(text) => handleInputChange("name", text)}
                autoCapitalize="words"
              />
              <TextInput
                style={styles.input}
                placeholder="Phone Number"
                value={formData.phone}
                onChangeText={(text) => handleInputChange("phone", text)}
                keyboardType="phone-pad"
              />

              <Text style={styles.sectionTitle}>Restaurant Information</Text>
              <TextInput
                style={styles.input}
                placeholder="Restaurant Name"
                value={formData.restaurantName}
                onChangeText={(text) =>
                  handleInputChange("restaurantName", text)
                }
              />
              <TextInput
                style={styles.input}
                placeholder="Restaurant Address"
                value={formData.address}
                onChangeText={(text) => handleInputChange("address", text)}
                multiline
              />
              <TextInput
                style={styles.input}
                placeholder="Cuisine Type (e.g., Bangladeshi, Chinese, Indian)"
                value={formData.cuisineType}
                onChangeText={(text) => handleInputChange("cuisineType", text)}
              />
            </>
          )}

          <Text style={styles.sectionTitle}>Account Information</Text>
          <TextInput
            style={styles.input}
            placeholder="Email Address"
            value={formData.email}
            onChangeText={(text) => handleInputChange("email", text)}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <TextInput
            style={styles.input}
            placeholder="Password"
            value={formData.password}
            onChangeText={(text) => handleInputChange("password", text)}
            secureTextEntry
          />

          {loading ? (
            <ActivityIndicator
              size="large"
              color="#FF6B6B"
              style={styles.loader}
            />
          ) : (
            <TouchableOpacity style={styles.button} onPress={handleSubmit}>
              <Text style={styles.buttonText}>
                {isLogin ? "Sign In" : "Create Account"}
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.switchButton}
            onPress={() => setIsLogin(!isLogin)}
          >
            <Text style={styles.switchText}>
              {isLogin
                ? "Don't have an account? Sign Up"
                : "Already have an account? Sign In"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 20,
  },
  header: {
    alignItems: "center",
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#FF6B6B",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
  form: {
    width: "100%",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginTop: 20,
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    fontSize: 16,
    backgroundColor: "#f9f9f9",
  },
  button: {
    backgroundColor: "#FF6B6B",
    borderRadius: 8,
    padding: 15,
    alignItems: "center",
    marginTop: 20,
    marginBottom: 15,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  switchButton: {
    alignItems: "center",
    padding: 10,
  },
  switchText: {
    color: "#FF6B6B",
    fontSize: 16,
  },
  loader: {
    marginVertical: 20,
  },
});

export default AuthScreen;
