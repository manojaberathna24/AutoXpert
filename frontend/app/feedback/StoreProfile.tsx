import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  Alert,
  ActivityIndicator
} from 'react-native';
import { AntDesign, MaterialIcons, FontAwesome } from '@expo/vector-icons';
import Layout from '../layout';
import { BASE_URL } from '../../constants';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';

type Product = {
  id: number;
  name: string;
  price: number;
  stock: boolean;
  quantity?: number; // Backend doesn't support quantity yet, keeping UI consistent or handling as extra
};

const StoreProfileScreen = () => {
  // Get storeId from params (passed from Login)
  const params = useLocalSearchParams();
  const storeId = params.storeId || 1; // Default to 1 if testing without login
  const router = useRouter();

  const [storeName, setStoreName] = useState('Loading...');
  const [storeContact, setStoreContact] = useState('');
  const [locationId, setLocationId] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: '', price: '', stock_status: 'Available' });

  // Fetch Store Data (Profile + Products)
  const fetchStoreData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/store/${storeId}`);
      if (response.ok) {
        const data = await response.json();
        setStoreName(data.name);
        setStoreContact(data.contact); 
        setLocationId(data.location_id || 'L1'); // Default to Colombo if not set
        setProducts(data.products || []);
      } else {
        Alert.alert("Error", "Failed to load store data");
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Network error fetching store");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (storeId) {
      fetchStoreData();
    }
  }, [storeId]);

  const addProduct = async () => {
    if (!newProduct.name || !newProduct.price) {
      Alert.alert("Error", "Name and Price are required.");
      return;
    }

    try {
      const response = await fetch(`${BASE_URL}/api/store/${storeId}/add-product`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newProduct.name,
          price: parseFloat(newProduct.price),
          stock: newProduct.stock_status // Sending status string
        }),
      });

      const data = await response.json();
      if (response.ok) {
        Alert.alert("Success", "Product added successfully!");
        setModalVisible(false);
        setNewProduct({ name: '', price: '', quantity: '1' });
        fetchStoreData(); // Refresh list
      } else {
        Alert.alert("Error", data.message || "Failed to add product");
      }
    } catch (error) {
      Alert.alert("Error", "Network error adding product");
    }
  };

  // Note: Backend doesn't support delete yet in standard endpoints provided, so unimplemented UI
  const deleteProduct = (productId: number) => {
    Alert.alert("Info", "Delete feature coming soon to backend!");
  };

  const toggleStockStatus = (productId: number) => {
    // TODO: Implement update endpoint if needed
    Alert.alert("Info", "Stock update coming soon!");
  };

  return (
    <Layout>
      <ScrollView style={styles.container}>
        {loading && <ActivityIndicator size="large" color="#007BFF" />}

        <View style={styles.card}>
          <Text style={styles.title}>Store Profile (ID: {storeId})</Text>
          <Text style={styles.storeLabel}>Store Name:</Text>
          <TextInput style={styles.storeInput} value={storeName} editable={false} />
          <Text style={styles.storeLabel}>Contact:</Text>
          <TextInput style={styles.storeInput} value={storeContact} editable={false} />
          
          <Text style={styles.storeLabel}>Operating District:</Text>
          <View style={{ borderWidth: 1, borderColor: '#ddd', borderRadius: 5, marginBottom: 15 }}>
            <Picker
              selectedValue={locationId}
              onValueChange={async (itemValue) => {
                setLocationId(itemValue);
                // Update on backend
                try {
                  await fetch(`${BASE_URL}/store/${storeId}/update-location`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ location_id: itemValue })
                  });
                } catch (e) {
                  console.error("Update failed", e);
                }
              }}
            >
              <Picker.Item label="Colombo" value="L1" />
              <Picker.Item label="Kandy" value="L2" />
              <Picker.Item label="Galle" value="L3" />
              <Picker.Item label="Gampaha" value="L4" />
            </Picker>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Products ({products.length})</Text>
          {products.map(product => (
            <View key={product.id} style={styles.productCard}>
              <View style={styles.productInfo}>
                <Text style={styles.productName}>{product.name}</Text>
                <Text style={styles.productPrice}>LKR {product.price}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 5 }}>
                   {product.stock.toString() === 'Available' ? <AntDesign name="checkcircle" size={16} color="green" /> : 
                    product.stock.toString() === 'Limited Stock' ? <AntDesign name="exclamationcircle" size={16} color="orange" /> :
                    <AntDesign name="closecircle" size={16} color="red" />}
                   <Text style={[styles.stockText, { marginLeft: 5 }]}>{product.stock}</Text>
                </View>
              </View>
            </View>
          ))}
          <TouchableOpacity style={styles.addButton} onPress={() => setModalVisible(true)}>
            <AntDesign name="pluscircle" size={24} color="white" />
            <Text style={styles.addButtonText}>Add Product</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={() => router.replace('/feedback/LoginScreen')}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Modal to add product */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Product</Text>
            <TextInput
              style={styles.storeInput}
              placeholder="Product Name"
              value={newProduct.name}
              onChangeText={text => setNewProduct({ ...newProduct, name: text })}
            />
            <TextInput
              style={styles.storeInput}
              placeholder="Price (LKR)"
              keyboardType="numeric"
              value={newProduct.price}
              onChangeText={text => setNewProduct({ ...newProduct, price: text })}
            />

            <Text style={styles.storeLabel}>Stock Availability:</Text>
            <View style={{ borderWidth: 1, borderColor: '#ddd', borderRadius: 5, marginBottom: 15, width: '100%' }}>
              <Picker
                selectedValue={newProduct.stock_status}
                onValueChange={(itemValue) => setNewProduct({ ...newProduct, stock_status: itemValue })}
              >
                <Picker.Item label="✅ In Stock" value="Available" />
                <Picker.Item label="⚠️ Limited Stock" value="Limited Stock" />
                <Picker.Item label="❌ Out of Stock" value="Out of Stock" />
              </Picker>
            </View>

            <TouchableOpacity 
               style={[styles.addButton, { backgroundColor: '#28a745', width: '100%', marginBottom: 10 }]}
               onPress={async () => {
                 let result = await ImagePicker.launchImageLibraryAsync({
                   mediaTypes: ImagePicker.MediaTypeOptions.Images,
                   allowsEditing: true,
                   quality: 0.5,
                 });
                 if (!result.canceled) {
                   Alert.alert("Success", "Image selected (Demo mode)");
                 }
               }}
            >
              <MaterialIcons name="image" size={20} color="white" />
              <Text style={styles.addButtonText}>Add Image</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.addButton} onPress={addProduct}>
              <Text style={styles.addButtonText}>Save Product</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelButton} onPress={() => setModalVisible(false)}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </Layout>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f4f4' },
  card: { backgroundColor: 'white', padding: 20, margin: 10, borderRadius: 12, elevation: 5 },
  title: { fontSize: 26, fontWeight: 'bold', color: '#333', marginBottom: 15 },
  storeLabel: { fontSize: 16, color: '#555', marginBottom: 5 },
  storeInput: { borderWidth: 1, borderColor: '#ddd', borderRadius: 5, padding: 10, marginBottom: 15, width: '100%', color: '#333' },
  sectionTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 10, color: '#333' },
  productCard: { flexDirection: 'row', marginBottom: 15, padding: 10, backgroundColor: '#fff', borderRadius: 10, elevation: 3 },
  productInfo: { flex: 1 },
  productName: { fontSize: 18, fontWeight: 'bold' },
  productPrice: { fontSize: 16, color: '#007BFF' },
  stockText: { fontSize: 16, color: '#555' },
  addButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#007BFF', padding: 10, borderRadius: 5, justifyContent: 'center', marginTop: 10 },
  addButtonText: { color: 'white', fontSize: 16, marginLeft: 10 },
  logoutButton: { backgroundColor: '#FF5733', padding: 15, margin: 20, borderRadius: 5, alignItems: 'center' },
  logoutText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  modalContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { backgroundColor: 'white', padding: 20, borderRadius: 10, width: '80%', alignItems: 'center' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 10 },
  cancelButton: { marginTop: 10, padding: 10, backgroundColor: '#FF5733', borderRadius: 5 },
  cancelButtonText: { color: 'white', fontSize: 16 },
});

export default StoreProfileScreen;
