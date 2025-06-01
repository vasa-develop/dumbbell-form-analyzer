import * as tf from '@tensorflow/tfjs';
import * as poseDetection from '@tensorflow-models/pose-detection';
import '@tensorflow/tfjs-react-native';

export class PoseDetectionService {
  constructor() {
    this.detector = null;
    this.isInitialized = false;
  }

  async initialize() {
    if (this.isInitialized) return;

    try {
      await tf.ready();
      console.log('TensorFlow.js is ready');
      
      const model = poseDetection.SupportedModels.MoveNet;
      const detectorConfig = {
        modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
        enableSmoothing: true,
        minPoseScore: 0.25
      };

      console.log('Creating MoveNet detector...');
      this.detector = await poseDetection.createDetector(model, detectorConfig);
      this.isInitialized = true;
      console.log('Pose detection service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize pose detection service:', error);
      throw error;
    }
  }

  async detectPose(imageData) {
    if (!this.isInitialized || !this.detector) {
      throw new Error('Pose detection service not initialized');
    }

    try {
      const poses = await this.detector.estimatePoses(imageData);
      return poses.length > 0 ? poses[0] : null;
    } catch (error) {
      console.error('Pose detection error:', error);
      return null;
    }
  }

  dispose() {
    if (this.detector) {
      this.detector.dispose();
      this.detector = null;
      this.isInitialized = false;
      console.log('Pose detection service disposed');
    }
  }
}
