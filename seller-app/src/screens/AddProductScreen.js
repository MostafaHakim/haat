// import React, { useState } from "react";
// import {
//   View,
//   Text,
//   StyleSheet,
//   ScrollView,
//   TextInput,
//   TouchableOpacity,
//   Alert,
//   ActivityIndicator,
//   Switch,
// } from "react-native";
// import { useSelector } from "react-redux";
// import { productAPI } from "../services/api";
// import Icon from "react-native-vector-icons/MaterialIcons";

// const AddProductScreen = ({ navigation }) => {
//   const [formData, setFormData] = useState({
//     name: "",
//     description: "",
//     price: "",
//     originalPrice: "",
//     category: "",
//     preparationTime: "15",
//     isVeg: true,
//     isAvailable: true,
//     ingredients: "",
//     tags: "",
//   });
//   const [loading, setLoading] = useState(false);
//   const { user } = useSelector((state) => state.auth);

//   const handleInputChange = (field, value) => {
//     setFormData((prev) => ({
//       ...prev,
//       [field]: value,
//     }));
//   };

//   const handleSubmit = async () => {
//     const { name, price, category } = formData;

//     if (!name.trim() || !price || !category.trim()) {
//       Alert.alert("Error", "Please fill in all required fields");
//       return;
//     }

//     if (isNaN(parseFloat(price)) || parseFloat(price) <= 0) {
//       Alert.alert("Error", "Please enter a valid price");
//       return;
//     }

//     setLoading(true);

//     try {
//       const productData = {
//         name: formData.name.trim(),
//         description: formData.description.trim(),
//         price: parseFloat(formData.price),
//         originalPrice: formData.originalPrice
//           ? parseFloat(formData.originalPrice)
//           : undefined,
//         category: formData.category.trim(),
//         preparationTime: parseInt(formData.preparationTime) || 15,
//         isVeg: formData.isVeg,
//         isAvailable: formData.isAvailable,
//         ingredients: formData.ingredients
//           ? formData.ingredients.split(",").map((i) => i.trim())
//           : [],
//         tags: formData.tags
//           ? formData.tags.split(",").map((t) => t.trim())
//           : [],
//       };

//       await productAPI.create(productData);

//       Alert.alert("Success", "Product added successfully!", [
//         {
//           text: "Add Another",
//           onPress: () => {
//             setFormData({
//               name: "",
//               description: "",
//               price: "",
//               originalPrice: "",
//               category: "",
//               preparationTime: "15",
//               isVeg: true,
//               isAvailable: true,
//               ingredients: "",
//               tags: "",
//             });
//           },
//         },
//         {
//           text: "View Menu",
//           onPress: () => navigation.navigate("Menu"),
//         },
//       ]);
//     } catch (error) {
//       console.error("Add product error:", error);
//       const message = error.response?.data?.message || "Failed to add product";
//       Alert.alert("Error", message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const FormField = ({
//     label,
//     value,
//     onChange,
//     placeholder,
//     required = false,
//     multiline = false,
//     keyboardType = "default",
//   }) => (
//     <View style={styles.fieldContainer}>
//       <Text style={styles.label}>
//         {label} {required && <Text style={styles.required}>*</Text>}
//       </Text>
//       <TextInput
//         style={[styles.input, multiline && styles.textArea]}
//         value={value}
//         onChangeText={onChange}
//         placeholder={placeholder}
//         multiline={multiline}
//         numberOfLines={multiline ? 4 : 1}
//         keyboardType={keyboardType}
//       />
//     </View>
//   );

//   const SwitchField = ({ label, value, onValueChange }) => (
//     <View style={styles.switchContainer}>
//       <Text style={styles.label}>{label}</Text>
//       <Switch
//         value={value}
//         onValueChange={onValueChange}
//         trackColor={{ false: "#767577", true: "#81b0ff" }}
//         thumbColor={value ? "#FF6B6B" : "#f4f3f4"}
//       />
//     </View>
//   );

//   return (
//     <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
//       <View style={styles.header}>
//         <Text style={styles.title}>Add New Product</Text>
//         <Text style={styles.subtitle}>
//           Fill in the details to add a new item to your menu
//         </Text>
//       </View>

//       <View style={styles.form}>
//         {/* Basic Information */}
//         <Text style={styles.sectionTitle}>Basic Information</Text>

