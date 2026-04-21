import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import MapPicker from '../../components/MapPicker';
import { BASE_URL } from '../../constants';
import * as Location from 'expo-location';
import { useNavigation, useRouter } from 'expo-router';
import Layout from '../layout';

type Coordinate = {
  latitude: number;
  longitude: number;
};

const StoreRegistrationScreen = () => {
  const navigation = useNavigation<any>();
  const router = useRouter();
  const [step, setStep] = useState(1);

  const [storeName, setStoreName] = useState('');
  const [storeType, setStoreType] = useState('');
  const [storeDescription, setStoreDescription] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [mapslink, setMapslink] = useState('');
  const [locationId, setLocationId] = useState('L1'); // Default to Colombo
  const [location, setLocation] = useState<Coordinate | null>({ latitude: 6.9271, longitude: 79.8612 }); // Default to Colombo

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Denied', 'Location permission is required to register your store.');
          return;
        }

        const currentLocation = await Location.getCurrentPositionAsync({});
        setLocation({
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude,
        });
      } catch (error) {
        Alert.alert('Error', 'Failed to get location.');
      }
    })();
  }, []);

  const handleNext = () => {
    if (step === 1) {
      if (!storeName || !storeType || !contactNumber || !email || !password || !confirmPassword) {
        Alert.alert('Missing Fields', 'Please fill all required fields.');
        return;
      }
      if (password !== confirmPassword) {
        Alert.alert('Password Mismatch', 'Passwords do not match.');
        return;
      }
    }

    setStep((prev) => Math.min(prev + 1, 2));
  };

  const handleBack = () => {
    setStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!location) {
      Alert.alert('Missing Location', 'Location is required.');
      return;
    }

    const formData = {
      store_name: storeName,
      store_type: storeType,
      store_description: storeDescription,
      contact_number: contactNumber,
      email: email.toLowerCase(),
      password,
      latitude: location?.latitude || 0,
      longitude: location?.longitude || 0,
      mapslink,
      location_id: locationId,
    };

    try {
      const fetchUrl = `${BASE_URL}/api/register`;
      const response = await fetch(fetchUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      let data;
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        const text = await response.text();
        throw new Error(`Server returned HTML (Status ${response.status}): ${text.substring(0, 40)}...`);
      }

      if (response.ok) {
        Alert.alert('Success', data.message, [
          { text: 'OK', onPress: () => router.push('/feedback/LoginScreen') },
        ]);
      } else {
        Alert.alert('Registration Failed', data.message || 'Unable to register.');
      }
    } catch (error: any) {
      console.error("Registration Error:", error);
      Alert.alert(
        'Server Connection Error',
        `Details: ${error.message || 'Network request failed'}\n\nPlease ensure your PC and Phone are on the same WiFi.`
      );
    }
  };

  const renderStepIndicator = () => (
    <View style={styles.stepContainer}>
      {[1, 2].map((s) => (
        <TouchableOpacity
          key={s}
          onPress={() => setStep(s)}
          style={[styles.stepCircle, step === s && styles.activeStep]}>
          <Text style={[styles.stepText, step === s && styles.activeStepText]}>{s}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );



  return (
    <Layout>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Store Registration</Text>
        {renderStepIndicator()}

        {step === 1 && (
          <>
            <Text style={styles.label}>Store Name</Text>
            <TextInput style={styles.input} value={storeName} onChangeText={setStoreName} />

            <Text style={styles.label}>Store Type</Text>
            <TextInput style={styles.input} value={storeType} onChangeText={setStoreType} />

            <Text style={styles.label}>Contact Number</Text>
            <TextInput style={styles.input} value={contactNumber} onChangeText={setContactNumber} keyboardType="phone-pad" />

            <Text style={styles.label}>Email</Text>
            <TextInput style={styles.input} value={email} onChangeText={setEmail} keyboardType="email-address" />

            <Text style={styles.label}>Password</Text>
            <TextInput style={styles.input} value={password} onChangeText={setPassword} secureTextEntry />

            <Text style={styles.label}>Confirm Password</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
              />
              {confirmPassword && password === confirmPassword && (
                <Text style={{ marginLeft: 10, color: 'green', fontWeight: 'bold' }}>✅</Text>
              )}
            </View>
          </>
        )}

        {step === 2 && (
          <>
            <Text style={styles.label}>District / Operating Area</Text>
            <View style={{ borderWidth: 1, borderColor: '#aaa', borderRadius: 8, marginTop: 5, marginBottom: 10 }}>
              <Picker
                selectedValue={locationId}
                onValueChange={(itemValue) => setLocationId(itemValue)}
              >
                <Picker.Item label="Colombo" value="L1" />
                <Picker.Item label="Kandy" value="L2" />
                <Picker.Item label="Galle" value="L3" />
                <Picker.Item label="Gampaha" value="L4" />
              </Picker>
            </View>

            <Text style={styles.label}>Store Description</Text>
            <TextInput
              style={[styles.input, { height: 100 }]}
              value={storeDescription}
              onChangeText={setStoreDescription}
              multiline
              placeholder="Describe your services..."
            />

            <Text style={styles.label}>Google Maps Link</Text>
            <TextInput
              style={styles.input}
              value={mapslink}
              onChangeText={setMapslink}
              placeholder="Paste Google Maps URL here"
            />
            <Text style={styles.subLabel}>Copy the link from Google Maps app and paste here.</Text>
          </>
        )}

        <View style={styles.buttonGroup}>
          {step > 1 && (
            <TouchableOpacity style={styles.secondaryButton} onPress={handleBack}>
              <Text style={styles.secondaryText}>Back</Text>
            </TouchableOpacity>
          )}

          {step < 2 ? (
            <TouchableOpacity style={styles.submitButton} onPress={handleNext}>
              <Text style={styles.submitButtonText}>Next</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
              <Text style={styles.submitButtonText}>Register</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </Layout>
  );
};

const styles = StyleSheet.create({
  container: { padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 10 },

  stepContainer: { flexDirection: 'row', justifyContent: 'center', marginBottom: 20 },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 6,
  },
  activeStep: { backgroundColor: '#007bff' },
  stepText: { color: '#000', fontWeight: 'bold' },
  activeStepText: { color: '#fff' },

  label: { fontWeight: 'bold', marginTop: 10 },
  input: {
    borderWidth: 1,
    padding: 10,
    borderRadius: 8,
    marginTop: 5,
    marginBottom: 10,
    borderColor: '#aaa',
  },

  subLabel: { fontSize: 13, color: '#666', marginBottom: 10 },
  coordInputGroup: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  coordInput: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 8, backgroundColor: '#f9f9f9', textAlign: 'center' },
  miniLabel: { fontSize: 12, color: '#888', textAlign: 'center', marginBottom: 2 },
  map: { width: '100%', height: 300, borderRadius: 10 },

  buttonGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  submitButton: {
    backgroundColor: '#007bff',
    padding: 15,
    borderRadius: 10,
    flex: 1,
    alignItems: 'center',
    marginLeft: 10,
  },
  submitButtonText: { color: '#fff', fontWeight: 'bold' },

  secondaryButton: {
    backgroundColor: '#eee',
    padding: 15,
    borderRadius: 10,
    flex: 1,
    alignItems: 'center',
    marginRight: 10,
  },
  secondaryText: { color: '#333', fontWeight: 'bold' },
});

export default StoreRegistrationScreen;
