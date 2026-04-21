import { View, Text, StyleSheet, ScrollView } from 'react-native';
import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from "@expo/vector-icons";
import Layout from '../layout';

export default function Assessment_page() {
  const params = useLocalSearchParams();
  const { predicted_tire_depth_mm, tire_condition } = params;

  const formattedTireDepth = parseFloat(
    Array.isArray(predicted_tire_depth_mm) ? predicted_tire_depth_mm[0] : predicted_tire_depth_mm
  ).toFixed(2);

  const tireCondition = Array.isArray(tire_condition) ? tire_condition[0] : tire_condition;

  const getRunningMileage = (condition) => {
    const mileageMap = {
      low: 10000,
      middle: 30000,
      good: 50000,
      'very good': 60000,
    };
    return mileageMap[condition.toLowerCase()] || 0;
  };

  const runningMileage = getRunningMileage(tireCondition);

  const getTireConditionMessage = (condition) => {
    const conditionLabelMap = {
      low: '⚠️ Running Condition is UNSAFE. Predictable Mileage: ',
      middle: 'Running Condition is NORMAL. Predictable Mileage: ',
      good: 'Running Condition is SAFE. Predictable Mileage: ',
      'very good': '✅ Running Condition is FULLY SAFE. Predictable Mileage: ',
    };

    const label = conditionLabelMap[condition.toLowerCase()] || 'Unknown Condition. Predictable Mileage: ';
    return `${label}${runningMileage.toLocaleString()} km`;
  };

  const getRecommendation = (condition) => {
    const recommendations = {
      low: {
        icon: 'alert-circle',
        title: 'Immediate Replacement Needed',
        message: 'Your tire tread is critically low. Replace immediately for safety.',
        color: '#e74c3c',
      },
      middle: {
        icon: 'time',
        title: 'Plan Replacement Soon',
        message: 'Your tire is showing wear. Schedule a replacement within the next few months.',
        color: '#f39c12',
      },
      good: {
        icon: 'checkmark-circle',
        title: 'Tire in Good Shape',
        message: 'Your tire has adequate tread depth. Continue regular inspections.',
        color: '#27ae60',
      },
      'very good': {
        icon: 'shield-checkmark',
        title: 'Excellent Condition',
        message: 'Your tire is in great condition with plenty of tread life remaining.',
        color: '#2ecc71',
      },
    };
    return recommendations[condition.toLowerCase()] || recommendations['middle'];
  };

  const tireConditionMessage = getTireConditionMessage(tireCondition);
  const recommendation = getRecommendation(tireCondition);

  // Color badge based on condition
  const badgeColors = {
    low: '#e74c3c', // red
    middle: '#f39c12', // orange
    good: '#27ae60', // green
    'very good': '#2ecc71', // bright green
  };

  const badgeColor = badgeColors[tireCondition.toLowerCase()] || '#7f8c8d'; // gray fallback

  return (
    <Layout>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.card}>
          <Text style={styles.header}>Tire Assessment Result</Text>

          <View style={[styles.badge, { backgroundColor: badgeColor }]}>
            <Text style={styles.badgeText}>{tireCondition.toUpperCase()}</Text>
          </View>

          <Text style={styles.message}>{tireConditionMessage}</Text>

          <View style={styles.depthContainer}>
            <Text style={styles.depthLabel}>Predicted Tire Depth:</Text>
            <Text style={styles.depthValue}>{formattedTireDepth} mm</Text>
          </View>

          {/* Recommendation Section */}
          <View style={[styles.recommendationCard, { borderLeftColor: recommendation.color }]}>
            <View style={styles.recommendationHeader}>
              <Ionicons name={recommendation.icon} size={24} color={recommendation.color} />
              <Text style={[styles.recommendationTitle, { color: recommendation.color }]}>
                {recommendation.title}
              </Text>
            </View>
            <Text style={styles.recommendationMessage}>{recommendation.message}</Text>
          </View>
        </View>
      </ScrollView>
    </Layout>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: '#f2f6fc',
  },
  card: {
    width: '90%',
    backgroundColor: 'white',
    borderRadius: 16,
    paddingVertical: 40,
    paddingHorizontal: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 10,
    alignItems: 'center',
  },
  header: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 20,
    color: '#34495e',
  },
  badge: {
    paddingHorizontal: 30,
    paddingVertical: 10,
    borderRadius: 50,
    marginBottom: 20,
  },
  badgeText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 22,
    letterSpacing: 1.2,
  },
  message: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    color: '#2c3e50',
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  depthContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 25,
  },
  depthLabel: {
    fontSize: 18,
    fontWeight: '500',
    color: '#7f8c8d',
    marginRight: 10,
  },
  depthValue: {
    fontSize: 22,
    fontWeight: '700',
    color: '#2980b9',
  },
  recommendationCard: {
    width: '100%',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 18,
    borderLeftWidth: 4,
    marginTop: 10,
  },
  recommendationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  recommendationTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginLeft: 10,
  },
  recommendationMessage: {
    fontSize: 15,
    color: '#555',
    lineHeight: 22,
  },
});
