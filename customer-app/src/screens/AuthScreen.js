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
import { authAPI } from "../services/api";

const AuthScreen = ({ navigation }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
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
    const { email, password, name, phone } = formData;

    if (!email || !password) {
      Alert.alert("Error", "Please fill in all required fields");
      return;
    }

    if (!isLogin && (!name || !phone)) {
      Alert.alert("Error", "Please fill in all required fields");
      return;
    }

    dispatch(loginStart());

    try {
      let response;
      if (isLogin) {
        response = await authAPI.login({ email, password });
      } else {
        response = await authAPI.register({
          name,
          email,
          password,
          phone,
          userType: "customer",
        });
      }

      dispatch(loginSuccess(response.data));
      navigation.replace("Home");
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
          <Text style={styles.title}>Haat</Text>
          <Text style={styles.subtitle}>
            {isLogin ? "Sign in to your account" : "Create your account"}
          </Text>
        </View>

        <View style={styles.form}>
          {!isLogin && (
            <>
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
            </>
          )}

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
                {isLogin ? "Sign In" : "Sign Up"}
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
