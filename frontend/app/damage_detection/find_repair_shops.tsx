import React, { useState, useEffect } from 'react';
import {
  View, Text, Button, StyleSheet,
  FlatList, Modal, TouchableOpacity,
  ScrollView, Linking, ActivityIndicator,
  Alert, TextInput
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import Layout from '../layout';
import LottieView from 'lottie-react-native';
import { BASE_URL } from '../../constants';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';


type ShopDetails = {
  rank: number;
  shopName: string;
  address: string;
  phone: string;
  mapslink: string;
  latitude: number;
  longitude: number;
  distance?: number;
  rating?: number;
  location_name: string;
};

type Location = {
  id: string;
  name: string;
};

export default function find_repair_shops() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [shops, setShops] = useState<ShopDetails[]>([]);
  const [selectedShop, setSelectedShop] = useState<ShopDetails | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [shopProducts, setShopProducts] = useState<any[]>([]);
  const router = useRouter();
  const [loadingLocations, setLoadingLocations] = useState(true);
  const [loadingShops, setLoadingShops] = useState(false);
  const [userLocation, setUserLocation] = useState<any>(null);
  const [useNearby, setUseNearby] = useState(false);

  // 1. Load all locations on mount
  useEffect(() => {
    fetch(`${BASE_URL}/shop_locations`)
      .then(res => res.json())
      .then(data => setLocations(data))
      .catch(err => console.error(err))
      .finally(() => setLoadingLocations(false));
  }, []);

  // 2. Fetch shops based on location
  useEffect(() => {
    if (!selectedLocation) {
      setShops([]);
      return;
    }
    
    setLoadingShops(true);
    let url = `${BASE_URL}/repair_shops?location_id=${selectedLocation}`;

    fetch(url)
      .then(res => res.json())
      .then(data => setShops(data))
      .catch(err => {
          console.error("Fetch Error:", err);
          Alert.alert("Network Error", "Could not connect to server.");
      })
      .finally(() => setLoadingShops(false));
  }, [selectedLocation]);

  const handleUseMyLocation = async () => {
    setLoadingShops(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Location access is needed.');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({});
      setUserLocation(loc);
      setUseNearby(true);
    } catch (e) {
      Alert.alert('Error', 'Could not get location.');
    } finally {
      setLoadingShops(false);
    }
  };

  const handleShopClick = async (shop: ShopDetails) => {
    setSelectedShop(shop);
    setLoadingShops(true);
    try {
      // Fetch shop details specifically to get products
      const response = await fetch(`${BASE_URL}/api/shop-details?name=${encodeURIComponent(shop.shopName)}`);
      if (response.ok) {
         const data = await response.json();
         setShopProducts(data.products || []);
      } else {
         setShopProducts([]);
      }
    } catch (e) {
      setShopProducts([]);
    } finally {
      setLoadingShops(false);
      setModalVisible(true);
    }
  };

  const renderShopItem = ({ item }: { item: ShopDetails }) => (
    <TouchableOpacity
      style={styles.tableRow}
      onPress={() => handleShopClick(item)}
    >
      <View style={{ flex: 1 }}>
        <Text style={styles.shopNameText}>{item.shopName}</Text>
        <Text style={styles.shopSubText}>{item.address.substring(0, 40)}...</Text>
      </View>
      <View style={styles.ratingContainer}>
        <Text style={styles.ratingText}>⭐ {item.rating || '4.0'}</Text>
      </View>
    </TouchableOpacity>
  );

  if (loadingLocations) {
    return (
      <Layout>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#007bff" />
        </View>
      </Layout>
    );
  }

  const openMapsLink = (mapslink: string) => {
    if (mapslink) {
      Linking.openURL(mapslink).catch(() => Alert.alert('Error', 'An unexpected error occurred.'));
    } else {
      Alert.alert('Error', 'No map link available.');
    }
  };

  return (
    <Layout>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.container}>
          <Text style={styles.message}>We can help you find the best shops.</Text>

          {/* Location Picker */}
          <Text style={styles.label}>Please select Your Location</Text>

          <LottieView
            source={require('../../assets/location.json')}
            autoPlay
            loop
            style={styles.topAnimation}
          />

          <Text style={styles.message}>We can help you find the best shops.</Text>


          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={selectedLocation}
              onValueChange={value => setSelectedLocation(value)}
              style={styles.picker}
            >
              <Picker.Item label="Select a location" value={null} />
              {locations.map(loc => (
                <Picker.Item key={loc.id} label={loc.name} value={loc.id} />
              ))}
            </Picker>
          </View>

          {/* Shops List */}
          {loadingShops ? (
            <ActivityIndicator size="large" color="#007bff" style={{ marginTop: 20 }} />
          ) : (
            selectedLocation && (
              <View style={styles.rankingsContainer}>
                <Text style={styles.subtitle}>
                  Top {shops.length} Shops in {
                    locations.find(l => l.id === selectedLocation)?.name
                  }
                </Text>
                <FlatList
                  data={shops}
                  renderItem={renderShopItem}
                  keyExtractor={(item, index) => `${item.shopName}-${index}`}
                  scrollEnabled={false}
                  style={styles.table}
                />
              </View>
            )
          )}
        </View>
      </ScrollView>

      {/* Modal for Shop Details */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{selectedShop?.shopName}</Text>
            <Text style={styles.modalText}>Address: {selectedShop?.address}</Text>
            <Text style={styles.modalText}>Phone: {selectedShop?.phone}</Text>

            <Text style={styles.productHeader}>Available Spare Parts & Items:</Text>
            <ScrollView style={{ maxHeight: 200, width: '100%', marginBottom: 15 }}>
              {shopProducts && shopProducts.length > 0 ? (
                shopProducts.map((p, i) => (
                  <View key={i} style={styles.productItem}>
                    <Text style={styles.pName}>{p.name}</Text>
                    <Text style={styles.pPrice}>LKR {p.price}</Text>
                    <Text style={[styles.pStock, { color: p.stock === 'Available' ? 'green' : 'orange' }]}>{p.stock}</Text>
                  </View>
                ))
              ) : (
                <Text style={{ textAlign: 'center', color: '#888' }}>No items listed yet.</Text>
              )}
            </ScrollView>

            <View style={styles.buttonContainer}>
              <TouchableOpacity 
                style={styles.premiumButton}
                onPress={() => selectedShop && openMapsLink(selectedShop.mapslink)}
              >
                <MaterialIcons name="directions" size={24} color="white" />
                <Text style={styles.premiumButtonText}>View Directions</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.closeBtn} onPress={() => setModalVisible(false)}>
              <Text style={{ color: '#666', fontWeight: 'bold', marginTop: 15 }}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </Layout>
  );
}