//         <FormField
//           label="Product Name"
//           value={formData.name}
//           onChange={(text) => handleInputChange("name", text)}
//           placeholder="e.g., Chicken Biryani"
//           required
//         />

//         <FormField
//           label="Description"
//           value={formData.description}
//           onChange={(text) => handleInputChange("description", text)}
//           placeholder="Describe your product..."
//           multiline
//         />

//         <FormField
//           label="Category"
//           value={formData.category}
//           onChange={(text) => handleInputChange("category", text)}
//           placeholder="e.g., Biryani, Appetizers, Desserts"
//           required
//         />

//         {/* Pricing */}
//         <Text style={styles.sectionTitle}>Pricing</Text>

//         <View style={styles.row}>
//           <View style={styles.halfInput}>
//             <FormField
//               label="Price (৳)"
//               value={formData.price}
//               onChange={(text) => handleInputChange("price", text)}
//               placeholder="0.00"
//               required
//               keyboardType="decimal-pad"
//             />
//           </View>

//           <View style={styles.halfInput}>
//             <FormField
//               label="Original Price (৳)"
//               value={formData.originalPrice}
//               onChange={(text) => handleInputChange("originalPrice", text)}
//               placeholder="0.00"
//               keyboardType="decimal-pad"
//             />
//           </View>
//         </View>

//         {/* Preparation */}
//         <Text style={styles.sectionTitle}>Preparation</Text>

//         <FormField
//           label="Preparation Time (minutes)"
//           value={formData.preparationTime}
//           onChange={(text) => handleInputChange("preparationTime", text)}
//           placeholder="15"
//           keyboardType="number-pad"
//         />

//         <FormField
//           label="Ingredients"
//           value={formData.ingredients}
//           onChange={(text) => handleInputChange("ingredients", text)}
//           placeholder="e.g., Chicken, Rice, Spices (comma separated)"
//           multiline
//         />

//         {/* Tags */}
//         <FormField
//           label="Tags"
//           value={formData.tags}
//           onChange={(text) => handleInputChange("tags", text)}
//           placeholder="e.g., spicy, popular, healthy (comma separated)"
//         />

//         {/* Settings */}
//         <Text style={styles.sectionTitle}>Settings</Text>

//         <SwitchField
//           label="Vegetarian"
//           value={formData.isVeg}
//           onValueChange={(value) => handleInputChange("isVeg", value)}
//         />

//         <SwitchField
//           label="Available for ordering"
//           value={formData.isAvailable}
//           onValueChange={(value) => handleInputChange("isAvailable", value)}
//         />

//         {/* Submit Button */}
//         {loading ? (
//           <ActivityIndicator
//             size="large"
//             color="#FF6B6B"
//             style={styles.loader}
//           />
//         ) : (
//           <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
//             <Text style={styles.submitButtonText}>Add Product</Text>
//           </TouchableOpacity>
//         )}

//         {/* Cancel Button */}
//         <TouchableOpacity
//           style={styles.cancelButton}
//           onPress={() => navigation.goBack()}
//         >
//           <Text style={styles.cancelButtonText}>Cancel</Text>
//         </TouchableOpacity>
//       </View>
//     </ScrollView>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: "#f8f8f8",
//   },
//   header: {
//     backgroundColor: "#fff",
//     padding: 20,
//     borderBottomWidth: 1,
//     borderBottomColor: "#eee",
//   },
//   title: {
//     fontSize: 24,
//     fontWeight: "bold",
//     color: "#333",
//     marginBottom: 8,
//   },
//   subtitle: {
//     fontSize: 14,
//     color: "#666",
//   },
//   form: {
//     padding: 20,
//   },
//   sectionTitle: {
//     fontSize: 18,
//     fontWeight: "bold",
//     color: "#333",
//     marginTop: 20,
//     marginBottom: 15,
//   },
//   fieldContainer: {
//     marginBottom: 20,
//   },
//   label: {
//     fontSize: 16,
//     fontWeight: "600",
//     color: "#333",
//     marginBottom: 8,
//   },
//   required: {
//     color: "#FF6B6B",
//   },
//   input: {
//     backgroundColor: "#fff",
//     borderWidth: 1,
//     borderColor: "#ddd",
//     borderRadius: 8,
//     padding: 15,
//     fontSize: 16,
//   },
//   textArea: {
//     height: 100,
//     textAlignVertical: "top",
//   },
//   row: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//   },
//   halfInput: {
//     width: "48%",
//   },
//   switchContainer: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//     backgroundColor: "#fff",
//     padding: 15,
//     borderRadius: 8,
//     marginBottom: 10,
//     borderWidth: 1,
//     borderColor: "#ddd",
//   },
//   submitButton: {
//     backgroundColor: "#FF6B6B",
//     borderRadius: 8,
//     padding: 18,
//     alignItems: "center",
//     marginTop: 30,
//     marginBottom: 15,
//   },
//   submitButtonText: {
//     color: "#fff",
//     fontSize: 18,
//     fontWeight: "bold",
//   },
//   cancelButton: {
//     backgroundColor: "#f0f0f0",
//     borderRadius: 8,
//     padding: 18,
//     alignItems: "center",
//     marginBottom: 20,
//   },
//   cancelButtonText: {
//     color: "#666",
//     fontSize: 16,
//     fontWeight: "600",
//   },
//   loader: {
//     marginVertical: 30,
//   },
// });

