import React, { useEffect, useState } from "react";
import {
  View,
  ScrollView,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Switch,
  TextInput,
  Modal,
} from "react-native";
import { useSelector } from "react-redux";
import { productAPI } from "../services/api";
import Icon from "react-native-vector-icons/MaterialIcons";
import { useIsFocused } from "@react-navigation/native"; // ✅ ফোকাস ডিটেক্ট করার জন্য

const MenuScreen = ({ navigation }) => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [editForm, setEditForm] = useState({
    name: "",
    price: "",
    description: "",
    category: "",
    preparationTime: "",
    isAvailable: true,
  });

  const { user } = useSelector((state) => state.auth);
  const isFocused = useIsFocused(); // ✅ স্ক্রিন রিফোকাস হলে detect করবে

  // স্ক্রিন ফোকাস হলে API থেকে নতুন ডেটা লোড করবে
  useEffect(() => {
    if (isFocused) {
      loadMenu();
    }
  }, [isFocused]);

  useEffect(() => {
    filterProducts();
  }, [products, selectedCategory, searchQuery]);

  const loadMenu = async () => {
    try {
      setLoading(true);
      const response = await productAPI.getMyProducts({
        category: "all",
        availableOnly: false,
      });
      setProducts(response.data.products || []);
      setCategories(response.data.categories || []);
    } catch (error) {
      console.error("Load menu error:", error);
      Alert.alert("Error", "Failed to load menu");
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMenu();
    setRefreshing(false);
  };

  const filterProducts = () => {
    let filtered = products;

    if (selectedCategory !== "all") {
      filtered = filtered.filter(
        (product) => product.category === selectedCategory
      );
    }

    if (searchQuery) {
      filtered = filtered.filter(
        (product) =>
          product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          product.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredProducts(filtered);
  };

  const handleToggleAvailability = async (productId, currentStatus) => {
    try {
      const newStatus = !currentStatus;
      await productAPI.update(productId, { isAvailable: newStatus });
      setProducts((prevProducts) =>
        prevProducts.map((product) =>
          product._id === productId
            ? { ...product, isAvailable: newStatus }
            : product
        )
      );
      Alert.alert("Success", `Product ${newStatus ? "enabled" : "disabled"}`);
    } catch (error) {
      console.error("Toggle availability error:", error);
      Alert.alert("Error", "Failed to update product availability");
    }
  };

  const handleDeleteProduct = (product) => {
    Alert.alert(
      "Delete Product",
      `Are you sure you want to delete "${product.name}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => confirmDelete(product._id),
        },
      ]
    );
  };

  const confirmDelete = async (productId) => {
    try {
      await productAPI.delete(productId);
      setProducts((prevProducts) =>
        prevProducts.filter((product) => product._id !== productId)
      );
      Alert.alert("Success", "Product deleted successfully");
    } catch (error) {
      console.error("Delete product error:", error);
      Alert.alert("Error", "Failed to delete product");
    }
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setEditForm({
      name: product.name,
      price: product.price.toString(),
      description: product.description || "",
      category: product.category,
      preparationTime: product.preparationTime?.toString() || "15",
      isAvailable: product.isAvailable,
    });
    setEditModalVisible(true);
  };

  const handleUpdateProduct = async () => {
    if (!editForm.name || !editForm.price || !editForm.category) {
      Alert.alert("Error", "Please fill in all required fields");
      return;
    }

    try {
      const updateData = {
        name: editForm.name,
        price: parseFloat(editForm.price),
        description: editForm.description,
        category: editForm.category,
        preparationTime: parseInt(editForm.preparationTime) || 15,
        isAvailable: editForm.isAvailable,
      };

      await productAPI.update(editingProduct._id, updateData);

      setProducts((prevProducts) =>
        prevProducts.map((product) =>
          product._id === editingProduct._id
            ? { ...product, ...updateData }
            : product
        )
      );

      setEditModalVisible(false);
      setEditingProduct(null);
      Alert.alert("Success", "Product updated successfully");
    } catch (error) {
      console.error("Update product error:", error);
      Alert.alert("Error", "Failed to update product");
    }
  };

  const bulkToggleAvailability = async (enable) => {
    const productIds = filteredProducts.map((product) => product._id);
    try {
      await productAPI.bulkAvailability({
        productIds,
        isAvailable: enable,
      });

      setProducts((prevProducts) =>
        prevProducts.map((product) =>
          productIds.includes(product._id)
            ? { ...product, isAvailable: enable }
            : product
        )
      );

      Alert.alert("Success", `Products ${enable ? "enabled" : "disabled"}`);
    } catch (error) {
      console.error("Bulk update error:", error);
      Alert.alert("Error", "Failed to update products");
    }
  };

  const renderProductItem = ({ item }) => (
    <View style={styles.productCard}>
      <View style={styles.productImageContainer}>
        <Icon name="fastfood" size={40} color="#ddd" />
      </View>
      <View style={styles.productInfo}>
        <View style={styles.productHeader}>
          <Text style={styles.productName}>{item.name}</Text>
          <Text style={styles.productPrice}>৳{item.price}</Text>
        </View>
        <Text style={styles.productDescription} numberOfLines={2}>
          {item.description || "No description"}
        </Text>
        <View style={styles.productMeta}>
          <Text style={styles.productCategory}>{item.category}</Text>
          <Text style={styles.preparationTime}>
            ⏱ {item.preparationTime} min
          </Text>
        </View>
      </View>
      <View style={styles.productActions}>
        <Switch
          value={item.isAvailable}
          onValueChange={() =>
            handleToggleAvailability(item._id, item.isAvailable)
          }
          trackColor={{ false: "#767577", true: "#81b0ff" }}
          thumbColor={item.isAvailable ? "#FF6B6B" : "#f4f3f4"}
        />
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => handleEditProduct(item)}
          >
            <Icon name="edit" size={18} color="#666" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDeleteProduct(item)}
          >
            <Icon name="delete" size={18} color="#ff4444" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const CategoryFilter = ({ category }) => (
    <TouchableOpacity
      style={[
        styles.categoryButton,
        selectedCategory === category && styles.categoryButtonActive,
      ]}
      onPress={() => setSelectedCategory(category)}
    >
      <Text
        style={[
          styles.categoryText,
          selectedCategory === category && styles.categoryTextActive,
        ]}
      >
        {category === "all" ? "All" : category}
      </Text>
    </TouchableOpacity>
  );

  const EditProductModal = () => (
    <Modal
      visible={editModalVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setEditModalVisible(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Edit Product</Text>
            <TouchableOpacity onPress={() => setEditModalVisible(false)}>
              <Icon name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <TextInput
            style={styles.input}
            placeholder="Product Name"
            value={editForm.name}
            onChangeText={(text) =>
              setEditForm((prev) => ({ ...prev, name: text }))
            }
          />

          <TextInput
            style={styles.input}
            placeholder="Price"
            value={editForm.price}
            onChangeText={(text) =>
              setEditForm((prev) => ({ ...prev, price: text }))
            }
            keyboardType="decimal-pad"
          />

          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Description"
            value={editForm.description}
            onChangeText={(text) =>
              setEditForm((prev) => ({ ...prev, description: text }))
            }
            multiline
            numberOfLines={3}
          />

          <TextInput
            style={styles.input}
            placeholder="Category"
            value={editForm.category}
            onChangeText={(text) =>
              setEditForm((prev) => ({ ...prev, category: text }))
            }
          />

          <TextInput
            style={styles.input}
            placeholder="Preparation Time (minutes)"
            value={editForm.preparationTime}
            onChangeText={(text) =>
              setEditForm((prev) => ({ ...prev, preparationTime: text }))
            }
            keyboardType="number-pad"
          />

          <View style={styles.switchContainer}>
            <Text style={styles.switchLabel}>Available for ordering</Text>
            <Switch
              value={editForm.isAvailable}
              onValueChange={(value) =>
                setEditForm((prev) => ({ ...prev, isAvailable: value }))
              }
              trackColor={{ false: "#767577", true: "#81b0ff" }}
              thumbColor={editForm.isAvailable ? "#FF6B6B" : "#f4f3f4"}
            />
          </View>

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setEditModalVisible(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleUpdateProduct}
            >
              <Text style={styles.saveButtonText}>Save Changes</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#FF6B6B" />
        <Text style={styles.loadingText}>Loading menu...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header with Add Button */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Menu Management</Text>
          <Text style={styles.subtitle}>
            {products.length} product{products.length !== 1 ? "s" : ""} in menu
          </Text>
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate("AddProduct")}
        >
          <Icon name="add" size={24} color="#fff" />
          <Text style={styles.addButtonText}>Add Product</Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search products..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <Icon name="search" size={20} color="#666" style={styles.searchIcon} />
      </View>

      {/* Category Filters */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoriesContainer}
      >
        <CategoryFilter category="all" />
        {categories.map((category) => (
          <CategoryFilter key={category} category={category} />
        ))}
      </ScrollView>

      {/* Products List */}
      <FlatList
        data={filteredProducts}
        renderItem={renderProductItem}
        keyExtractor={(item) => item._id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.productsList}
      />

      <EditProductModal />
    </View>
  );
};

// 💅 Styles নিচে থাকবে (আগের মতোই)
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f8f8",
    padding: 15,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    color: "#666",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  addButton: {
    backgroundColor: "#FF6B6B",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  addButtonText: {
    color: "#fff",
    fontWeight: "600",
    marginLeft: 8,
  },
  searchContainer: {
    position: "relative",
    marginBottom: 15,
  },
  searchInput: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 15,
    paddingLeft: 45,
    fontSize: 16,
  },
  searchIcon: {
    position: "absolute",
    left: 15,
    top: 15,
  },
  bulkActions: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
  },
  bulkTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginRight: 10,
  },
  bulkButton: {
    backgroundColor: "#4CAF50",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginRight: 8,
  },
  disableButton: {
    backgroundColor: "#F44336",
  },
  bulkButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "500",
  },
  categoriesContainer: {
    marginBottom: 15,
  },
  categoryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: "#fff",
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  categoryButtonActive: {
    backgroundColor: "#FF6B6B",
    borderColor: "#FF6B6B",
  },
  categoryText: {
    color: "#666",
    fontWeight: "500",
  },
  categoryTextActive: {
    color: "#fff",
    fontWeight: "600",
  },
  productsList: {
    paddingBottom: 20,
  },
  productCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  productImageContainer: {
    width: 60,
    height: 60,
    backgroundColor: "#f8f8f8",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  productInfo: {
    flex: 1,
  },
  productHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 5,
  },
  productName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    flex: 1,
    marginRight: 10,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FF6B6B",
  },
  productDescription: {
    fontSize: 12,
    color: "#666",
    marginBottom: 8,
    lineHeight: 16,
  },
  productMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  productCategory: {
    fontSize: 12,
    color: "#666",
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  preparationTime: {
    fontSize: 12,
    color: "#666",
  },
  productActions: {
    alignItems: "center",
    marginLeft: 10,
  },
  actionButtons: {
    marginTop: 10,
  },
  editButton: {
    padding: 5,
    marginBottom: 5,
  },
  deleteButton: {
    padding: 5,
  },
  emptyContainer: {
    alignItems: "center",
    padding: 40,
    marginTop: 50,
  },
  emptyText: {
    fontSize: 18,
    color: "#666",
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
    marginBottom: 20,
  },
  clearFiltersButton: {
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 6,
  },
  clearFiltersText: {
    color: "#666",
    fontWeight: "500",
  },
  addFirstButton: {
    backgroundColor: "#FF6B6B",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 6,
  },
  addFirstButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    width: "100%",
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    fontSize: 16,
  },
  textArea: {
    height: 80,
    textAlignVertical: "top",
  },
  switchContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  switchLabel: {
    fontSize: 16,
    color: "#333",
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  cancelButton: {
    flex: 1,
    backgroundColor: "#f0f0f0",
    padding: 15,
    borderRadius: 8,
    marginRight: 10,
    alignItems: "center",
  },
  cancelButtonText: {
    color: "#666",
    fontWeight: "600",
  },
  saveButton: {
    flex: 1,
    backgroundColor: "#FF6B6B",
    padding: 15,
    borderRadius: 8,
    marginLeft: 10,
    alignItems: "center",
  },
  saveButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
});

export default MenuScreen;

// import React, { useEffect, useState } from "react";
// import {
//   View,
//   ScrollView,
//   Text,
//   StyleSheet,
//   FlatList,
//   TouchableOpacity,
//   Alert,
//   ActivityIndicator,
//   RefreshControl,
//   Switch,
//   TextInput,
//   Modal,
//   KeyboardAvoidingView,
//   Platform,
// } from "react-native";
// import { useSelector } from "react-redux";
// import { productAPI } from "../services/api";
// import Icon from "react-native-vector-icons/MaterialIcons";
// import { useIsFocused } from "@react-navigation/native";

// const MenuScreen = ({ navigation }) => {
//   const [products, setProducts] = useState([]);
//   const [categories, setCategories] = useState([]);
//   const [filteredProducts, setFilteredProducts] = useState([]);
//   const [selectedCategory, setSelectedCategory] = useState("all");
//   const [searchQuery, setSearchQuery] = useState("");
//   const [loading, setLoading] = useState(true);
//   const [refreshing, setRefreshing] = useState(false);

//   // Edit modal specific states (separate to prevent focus loss)
//   const [editModalVisible, setEditModalVisible] = useState(false);
//   const [editingProduct, setEditingProduct] = useState(null);
//   const [editName, setEditName] = useState("");
//   const [editPrice, setEditPrice] = useState("");
//   const [editDescription, setEditDescription] = useState("");
//   const [editCategory, setEditCategory] = useState("");
//   const [editPreparationTime, setEditPreparationTime] = useState("");
//   const [editIsAvailable, setEditIsAvailable] = useState(true);

//   const { user } = useSelector((state) => state.auth);
//   const isFocused = useIsFocused();

//   useEffect(() => {
//     if (isFocused) {
//       loadMenu();
//     }
//   }, [isFocused]);

//   useEffect(() => {
//     filterProducts();
//   }, [products, selectedCategory, searchQuery]);

//   const loadMenu = async () => {
//     try {
//       setLoading(true);
//       const response = await productAPI.getMyProducts({
//         category: "all",
//         availableOnly: false,
//       });
//       setProducts(response.data.products || []);
//       setCategories(response.data.categories || []);
//     } catch (error) {
//       console.error("Load menu error:", error);
//       Alert.alert("Error", "Failed to load menu");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const onRefresh = async () => {
//     setRefreshing(true);
//     await loadMenu();
//     setRefreshing(false);
//   };

//   const filterProducts = () => {
//     let filtered = products;

//     if (selectedCategory !== "all") {
//       filtered = filtered.filter(
//         (product) => product.category === selectedCategory
//       );
//     }

//     if (searchQuery) {
//       filtered = filtered.filter(
//         (product) =>
//           product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
//           (product.description || "")
//             .toLowerCase()
//             .includes(searchQuery.toLowerCase())
//       );
//     }

//     setFilteredProducts(filtered);
//   };

//   const handleToggleAvailability = async (productId, currentStatus) => {
//     try {
//       const newStatus = !currentStatus;
//       await productAPI.update(productId, { isAvailable: newStatus });
//       setProducts((prevProducts) =>
//         prevProducts.map((product) =>
//           product._id === productId
//             ? { ...product, isAvailable: newStatus }
//             : product
//         )
//       );
//       Alert.alert("Success", `Product ${newStatus ? "enabled" : "disabled"}`);
//     } catch (error) {
//       console.error("Toggle availability error:", error);
//       Alert.alert("Error", "Failed to update product availability");
//     }
//   };

//   const handleDeleteProduct = (product) => {
//     Alert.alert(
//       "Delete Product",
//       `Are you sure you want to delete "${product.name}"?`,
//       [
//         { text: "Cancel", style: "cancel" },
//         {
//           text: "Delete",
//           style: "destructive",
//           onPress: () => confirmDelete(product._id),
//         },
//       ]
//     );
//   };

//   const confirmDelete = async (productId) => {
//     try {
//       await productAPI.delete(productId);
//       setProducts((prevProducts) =>
//         prevProducts.filter((product) => product._id !== productId)
//       );
//       Alert.alert("Success", "Product deleted successfully");
//     } catch (error) {
//       console.error("Delete product error:", error);
//       Alert.alert("Error", "Failed to delete product");
//     }
//   };

//   const handleEditProduct = (product) => {
//     setEditingProduct(product);

//     // Set separate states
//     setEditName(product.name || "");
//     setEditPrice(product.price != null ? String(product.price) : "");
//     setEditDescription(product.description || "");
//     setEditCategory(product.category || "");
//     setEditPreparationTime(
//       product.preparationTime != null ? String(product.preparationTime) : "15"
//     );
//     setEditIsAvailable(
//       product.isAvailable != null ? product.isAvailable : true
//     );

//     setEditModalVisible(true);
//   };

//   const handleUpdateProduct = async () => {
//     if (!editName || !editPrice || !editCategory) {
//       Alert.alert("Error", "Please fill in all required fields");
//       return;
//     }

//     try {
//       const updateData = {
//         name: editName,
//         price: parseFloat(editPrice),
//         description: editDescription,
//         category: editCategory,
//         preparationTime: parseInt(editPreparationTime) || 15,
//         isAvailable: editIsAvailable,
//       };

//       await productAPI.update(editingProduct._id, updateData);

//       setProducts((prevProducts) =>
//         prevProducts.map((product) =>
//           product._id === editingProduct._id
//             ? { ...product, ...updateData }
//             : product
//         )
//       );

//       setEditModalVisible(false);
//       setEditingProduct(null);
//       Alert.alert("Success", "Product updated successfully");
//     } catch (error) {
//       console.error("Update product error:", error);
//       Alert.alert("Error", "Failed to update product");
//     }
//   };

//   const bulkToggleAvailability = async (enable) => {
//     const productIds = filteredProducts.map((product) => product._id);
//     try {
//       await productAPI.bulkAvailability({
//         productIds,
//         isAvailable: enable,
//       });

//       setProducts((prevProducts) =>
//         prevProducts.map((product) =>
//           productIds.includes(product._id)
//             ? { ...product, isAvailable: enable }
//             : product
//         )
//       );

//       Alert.alert("Success", `Products ${enable ? "enabled" : "disabled"}`);
//     } catch (error) {
//       console.error("Bulk update error:", error);
//       Alert.alert("Error", "Failed to update products");
//     }
//   };

//   const renderProductItem = ({ item }) => (
//     <View style={styles.productCard}>
//       <View style={styles.productImageContainer}>
//         <Icon name="fastfood" size={40} color="#ddd" />
//       </View>
//       <View style={styles.productInfo}>
//         <View style={styles.productHeader}>
//           <Text style={styles.productName}>{item.name}</Text>
//           <Text style={styles.productPrice}>৳{item.price}</Text>
//         </View>
//         <Text style={styles.productDescription} numberOfLines={2}>
//           {item.description || "No description"}
//         </Text>
//         <View style={styles.productMeta}>
//           <Text style={styles.productCategory}>{item.category}</Text>
//           <Text style={styles.preparationTime}>
//             ⏱ {item.preparationTime} min
//           </Text>
//         </View>
//       </View>
//       <View style={styles.productActions}>
//         <Switch
//           value={item.isAvailable}
//           onValueChange={() =>
//             handleToggleAvailability(item._id, item.isAvailable)
//           }
//           trackColor={{ false: "#767577", true: "#81b0ff" }}
//           thumbColor={item.isAvailable ? "#FF6B6B" : "#f4f3f4"}
//         />
//         <View style={styles.actionButtons}>
//           <TouchableOpacity
//             style={styles.editButton}
//             onPress={() => handleEditProduct(item)}
//           >
//             <Icon name="edit" size={18} color="#666" />
//           </TouchableOpacity>
//           <TouchableOpacity
//             style={styles.deleteButton}
//             onPress={() => handleDeleteProduct(item)}
//           >
//             <Icon name="delete" size={18} color="#ff4444" />
//           </TouchableOpacity>
//         </View>
//       </View>
//     </View>
//   );

//   const CategoryFilter = ({ category }) => (
//     <TouchableOpacity
//       style={[
//         styles.categoryButton,
//         selectedCategory === category && styles.categoryButtonActive,
//       ]}
//       onPress={() => setSelectedCategory(category)}
//     >
//       <Text
//         style={[
//           styles.categoryText,
//           selectedCategory === category && styles.categoryTextActive,
//         ]}
//       >
//         {category === "all" ? "All" : category}
//       </Text>
//     </TouchableOpacity>
//   );

//   const EditProductModal = () => (
//     <Modal
//       visible={editModalVisible}
//       animationType="slide"
//       transparent={true}
//       onRequestClose={() => setEditModalVisible(false)}
//     >
//       <KeyboardAvoidingView
//         behavior={Platform.OS === "ios" ? "padding" : undefined}
//         style={styles.modalContainer}
//       >
//         <View style={styles.modalContent}>
//           <View style={styles.modalHeader}>
//             <Text style={styles.modalTitle}>Edit Product</Text>
//             <TouchableOpacity onPress={() => setEditModalVisible(false)}>
//               <Icon name="close" size={24} color="#666" />
//             </TouchableOpacity>
//           </View>

//           <TextInput
//             style={styles.input}
//             placeholder="Product Name"
//             value={editName}
//             onChangeText={setEditName}
//             autoFocus
//             returnKeyType="next"
//           />

//           <TextInput
//             style={styles.input}
//             placeholder="Price"
//             value={editPrice}
//             onChangeText={(text) => setEditPrice(text)}
//             keyboardType="decimal-pad"
//           />

//           <TextInput
//             style={[styles.input, styles.textArea]}
//             placeholder="Description"
//             value={editDescription}
//             onChangeText={setEditDescription}
//             multiline
//             numberOfLines={3}
//             textAlignVertical="top"
//           />

//           <TextInput
//             style={styles.input}
//             placeholder="Category"
//             value={editCategory}
//             onChangeText={setEditCategory}
//           />

//           <TextInput
//             style={styles.input}
//             placeholder="Preparation Time (minutes)"
//             value={editPreparationTime}
//             onChangeText={(text) => setEditPreparationTime(text)}
//             keyboardType="number-pad"
//           />

//           <View style={styles.switchContainer}>
//             <Text style={styles.switchLabel}>Available for ordering</Text>
//             <Switch
//               value={editIsAvailable}
//               onValueChange={setEditIsAvailable}
//               trackColor={{ false: "#767577", true: "#81b0ff" }}
//               thumbColor={editIsAvailable ? "#FF6B6B" : "#f4f3f4"}
//             />
//           </View>

//           <View style={styles.modalActions}>
//             <TouchableOpacity
//               style={styles.cancelButton}
//               onPress={() => setEditModalVisible(false)}
//             >
//               <Text style={styles.cancelButtonText}>Cancel</Text>
//             </TouchableOpacity>

//             <TouchableOpacity
//               style={styles.saveButton}
//               onPress={handleUpdateProduct}
//             >
//               <Text style={styles.saveButtonText}>Save Changes</Text>
//             </TouchableOpacity>
//           </View>
//         </View>
//       </KeyboardAvoidingView>
//     </Modal>
//   );

//   if (loading) {
//     return (
//       <View style={styles.centered}>
//         <ActivityIndicator size="large" color="#FF6B6B" />
//         <Text style={styles.loadingText}>Loading menu...</Text>
//       </View>
//     );
//   }

//   return (
//     <View style={styles.container}>
//       {/* Header with Add Button */}
//       <View style={styles.header}>
//         <View>
//           <Text style={styles.title}>Menu Management</Text>
//           <Text style={styles.subtitle}>
//             {products.length} product{products.length !== 1 ? "s" : ""} in menu
//           </Text>
//         </View>
//         <TouchableOpacity
//           style={styles.addButton}
//           onPress={() => navigation.navigate("AddProduct")}
//         >
//           <Icon name="add" size={24} color="#fff" />
//           <Text style={styles.addButtonText}>Add Product</Text>
//         </TouchableOpacity>
//       </View>

//       {/* Search Bar */}
//       <View style={styles.searchContainer}>
//         <TextInput
//           style={styles.searchInput}
//           placeholder="Search products..."
//           value={searchQuery}
//           onChangeText={setSearchQuery}
//         />
//         <Icon name="search" size={20} color="#666" style={styles.searchIcon} />
//       </View>

//       {/* Category Filters */}
//       <ScrollView
//         horizontal
//         showsHorizontalScrollIndicator={false}
//         style={styles.categoriesContainer}
//       >
//         <CategoryFilter category="all" />
//         {categories.map((category) => (
//           <CategoryFilter key={category} category={category} />
//         ))}
//       </ScrollView>

//       {/* Bulk actions (example) */}
//       <View style={styles.bulkActions}>
//         <Text style={styles.bulkTitle}>Bulk actions:</Text>
//         <TouchableOpacity
//           style={styles.bulkButton}
//           onPress={() => bulkToggleAvailability(true)}
//         >
//           <Text style={styles.bulkButtonText}>Enable</Text>
//         </TouchableOpacity>
//         <TouchableOpacity
//           style={[styles.bulkButton, styles.disableButton]}
//           onPress={() => bulkToggleAvailability(false)}
//         >
//           <Text style={styles.bulkButtonText}>Disable</Text>
//         </TouchableOpacity>
//       </View>

//       {/* Products List */}
//       <FlatList
//         data={filteredProducts}
//         renderItem={renderProductItem}
//         keyExtractor={(item) => item._id}
//         refreshControl={
//           <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
//         }
//         showsVerticalScrollIndicator={false}
//         contentContainerStyle={styles.productsList}
//         ListEmptyComponent={() => (
//           <View style={styles.emptyContainer}>
//             <Text style={styles.emptyText}>No products found</Text>
//             <Text style={styles.emptySubtext}>
//               Add your first product to show it here.
//             </Text>
//             <TouchableOpacity
//               style={styles.addFirstButton}
//               onPress={() => navigation.navigate("AddProduct")}
//             >
//               <Text style={styles.addFirstButtonText}>Add Product</Text>
//             </TouchableOpacity>
//           </View>
//         )}
//       />

//       <EditProductModal />
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: "#f8f8f8",
//     padding: 15,
//   },
//   centered: {
//     flex: 1,
//     justifyContent: "center",
//     alignItems: "center",
//   },
//   loadingText: {
//     marginTop: 10,
//     color: "#666",
//   },
//   header: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//     marginBottom: 20,
//   },
//   title: {
//     fontSize: 24,
//     fontWeight: "bold",
//     color: "#333",
//   },
//   subtitle: {
//     fontSize: 14,
//     color: "#666",
//     marginTop: 4,
//   },
//   addButton: {
//     backgroundColor: "#FF6B6B",
//     flexDirection: "row",
//     alignItems: "center",
//     paddingHorizontal: 16,
//     paddingVertical: 10,
//     borderRadius: 8,
//   },
//   addButtonText: {
//     color: "#fff",
//     fontWeight: "600",
//     marginLeft: 8,
//   },
//   searchContainer: {
//     position: "relative",
//     marginBottom: 15,
//   },
//   searchInput: {
//     backgroundColor: "#fff",
//     borderWidth: 1,
//     borderColor: "#ddd",
//     borderRadius: 8,
//     padding: 15,
//     paddingLeft: 45,
//     fontSize: 16,
//   },
//   searchIcon: {
//     position: "absolute",
//     left: 15,
//     top: 15,
//   },
//   bulkActions: {
//     flexDirection: "row",
//     alignItems: "center",
//     backgroundColor: "#fff",
//     padding: 15,
//     borderRadius: 8,
//     marginBottom: 15,
//   },
//   bulkTitle: {
//     fontSize: 14,
//     fontWeight: "600",
//     color: "#333",
//     marginRight: 10,
//   },
//   bulkButton: {
//     backgroundColor: "#4CAF50",
//     paddingHorizontal: 12,
//     paddingVertical: 6,
//     borderRadius: 6,
//     marginRight: 8,
//   },
//   disableButton: {
//     backgroundColor: "#F44336",
//   },
//   bulkButtonText: {
//     color: "#fff",
//     fontSize: 12,
//     fontWeight: "500",
//   },
//   categoriesContainer: {
//     marginBottom: 15,
//   },
//   categoryButton: {
//     paddingHorizontal: 20,
//     paddingVertical: 10,
//     backgroundColor: "#fff",
//     borderRadius: 20,
//     marginRight: 10,
//     borderWidth: 1,
//     borderColor: "#ddd",
//   },
//   categoryButtonActive: {
//     backgroundColor: "#FF6B6B",
//     borderColor: "#FF6B6B",
//   },
//   categoryText: {
//     color: "#666",
//     fontWeight: "500",
//   },
//   categoryTextActive: {
//     color: "#fff",
//     fontWeight: "600",
//   },
//   productsList: {
//     paddingBottom: 20,
//   },
//   productCard: {
//     flexDirection: "row",
//     backgroundColor: "#fff",
//     borderRadius: 12,
//     padding: 15,
//     marginBottom: 10,
//     elevation: 2,
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 1 },
//     shadowOpacity: 0.1,
//     shadowRadius: 3,
//   },
//   productImageContainer: {
//     width: 60,
//     height: 60,
//     backgroundColor: "#f8f8f8",
//     borderRadius: 8,
//     justifyContent: "center",
//     alignItems: "center",
//     marginRight: 15,
//   },
//   productInfo: {
//     flex: 1,
//   },
//   productHeader: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "flex-start",
//     marginBottom: 5,
//   },
//   productName: {
//     fontSize: 16,
//     fontWeight: "bold",
//     color: "#333",
//     flex: 1,
//     marginRight: 10,
//   },
//   productPrice: {
//     fontSize: 16,
//     fontWeight: "bold",
//     color: "#FF6B6B",
//   },
//   productDescription: {
//     fontSize: 12,
//     color: "#666",
//     marginBottom: 8,
//     lineHeight: 16,
//   },
//   productMeta: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//   },
//   productCategory: {
//     fontSize: 12,
//     color: "#666",
//     backgroundColor: "#f0f0f0",
//     paddingHorizontal: 8,
//     paddingVertical: 2,
//     borderRadius: 4,
//   },
//   preparationTime: {
//     fontSize: 12,
//     color: "#666",
//   },
//   productActions: {
//     alignItems: "center",
//     marginLeft: 10,
//   },
//   actionButtons: {
//     marginTop: 10,
//   },
//   editButton: {
//     padding: 5,
//     marginBottom: 5,
//   },
//   deleteButton: {
//     padding: 5,
//   },
//   emptyContainer: {
//     alignItems: "center",
//     padding: 40,
//     marginTop: 50,
//   },
//   emptyText: {
//     fontSize: 18,
//     color: "#666",
//     marginTop: 16,
//     marginBottom: 8,
//   },
//   emptySubtext: {
//     fontSize: 14,
//     color: "#999",
//     textAlign: "center",
//     marginBottom: 20,
//   },
//   clearFiltersButton: {
//     backgroundColor: "#f0f0f0",
//     paddingHorizontal: 20,
//     paddingVertical: 10,
//     borderRadius: 6,
//   },
//   clearFiltersText: {
//     color: "#666",
//     fontWeight: "500",
//   },
//   addFirstButton: {
//     backgroundColor: "#FF6B6B",
//     paddingHorizontal: 20,
//     paddingVertical: 12,
//     borderRadius: 6,
//   },
//   addFirstButtonText: {
//     color: "#fff",
//     fontWeight: "600",
//   },
//   // Modal Styles
//   modalContainer: {
//     flex: 1,
//     justifyContent: "center",
//     alignItems: "center",
//     backgroundColor: "rgba(0, 0, 0, 0.5)",
//     padding: 20,
//   },
//   modalContent: {
//     backgroundColor: "#fff",
//     borderRadius: 12,
//     padding: 20,
//     width: "100%",
//     maxHeight: "80%",
//   },
//   modalHeader: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//     marginBottom: 20,
//   },
//   modalTitle: {
//     fontSize: 20,
//     fontWeight: "bold",
//     color: "#333",
//   },
//   input: {
//     borderWidth: 1,
//     borderColor: "#ddd",
//     borderRadius: 8,
//     padding: 12,
//     marginBottom: 15,
//     fontSize: 16,
//   },
//   textArea: {
//     height: 80,
//     textAlignVertical: "top",
//   },
//   switchContainer: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//     marginBottom: 20,
//   },
//   switchLabel: {
//     fontSize: 16,
//     color: "#333",
//   },
//   modalActions: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//   },
//   cancelButton: {
//     flex: 1,
//     backgroundColor: "#f0f0f0",
//     padding: 15,
//     borderRadius: 8,
//     marginRight: 10,
//     alignItems: "center",
//   },
//   cancelButtonText: {
//     color: "#666",
//     fontWeight: "600",
//   },
//   saveButton: {
//     flex: 1,
//     backgroundColor: "#FF6B6B",
//     padding: 15,
//     borderRadius: 8,
//     marginLeft: 10,
//     alignItems: "center",
//   },
//   saveButtonText: {
//     color: "#fff",
//     fontWeight: "600",
//   },
// });

// export default MenuScreen;
