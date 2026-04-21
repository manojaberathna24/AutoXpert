import { View, Text, StyleSheet, ScrollView, Animated } from 'react-native';
import React, { useEffect, useRef } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from 'expo-linear-gradient';
import Layout from '../layout';

export default function Assessment_page() {
  const params = useLocalSearchParams();
  const { predicted_tire_depth_mm, tire_condition } = params;
  const progressAnim = useRef(new Animated.Value(0)).current;

  const depth = parseFloat(
    Array.isArray(predicted_tire_depth_mm) ? predicted_tire_depth_mm[0] : predicted_tire_depth_mm
  );
  const formattedTireDepth = depth.toFixed(2);
  const tireCondition = (Array.isArray(tire_condition) ? tire_condition[0] : tire_condition) || 'Unknown';

  // Normalize depth for a 0-100 percentage (assuming 1.6mm is 0% and 8.0mm is 100%)
  const minDepth = 1.6;
  const maxDepth = 8.0;
  const healthPercentage = Math.min(Math.max(((depth - minDepth) / (maxDepth - minDepth)) * 100, 0), 100);

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: healthPercentage,
      duration: 1500,
      useNativeDriver: false,
    }).start();
  }, [healthPercentage]);

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

  const getRecommendation = (condition) => {
    const recommendations = {
      low: {
        icon: 'alert-circle',
        title: 'Immediate Replacement',
        message: 'Your tire tread is critically low (below legal limits). Driving is unsafe.',
        color: '#ff4d4d',
        bgColor: '#fff5f5',
      },
      middle: {
        icon: 'warning',
        title: 'Caution: Wear Detected',
        message: 'Your tire is showing significant wear. Plan for replacement within 5,000 km.',
        color: '#ffa502',
        bgColor: '#fffaf0',
      },
      good: {
        icon: 'checkmark-circle',
        title: 'Good Condition',
        message: 'Tires are in good health. Ensure regular pressure checks and rotation.',
        color: '#2ed573',
        bgColor: '#f0fff4',
      },
      'very good': {
        icon: 'shield-checkmark',
        title: 'Excellent Condition',
        message: 'Your tires are like new. Enjoy optimal grip and safety.',
        color: '#1abc9c',
        bgColor: '#f0fdfa',
      },
    };
    return recommendations[condition.toLowerCase()] || recommendations['middle'];
  };

  const recommendation = getRecommendation(tireCondition);

  return (
    <Layout>
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <LinearGradient colors={['#ffffff', '#f8f9fa']} style={styles.card}>
          <Text style={styles.header}>Assessment Result</Text>
          
          {/* Health Meter */}
          <View style={styles.meterContainer}>
             <View style={styles.meterBackground}>
                <Animated.View 
                  style={[
                    styles.meterFill, 
                    { 
                      width: progressAnim.interpolate({
                        inputRange: [0, 100],
                        outputRange: ['0%', '100%']
                      }),
                      backgroundColor: recommendation.color
                    }
                  ]} 
                />
             </View>
             <View style={styles.meterLabelContainer}>
                <Text style={styles.meterLabel}>Remaining Life</Text>
                <Text style={[styles.meterValue, { color: recommendation.color }]}>{Math.round(healthPercentage)}%</Text>
             </View>
          </View>

          {/* Condition Badge */}
          <View style={[styles.badge, { backgroundColor: recommendation.color }]}>
            <Ionicons name={recommendation.icon} size={20} color="white" style={{marginRight: 8}} />
            <Text style={styles.badgeText}>{tireCondition.toUpperCase()}</Text>
          </View>

          {/* Stats Grid */}
          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
               <Text style={styles.statLabel}>Tread Depth</Text>
               <Text style={styles.statValue}>{formattedTireDepth}<Text style={styles.unit}>mm</Text></Text>
            </View>
            <View style={[styles.statBox, { borderLeftWidth: 1, borderLeftColor: '#eee' }]}>
               <Text style={styles.statLabel}>Est. Mileage</Text>
               <Text style={styles.statValue}>{Math.round(runningMileage / 1000)}k<Text style={styles.unit}>km</Text></Text>
            </View>
          </View>

          {/* Recommendation */}
          <View style={[styles.recommendationCard, { backgroundColor: recommendation.bgColor, borderTopColor: recommendation.color }]}>
            <Text style={[styles.recommendationTitle, { color: recommendation.color }]}>
              {recommendation.title}
            </Text>
            <Text style={styles.recommendationMessage}>{recommendation.message}</Text>
          </View>

          <View style={styles.infoBox}>
             <Ionicons name="information-circle-outline" size={18} color="#666" />
             <Text style={styles.infoText}>Predictions are based on AI analysis and should be verified with a physical gauge.</Text>
          </View>
        </LinearGradient>
      </ScrollView>
    </Layout>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    paddingVertical: 30,
    paddingHorizontal: 15,
    backgroundColor: '#f4f7f9',
  },
  card: {
    width: '100%',
    borderRadius: 24,
    padding: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#eee',
  },
  header: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1e293b',
    marginBottom: 25,
    letterSpacing: 0.5,
  },
  meterContainer: {
    width: '100%',
    marginBottom: 30,
  },
  meterBackground: {
    height: 12,
    backgroundColor: '#e2e8f0',
    borderRadius: 6,
    width: '100%',
    overflow: 'hidden',
    marginBottom: 10,
  },
  meterFill: {
    height: '100%',
    borderRadius: 6,
  },
  meterLabelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  meterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  meterValue: {
    fontSize: 18,
    fontWeight: '800',
  },
  badge: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 30,
    alignItems: 'center',
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  badgeText: {
    color: 'white',
    fontWeight: '800',
    fontSize: 16,
    letterSpacing: 1,
  },
  statsGrid: {
    flexDirection: 'row',
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 25,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94a3b8',
    marginBottom: 5,
    textTransform: 'uppercase',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1e293b',
  },
  unit: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94a3b8',
  },
  recommendationCard: {
    width: '100%',
    borderRadius: 16,
    padding: 20,
    borderTopWidth: 4,
    marginBottom: 20,
  },
  recommendationTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 8,
  },
  recommendationMessage: {
    fontSize: 15,
    color: '#475569',
    lineHeight: 22,
    fontWeight: '500',
  },
  infoBox: {
    flexDirection: 'row',
    paddingHorizontal: 10,
    alignItems: 'center',
  },
  infoText: {
    fontSize: 12,
    color: '#94a3b8',
    marginLeft: 8,
    flex: 1,
    fontStyle: 'italic',
  },
});
