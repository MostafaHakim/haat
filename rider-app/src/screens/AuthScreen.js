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
    vehicleType: "motorcycle",
    licenseNumber: "",
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
    const { email, password, name, phone, vehicleType, licenseNumber } =
      formData;

    if (!email || !password) {
      Alert.alert("Error", "Please fill in all required fields");
      return;
    }

    if (!isLogin && (!name || !phone || !vehicleType || !licenseNumber)) {
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
          userType: "rider",
          vehicleType,
          licenseNumber,
        });
      }

      dispatch(loginSuccess(response.data));
      navigation.replace("Main");
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
          <Text style={styles.title}>Rider Portal</Text>
          <Text style={styles.subtitle}>
            {isLogin ? "Sign in to start delivering" : "Join our delivery team"}
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

              <Text style={styles.sectionTitle}>Vehicle Information</Text>
              <View style={styles.vehicleTypeContainer}>
                <Text style={styles.label}>Vehicle Type</Text>
                <View style={styles.vehicleOptions}>
                  {["motorcycle", "bicycle", "car"].map((type) => (
                    <TouchableOpacity
                      key={type}
                      style={[
                        styles.vehicleOption,
                        formData.vehicleType === type &&
                          styles.vehicleOptionActive,
                      ]}
                      onPress={() => handleInputChange("vehicleType", type)}
                    >
                      <Text
                        style={[
                          styles.vehicleOptionText,
                          formData.vehicleType === type &&
                            styles.vehicleOptionTextActive,
                        ]}
                      >
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <TextInput
                style={styles.input}
                placeholder="License Number"
                value={formData.licenseNumber}
                onChangeText={(text) =>
                  handleInputChange("licenseNumber", text)
                }
                autoCapitalize="characters"
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
              color="#4CAF50"
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
    color: "#4CAF50",
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
  vehicleTypeContainer: {
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  vehicleOptions: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  vehicleOption: {
    flex: 1,
    padding: 12,
    marginHorizontal: 4,
    backgroundColor: "#f8f8f8",
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  vehicleOptionActive: {
    backgroundColor: "#E8F5E8",
    borderColor: "#4CAF50",
  },
  vehicleOptionText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  vehicleOptionTextActive: {
    color: "#4CAF50",
    fontWeight: "600",
  },
  button: {
    backgroundColor: "#4CAF50",
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
    color: "#4CAF50",
    fontSize: 16,
  },
  loader: {
    marginVertical: 20,
  },
});

export default AuthScreen;