// export default AddProductScreen;
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Switch,
} from "react-native";
import { useSelector } from "react-redux";
import { productAPI } from "../services/api";

// Moved FormField outside of AddProductScreen to prevent re-rendering issues
const FormField = ({
  label,
  value,
  onChange,
  placeholder,
  required = false,
  multiline = false,
  keyboardType = "default",
  loading,
}) => (
  <View style={styles.fieldContainer}>
    <Text style={styles.label}>
      {label} {required && <Text style={styles.required}>*</Text>}
    </Text>
    <TextInput
      style={[styles.input, multiline && styles.textArea]}
      value={value}
      onChangeText={onChange}
      placeholder={placeholder}
      placeholderTextColor="#999"
      multiline={multiline}
      numberOfLines={multiline ? 4 : 1}
      keyboardType={keyboardType}
      editable={!loading}
    />
  </View>
);

// Moved SwitchField outside of AddProductScreen to prevent re-rendering issues
const SwitchField = ({ label, value, onValueChange, loading }) => (
  <View style={styles.switchContainer}>
    <Text style={styles.label}>{label}</Text>
    <Switch
      value={value}
      onValueChange={onValueChange}
      trackColor={{ false: "#767577", true: "#81b0ff" }}
      thumbColor={value ? "#FF6B6B" : "#f4f3f4"}
      disabled={loading}
    />
  </View>
);

