import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

export default function StatsDisplay({ analysisData }) {
  if (!analysisData) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Workout Stats</Text>
        <Text style={styles.noData}>Start your workout to see stats</Text>
      </View>
    );
  }

  const getPhaseColor = (phase) => {
    switch (phase) {
      case 'up': return '#34C759';
      case 'down': return '#007AFF';
      default: return '#8E8E93';
    }
  };

  const getAngleColor = (angle) => {
    if (angle < 30) return '#34C759'; // Great range
    if (angle < 90) return '#FF9500'; // Good range
    if (angle > 160) return '#007AFF'; // Starting position
    return '#8E8E93'; // Neutral
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>Workout Stats</Text>
      
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{analysisData.repCount || 0}</Text>
          <Text style={styles.statLabel}>Reps</Text>
        </View>
        
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: getPhaseColor(analysisData.phase) }]}>
            {analysisData.phase || 'Ready'}
          </Text>
          <Text style={styles.statLabel}>Phase</Text>
        </View>
        
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: getAngleColor(analysisData.elbowAngle) }]}>
            {analysisData.elbowAngle ? `${Math.round(analysisData.elbowAngle)}°` : '--'}
          </Text>
          <Text style={styles.statLabel}>Elbow Angle</Text>
        </View>
      </View>

      {analysisData.feedback && analysisData.feedback.length > 0 && (
        <View style={styles.feedbackContainer}>
          <Text style={styles.feedbackTitle}>Latest Feedback</Text>
          {analysisData.feedback.slice(-3).map((feedback, index) => (
            <View key={index} style={styles.feedbackItem}>
              <Text style={styles.feedbackText}>{feedback}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={styles.tipsContainer}>
        <Text style={styles.tipsTitle}>Form Tips</Text>
        <View style={styles.tipItem}>
          <Text style={styles.tipEmoji}>💪</Text>
          <Text style={styles.tipText}>Squeeze at the top (angle &lt; 30°)</Text>
        </View>
        <View style={styles.tipItem}>
          <Text style={styles.tipEmoji}>🏋️</Text>
          <Text style={styles.tipText}>Keep elbows close to your body</Text>
        </View>
        <View style={styles.tipItem}>
          <Text style={styles.tipEmoji}>⚖️</Text>
          <Text style={styles.tipText}>Maintain stable shoulders</Text>
        </View>
        <View style={styles.tipItem}>
          <Text style={styles.tipEmoji}>🎯</Text>
          <Text style={styles.tipText}>Full range: 30° to 160°</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    padding: 20,
    margin: 10,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#1D1D1F',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 25,
  },
  statCard: {
    backgroundColor: '#F2F2F7',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 5,
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '500',
    textTransform: 'uppercase',
  },
  feedbackContainer: {
    backgroundColor: '#E3F2FD',
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
  },
  feedbackTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#1565C0',
  },
  feedbackItem: {
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  feedbackText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 22,
  },
  tipsContainer: {
    backgroundColor: '#F8F9FA',
    padding: 15,
    borderRadius: 12,
  },
  tipsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#495057',
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  tipEmoji: {
    fontSize: 20,
    marginRight: 12,
    width: 30,
  },
  tipText: {
    fontSize: 15,
    color: '#6C757D',
    flex: 1,
    lineHeight: 20,
  },
  noData: {
    textAlign: 'center',
    color: '#8E8E93',
    fontStyle: 'italic',
    fontSize: 16,
    marginTop: 20,
  },
});