const styles = StyleSheet.create({

  topAnimation: {
    width: 200,
    height: 200,
    alignSelf: 'center',
    marginBottom: 20,
  },

  animatedImage: {
    marginTop: -20,
    width: 250,
    height: 250,
  },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContainer: { flexGrow: 1 },
  container: { padding: 20 },
  message: { fontSize: 16, textAlign: 'center', marginBottom: 20 },
  label: { fontSize: 18, fontWeight: '600', marginBottom: 10, textAlign: 'center' },
  pickerContainer: {
    width: '100%',
    marginBottom: 10,
    backgroundColor: '#fff',
    borderRadius: 6,
  },
  picker: { width: '100%', height: 60 },
  rankingsContainer: { marginTop: 20 },
  subtitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 10, textAlign: 'center' },
  table: { borderWidth: 1, borderColor: '#ccc', borderRadius: 5 },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  tableCell: { fontSize: 16, textAlign: 'center' },
  shopNameCell: { flex: 1 },
  modalContainer: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    width: '80%', backgroundColor: '#fff',
    borderRadius: 10, padding: 20, alignItems: 'center',
  },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 15 },
  modalText: { fontSize: 16, marginBottom: 10 },
  buttonContainer: {
    flexDirection: 'row', justifyContent: 'space-around', width: '100%', marginTop: 20
  },
  nearbyButton: {
    backgroundColor: '#28a745',
    flexDirection: 'row',
    padding: 12,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  nearbyButtonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  shopNameText: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  shopSubText: { fontSize: 14, color: '#666' },
  ratingContainer: { flexDirection: 'row', alignItems: 'center' },
  ratingText: { marginLeft: 4, fontSize: 16, fontWeight: 'bold' },
  searchSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 25,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#ddd'
  },
  searchInput: {
    flex: 1,
    padding: 10,
    fontSize: 16
  },
  mapWrapper: {
    width: '100%',
    height: 300,
    marginBottom: 20,
    borderRadius: 15,
    overflow: 'hidden',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd'
  },
  mapTitle: {
    padding: 10,
    fontWeight: 'bold',
    textAlign: 'center',
    backgroundColor: '#f8f9fa'
  },
  mapView: {
    flex: 1
  },
  closeMap: {
    padding: 10,
    alignItems: 'center',
    backgroundColor: '#f8f9fa'
  },
  closeBtn: { marginTop: 20 },
  productHeader: { fontSize: 18, fontWeight: 'bold', marginTop: 15, marginBottom: 10, alignSelf: 'flex-start' },
  productItem: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    padding: 8, 
    borderBottomWidth: 1, 
    borderBottomColor: '#eee' 
  },
  pName: { fontWeight: 'bold', flex: 2 },
  pPrice: { flex: 1, color: '#007bff' },
  pStock: { flex: 1, fontSize: 12, textAlign: 'right' },
  premiumButton: {
    flexDirection: 'row',
    backgroundColor: '#007bff',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    width: '100%',
    marginTop: 10
  },
  premiumButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10
  }
});