const AddProductScreen = ({ navigation }) => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    originalPrice: "",
    category: "",
    preparationTime: "15",
    isVeg: true,
    isAvailable: true,
    ingredients: "",
    tags: "",
  });
  const [loading, setLoading] = useState(false);
  const { user } = useSelector((state) => state.auth);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async () => {
    const { name, price, category } = formData;

    if (!name.trim() || !price || !category.trim()) {
      Alert.alert("Error", "Please fill in all required fields");
      return;
    }

    if (isNaN(parseFloat(price)) || parseFloat(price) <= 0) {
      Alert.alert("Error", "Please enter a valid price");
      return;
    }

    setLoading(true);

    try {
      const productData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        price: parseFloat(formData.price),
        originalPrice: formData.originalPrice
          ? parseFloat(formData.originalPrice)
          : undefined,
        category: formData.category.trim(),
        preparationTime: parseInt(formData.preparationTime) || 15,
        isVeg: formData.isVeg,
        isAvailable: formData.isAvailable,
        ingredients: formData.ingredients
          ? formData.ingredients
              .split(",")
              .map((i) => i.trim())
              .filter((i) => i)
          : [],
        tags: formData.tags
          ? formData.tags
              .split(",")
              .map((t) => t.trim())
              .filter((t) => t)
          : [],
      };

      await productAPI.create(productData);

      Alert.alert("Success", "Product added successfully!", [
        {
          text: "Add Another",
          onPress: () => {
            setFormData({
              name: "",
              description: "",
              price: "",
              originalPrice: "",
              category: "",
              preparationTime: "15",
              isVeg: true,
              isAvailable: true,
              ingredients: "",
              tags: "",
            });
          },
        },
        {
          text: "View Menu",
          onPress: () => navigation.navigate("Menu"),
        },
      ]);
    } catch (error) {
      console.error("Add product error:", error);
      const message = error.response?.data?.message || "Failed to add product";
      Alert.alert("Error", message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          disabled={loading}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Add New Product</Text>
        <Text style={styles.subtitle}>
          Fill in the details to add a new item to your menu
        </Text>
      </View>

      <View style={styles.form}>
        {/* Basic Information */}
        <Text style={styles.sectionTitle}>Basic Information</Text>

        <FormField
          label="Product Name"
          value={formData.name}
          onChange={(text) => handleInputChange("name", text)}
          placeholder="e.g., Chicken Biryani"
          required
          loading={loading}
        />

        <FormField
          label="Description"
          value={formData.description}
          onChange={(text) => handleInputChange("description", text)}
          placeholder="Describe your product..."
          multiline
          loading={loading}
        />

        <FormField
          label="Category"
          value={formData.category}
          onChange={(text) => handleInputChange("category", text)}
          placeholder="e.g., Biryani, Appetizers, Desserts"
          required
          loading={loading}
        />

        {/* Pricing */}
        <Text style={styles.sectionTitle}>Pricing</Text>

        <View style={styles.row}>
          <View style={styles.halfInput}>
            <FormField
              label="Price (৳)"
              value={formData.price}
              onChange={(text) => handleInputChange("price", text)}
              placeholder="0.00"
              required
              keyboardType="decimal-pad"
              loading={loading}
            />
          </View>

          <View style={styles.halfInput}>
            <FormField
              label="Original Price (৳)"
              value={formData.originalPrice}
              onChange={(text) => handleInputChange("originalPrice", text)}
              placeholder="0.00 (Optional)"
              keyboardType="decimal-pad"
              loading={loading}
            />
          </View>
        </View>

        {/* Preparation */}
        <Text style={styles.sectionTitle}>Preparation</Text>

        <FormField
          label="Preparation Time (minutes)"
          value={formData.preparationTime}
          onChange={(text) => handleInputChange("preparationTime", text)}
          placeholder="15"
          keyboardType="number-pad"
          loading={loading}
        />

        <FormField
          label="Ingredients"
          value={formData.ingredients}
          onChange={(text) => handleInputChange("ingredients", text)}
          placeholder="e.g., Chicken, Rice, Spices (comma separated)"
          multiline
          loading={loading}
        />

        <FormField
          label="Tags"
          value={formData.tags}
          onChange={(text) => handleInputChange("tags", text)}
          placeholder="e.g., spicy, popular, healthy (comma separated)"
          loading={loading}
        />

        {/* Settings */}
        <Text style={styles.sectionTitle}>Settings</Text>

        <SwitchField
          label="Vegetarian"
          value={formData.isVeg}
          onValueChange={(value) => handleInputChange("isVeg", value)}
          loading={loading}
        />

        <SwitchField
          label="Available for ordering"
          value={formData.isAvailable}
          onValueChange={(value) => handleInputChange("isAvailable", value)}
          loading={loading}
        />

        {/* Submit Button */}
        {loading ? (
          <ActivityIndicator
            size="large"
            color="#FF6B6B"
            style={styles.loader}
          />
        ) : (
          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleSubmit}
            disabled={loading}
          >
            <Text style={styles.submitButtonText}>Add Product</Text>
          </TouchableOpacity>
        )}

        {/* Cancel Button */}
        <TouchableOpacity
          style={[styles.cancelButton, loading && styles.cancelButtonDisabled]}
          onPress={() => navigation.goBack()}
          disabled={loading}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f8f8",
  },
  header: {
    backgroundColor: "#fff",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    paddingTop: 60,
  },
  backButton: {
    alignSelf: "flex-start",
    marginBottom: 10,
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  backButtonText: {
    fontSize: 16,
    color: "#FF6B6B",
    fontWeight: "600",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },
  form: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginTop: 20,
    marginBottom: 15,
    paddingBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  fieldContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  required: {
    color: "#FF6B6B",
  },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    color: "#333",
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  halfInput: {
    width: "48%",
  },
  switchContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  submitButton: {
    backgroundColor: "#FF6B6B",
    borderRadius: 8,
    padding: 18,
    alignItems: "center",
    marginTop: 30,
    marginBottom: 15,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  cancelButton: {
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
    padding: 18,
    alignItems: "center",
    marginBottom: 20,
  },
  cancelButtonDisabled: {
    opacity: 0.6,
  },
  cancelButtonText: {
    color: "#666",
    fontSize: 16,
    fontWeight: "600",
  },
  loader: {
    marginVertical: 30,
  },
});

export default AddProductScreen;
