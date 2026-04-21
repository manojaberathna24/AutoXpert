import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Keyboard,
  TouchableWithoutFeedback,
  Dimensions,
  SafeAreaView
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Header from '../components/header';
import Footer from '../components/footer';
import * as Animatable from 'react-native-animatable';
import { BASE_URL } from '../../constants';
import StarRating from 'react-native-star-rating-widget';

const { width } = Dimensions.get('window');

type FeedbackItem = {
  user: string;
  comment: string;
  sentiment: 'positive' | 'negative';
  rating?: number;
};

type StoreType = {
  id?: number;
  name: string;
  location: string;
  contact: string;
  rating: number;
  products: {
    id: string;
    name: string;
    price: string;
    image: string;
    stock: boolean;
  }[];
  feedback?: FeedbackItem[];
};

const StoreDetailsPage = () => {
  const { store } = useLocalSearchParams();
  const router = useRouter();

  // Initial parse from params
  const initialStore = React.useMemo(() =>
    store ? JSON.parse(store as string) : { products: [], feedback: [], name: 'Store', rating: 0 }
    , [store]);

  const [storeData, setStoreData] = useState<StoreType>(initialStore);
  const [loading, setLoading] = useState(false);

  // Fetch fresh data from backend
  const fetchStoreData = useCallback(async () => {
    try {
      // Use ID if available, defaulting to 1. Ideally passed in params.
      const id = (initialStore as any).id || 1;

      const response = await fetch(`${BASE_URL}/store/${id}`);
      if (response.ok) {
        const data = await response.json();
        // Ensure data structure matches StoreType
        setStoreData(data);
      }
    } catch (error) {
      console.error("Failed to fetch store data", error);
    }
  }, [initialStore]);

  useEffect(() => {
    // Fetch initial fresh data
    fetchStoreData();
  }, [fetchStoreData]);

  const commentRef = React.useRef<string>("");
  const [popupMessage, setPopupMessage] = useState('');
  const [popupType, setPopupType] = useState<'positive' | 'negative'>('positive');
  const [showPopup, setShowPopup] = useState(false);
  const [inputKey, setInputKey] = useState(0);
  const [userRating, setUserRating] = useState(0);

  const handleTextChange = useCallback((text: string) => {
    commentRef.current = text;
  }, []);

  const getPrediction = useCallback(async () => {
    const text = commentRef.current;
    if (!text.trim()) {
      Alert.alert('Error', 'Please enter a comment.');
      return;
    }

    try {
      // Use Store ID (safely cast or default)
      const storeId = (storeData as any).id || 1;

      const response = await fetch(`${BASE_URL}/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: text,
          store_id: storeId,
          rating: userRating
        }),
      });

      if (!response.ok) throw new Error('Prediction request failed');

      const data = await response.json();

      setPopupType(data.prediction === 'positive' ? 'positive' : 'negative');
      setPopupMessage(`Feedback: ${data.prediction} | Rating: ${userRating}⭐`);
      setShowPopup(true);

      commentRef.current = "";
      setUserRating(0);
      setInputKey(prev => prev + 1);
      Keyboard.dismiss();

      // Refresh data to show new rating/feedback immediately
      fetchStoreData();

      setTimeout(() => setShowPopup(false), 3000);
    } catch (error) {
      console.error('Prediction error:', error);
      Alert.alert('Error', 'Something went wrong while sending feedback.');
    }
  }, [userRating, storeData, fetchStoreData]);

  const totalFeedback = storeData.feedback?.length || 0;
  const positiveFeedback = storeData.feedback?.filter(f => f.sentiment === 'positive').length || 0;
  const negativeFeedback = totalFeedback - positiveFeedback;
  const feedbackPercentage = totalFeedback ? (positiveFeedback / totalFeedback) * 100 : 0;

  // Use the Backend Rating directly!
  const displayRating = storeData.rating || 0;

  const renderHeader = useMemo(() => (
    <View>
      <Text style={styles.title}>{storeData.name}</Text>
      <Text style={styles.detail}>📍 Location: {storeData.location}</Text>
      <Text style={styles.detail}>📞 Contact: {storeData.contact}</Text>
      <Text style={styles.detail}>⭐ Average Rating: {displayRating} / 5.0</Text>

      <Text style={styles.subTitle}>Feedback Summary</Text>
      <Text style={styles.feedbackSummary}>
        Total: {totalFeedback} | 👍: {positiveFeedback} | 👎: {negativeFeedback}
      </Text>

      {/* Show Read-Only Star Rating for the Store's Score */}
      <View style={{ alignItems: 'center', marginVertical: 10 }}>
        <StarRating
          rating={displayRating}
          starSize={30}
          enableSwiping={false}
          onChange={() => { }}
          color="#F59E0B"
        />
      </View>
      <Text style={styles.feedbackSummary}>{feedbackPercentage.toFixed(1)}% Positive Sentiment</Text>

      <Text style={styles.subTitle}>Available Products</Text>
    </View>
  ), [storeData, totalFeedback, positiveFeedback, negativeFeedback, feedbackPercentage, displayRating]);

  const footerComponent = useMemo(() => (
    <View>
      <Text style={styles.subTitle}>Rate & Add Feedback</Text>

      <View style={{ alignItems: 'flex-start', marginBottom: 10 }}>
        <Text style={{ fontSize: 16, marginBottom: 5, color: '#475569' }}>Your Rating:</Text>
        <StarRating
          rating={userRating}
          onChange={setUserRating}
          starSize={32}
          enableSwiping={true}
          color="#F59E0B"
        />
      </View>

      <TextInput
        key={inputKey}
        style={styles.input}
        placeholder="Enter your comment..."
        defaultValue=""
        onChangeText={handleTextChange}
        multiline
        blurOnSubmit={true}
      />
      <TouchableOpacity style={styles.feedbackButton} onPress={getPrediction}>
        <Text style={styles.feedbackText}>📝 Submit Feedback</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backText}>🔙 Go Back</Text>
      </TouchableOpacity>
    </View>
  ), [inputKey, handleTextChange, getPrediction, userRating]);

  const renderProduct = useCallback(({ item }: { item: StoreType['products'][0] }) => (
    <View style={styles.productCard}>
      <Image source={{ uri: item.image }} style={styles.productImage} />
      <View style={styles.productInfo}>
        <Text style={styles.productName}>{item.name}</Text>
        <Text style={styles.productPrice}>{item.price}</Text>
        <Text style={[styles.stockStatus, { color: item.stock ? '#10B981' : '#EF4444' }]}>
          {item.stock ? 'In Stock' : 'Out of Stock'}
        </Text>
      </View>
    </View>
  ), []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <Header />
      <View style={{ flex: 1 }}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={{ flex: 1 }}
            enabled={Platform.OS === 'ios'}
          >
            <FlatList
              data={storeData.products}
              keyExtractor={(item) => item.id}
              renderItem={renderProduct}
              ListHeaderComponent={renderHeader}
              ListFooterComponent={footerComponent}
              contentContainerStyle={{ paddingBottom: 30, paddingHorizontal: 16 }}
              removeClippedSubviews={false}
            />
          </KeyboardAvoidingView>
        </TouchableWithoutFeedback>
      </View>

      <Footer />

      {showPopup && (
        <Animatable.View
          animation="bounceIn"
          duration={800}
          style={[
            styles.popupContainer,
            { backgroundColor: popupType === 'positive' ? '#10B981' : '#EF4444' },
          ]}
        >
          <Text style={styles.popupText}>{popupMessage}</Text>
        </Animatable.View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  title: { fontSize: 26, fontWeight: 'bold', marginBottom: 10, color: '#1E293B' },
  detail: { fontSize: 18, marginBottom: 5, color: '#475569' },
  subTitle: { fontSize: 22, fontWeight: 'bold', marginTop: 20, color: '#1E293B' },

  productCard: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    padding: 12,
    borderRadius: 10,
    marginTop: 10,
    alignItems: 'center',
  },
  productImage: {
    width: 70,
    height: 70,
    borderRadius: 10,
    marginRight: 15,
  },
  productInfo: { flex: 1 },
  productName: { fontSize: 18, fontWeight: 'bold', color: '#334155' },
  productPrice: { fontSize: 16, color: '#64748B', marginVertical: 4 },
  stockStatus: { fontSize: 16, fontWeight: 'bold' },

  feedbackButton: {
    marginTop: 20,
    backgroundColor: '#10B981',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  feedbackText: { fontSize: 18, fontWeight: 'bold', color: '#fff' },

  backButton: {
    marginTop: 10,
    backgroundColor: '#2563EB',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  backText: { fontSize: 18, fontWeight: 'bold', color: '#fff' },

  feedbackSummary: {
    fontSize: 16,
    color: '#475569',
    marginTop: 10,
    textAlign: 'center',
  },

  input: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    padding: 10,
    marginTop: 10,
    marginBottom: 20,
    height: 100,
    textAlignVertical: 'top',
  },

  popupContainer: {
    position: 'absolute',
    bottom: 80,
    left: 20,
    right: 20,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  popupText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
});

export default StoreDetailsPage;
