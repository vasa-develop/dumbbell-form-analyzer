import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Alert } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { PoseDetectionService } from '../services/PoseDetectionService';
import { FormAnalyzer } from '../services/FormAnalyzer';
import { VoiceFeedbackService } from '../services/VoiceFeedbackService';

export default function CameraViewComponent({ onAnalysisUpdate }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisData, setAnalysisData] = useState(null);
  const [poseDetected, setPoseDetected] = useState(false);
  
  const poseDetectionService = useRef(new PoseDetectionService());
  const formAnalyzer = useRef(new FormAnalyzer());
  const voiceFeedbackService = useRef(new VoiceFeedbackService());
  const analysisInterval = useRef(null);
  const cameraRef = useRef(null);

  useEffect(() => {
    initializePoseDetection();
    return () => {
      stopAnalysis();
      poseDetectionService.current.dispose();
    };
  }, []);

  const initializePoseDetection = async () => {
    try {
      console.log('Initializing pose detection service...');
      await poseDetectionService.current.initialize();
      console.log('Pose detection service ready');
    } catch (error) {
      console.error('Failed to initialize pose detection:', error);
      Alert.alert('Error', 'Failed to initialize pose detection. Please restart the app.');
    }
  };

  const startAnalysis = async () => {
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        Alert.alert('Permission Required', 'Camera access is required for pose detection.');
        return;
      }
    }

    try {
      setIsAnalyzing(true);
      voiceFeedbackService.current.speak('Starting curl analysis. Position yourself in front of the camera.');
      
      analysisInterval.current = setInterval(async () => {
        await analyzeFrame();
      }, 100);
    } catch (error) {
      console.error('Failed to start analysis:', error);
      Alert.alert('Error', 'Failed to start analysis. Please try again.');
      setIsAnalyzing(false);
    }
  };

  const stopAnalysis = () => {
    setIsAnalyzing(false);
    setPoseDetected(false);
    if (analysisInterval.current) {
      clearInterval(analysisInterval.current);
      analysisInterval.current = null;
    }
    voiceFeedbackService.current.stop();
    voiceFeedbackService.current.speak('Analysis stopped.');
  };

  const analyzeFrame = async () => {
    try {
      if (!cameraRef.current || !isAnalyzing) return;

      const imageUri = await cameraRef.current.takePictureAsync({
        quality: 0.3,
        base64: false,
        skipProcessing: true,
      });

      if (!imageUri) return;

      const pose = await poseDetectionService.current.detectPose(imageUri.uri);
      
      if (pose && pose.keypoints) {
        setPoseDetected(true);
        const analysis = formAnalyzer.current.analyzeCurlForm(pose.keypoints);
        setAnalysisData(analysis);
        onAnalysisUpdate?.(analysis);

        if (analysis.feedback && analysis.feedback.length > 0) {
          const latestFeedback = analysis.feedback[analysis.feedback.length - 1];
          voiceFeedbackService.current.speak(latestFeedback);
        }
      } else {
        setPoseDetected(false);
      }
    } catch (error) {
      console.error('Frame analysis error:', error);
    }
  };

  const resetAnalyzer = () => {
    formAnalyzer.current.reset();
    setAnalysisData(null);
    setPoseDetected(false);
    voiceFeedbackService.current.speak('Form analyzer has been reset. Ready for new workout.');
  };

  const toggleVoiceFeedback = () => {
    const currentState = voiceFeedbackService.current.isEnabled;
    voiceFeedbackService.current.setEnabled(!currentState);
    const message = !currentState ? 'Voice feedback enabled' : 'Voice feedback disabled';
    Alert.alert('Voice Feedback', message);
  };

  if (!permission) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>Loading camera...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>Camera access is required for pose detection</Text>
        <TouchableOpacity onPress={requestPermission} style={styles.button}>
          <Text style={styles.buttonText}>Grant Camera Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView 
        style={styles.camera} 
        facing="front"
        ref={cameraRef}
      >
        <View style={styles.overlay}>
          {/* Status indicators */}
          <View style={styles.statusContainer}>
            <View style={[styles.statusIndicator, poseDetected ? styles.poseDetected : styles.poseNotDetected]}>
              <Text style={styles.statusText}>
                {poseDetected ? 'Pose Detected' : 'No Pose'}
              </Text>
            </View>
            {isAnalyzing && (
              <View style={styles.statusIndicator}>
                <Text style={styles.statusText}>Analyzing...</Text>
              </View>
            )}
          </View>

          {/* Controls */}
          <View style={styles.controls}>
            <TouchableOpacity
              style={[styles.button, isAnalyzing ? styles.stopButton : styles.startButton]}
              onPress={isAnalyzing ? stopAnalysis : startAnalysis}
            >
              <Text style={styles.buttonText}>
                {isAnalyzing ? 'Stop Analysis' : 'Start Analysis'}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.resetButton} onPress={resetAnalyzer}>
              <Text style={styles.buttonText}>Reset</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.voiceButton} onPress={toggleVoiceFeedback}>
              <Text style={styles.buttonText}>🔊</Text>
            </TouchableOpacity>
          </View>
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'space-between',
    padding: 20,
  },
  statusContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  statusIndicator: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 10,
  },
  poseDetected: {
    backgroundColor: 'rgba(52, 199, 89, 0.8)',
  },
  poseNotDetected: {
    backgroundColor: 'rgba(255, 59, 48, 0.8)',
  },
  statusText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingBottom: 20,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    minWidth: 100,
    alignItems: 'center',
  },
  startButton: {
    backgroundColor: '#34C759',
  },
  stopButton: {
    backgroundColor: '#FF3B30',
  },
  resetButton: {
    backgroundColor: '#FF9500',
    minWidth: 80,
  },
  voiceButton: {
    backgroundColor: '#5856D6',
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  message: {
    textAlign: 'center',
    paddingBottom: 10,
    fontSize: 16,
    color: '#333',
  },
});
