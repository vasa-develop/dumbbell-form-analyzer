import React, { useState } from 'react';
import { StyleSheet, Text, View, SafeAreaView, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import CameraView from './components/CameraView';
import StatsDisplay from './components/StatsDisplay';

export default function App() {
  const [analysisData, setAnalysisData] = useState(null);

  const handleAnalysisUpdate = (data: any) => {
    setAnalysisData(data);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="auto" />
      
      <View style={styles.header}>
        <Text style={styles.title}>Dumbbell Curl Analyzer</Text>
        <Text style={styles.subtitle}>Real-time form feedback</Text>
      </View>

      <View style={styles.cameraContainer}>
        <CameraView onAnalysisUpdate={handleAnalysisUpdate} />
      </View>

      <ScrollView style={styles.statsContainer}>
        <StatsDisplay analysisData={analysisData} />
        
        <View style={styles.instructions}>
          <Text style={styles.instructionsTitle}>Instructions:</Text>
          <Text style={styles.instructionText}>• Position yourself so your full upper body is visible</Text>
          <Text style={styles.instructionText}>• Hold a dumbbell in one or both hands</Text>
          <Text style={styles.instructionText}>• Perform slow, controlled curls</Text>
          <Text style={styles.instructionText}>• Listen for voice feedback on your form</Text>
          <Text style={styles.instructionText}>• Keep your core tight and elbows stable</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    backgroundColor: '#007AFF',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  subtitle: {
    fontSize: 16,
    color: 'white',
    opacity: 0.9,
  },
  cameraContainer: {
    flex: 2,
    margin: 10,
    borderRadius: 10,
    overflow: 'hidden',
  },
  statsContainer: {
    flex: 1,
  },
  instructions: {
    backgroundColor: 'white',
    padding: 20,
    margin: 10,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  instructionText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
});
