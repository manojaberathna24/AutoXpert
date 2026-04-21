import React, { useState, useRef } from "react";
import { View, Text, TextInput, Button, FlatList, Alert, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, SafeAreaView, Keyboard } from "react-native";
import Header from "../components/header";
import Footer from "../components/footer";

interface Review {
  key: string;
  text: string;
  prediction: string;
}

const SentimentAnalysis = () => {
  // Use REF for comment to prevent re-renders on typing
  const commentRef = useRef<string>("");

  const [result, setResult] = useState<string>("");
  const [positiveCount, setPositiveCount] = useState<number>(0);
  const [negativeCount, setNegativeCount] = useState<number>(0);
  const [reviews, setReviews] = useState<Review[]>([]);

  // State to clear input manually by forcing re-mount
  const [textInputKey, setTextInputKey] = useState(0);

  const handleTextChange = (text: string) => {
    commentRef.current = text;
  };

  const getPrediction = async () => {
    const text = commentRef.current;
    Keyboard.dismiss();

    if (!text.trim()) {
      Alert.alert("Error", "Please enter a comment.");
      return;
    }

    try {
      const response = await fetch("http://192.168.1.148:5000/predict", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: text }),
      });

      if (!response.ok) throw new Error("Failed to get prediction");

      const data = await response.json();
      setResult(`Prediction: ${data.prediction}`);

      // ✅ Fix count update
      if (data.prediction === "negative") {
        setNegativeCount((prevCount) => prevCount + 1);
      } else {
        setPositiveCount((prevCount) => prevCount + 1);
      }

      // ✅ Update review list
      setReviews((prevReviews) => [
        { key: Math.random().toString(), text: text, prediction: data.prediction },
        ...prevReviews,
      ]);

      // Clear input and reset ref
      commentRef.current = "";
      setTextInputKey(prev => prev + 1);
    } catch (error) {
      console.error("Error:", error);
      Alert.alert("Error", "Something went wrong!");
    }
  };

  return (
    <SafeAreaView style={styles.mainContainer}>
      <Header />
      <View style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
          <View style={styles.container}>
            <Text style={styles.title}>Sentiment Analysis</Text>
            <TextInput
              key={textInputKey} // Force component reset on submit to clear text
              style={styles.input}
              placeholder="Write your comment here..."
              defaultValue=""
              onChangeText={handleTextChange}
              multiline
              blurOnSubmit={true}
            />
            <Button title="Check Sentiment" onPress={getPrediction} />
            <Text style={styles.result}>{result}</Text>
            <Text style={styles.counts}>Positive: {positiveCount}</Text>
            <Text style={styles.counts}>Negative: {negativeCount}</Text>
            <Text style={styles.title}>Recent Reviews</Text>
            <FlatList
              data={reviews}
              scrollEnabled={false} // Use ScrollView for scrolling
              renderItem={({ item }) => (
                <Text style={styles.review}>
                  {item.text} - ({item.prediction})
                </Text>
              )}
            />
          </View>
        </ScrollView>
      </View>
      <Footer />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollContainer: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    alignItems: "center",
    padding: 20,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
  },
  input: {
    width: "100%",
    height: 100,
    borderColor: "#ccc",
    borderWidth: 1,
    padding: 10,
    marginBottom: 10,
    textAlignVertical: "top",
  },
  result: {
    marginTop: 10,
    fontWeight: "bold",
  },
  counts: {
    fontSize: 16,
    marginTop: 10,
  },
  review: {
    fontSize: 16,
    padding: 5,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
  },
});

export default SentimentAnalysis;
