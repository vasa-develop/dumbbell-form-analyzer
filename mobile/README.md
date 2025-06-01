# Dumbbell Curl Analyzer - React Native Mobile App

Mobile version of the dumbbell curl form analyzer using React Native, TensorFlow.js Lite, and MoveNet for iOS deployment.

## Features

- **Real-time pose detection** using MoveNet (17 COCO keypoints)
- **Accurate rep counting** with curl phase detection
- **Voice feedback** for form correction and encouragement
- **Live stats display** showing reps, elbow angle, and current phase
- **Mobile-optimized performance** at 10 FPS for battery efficiency
- **iOS compatibility** with Expo Camera integration

## Architecture

- **React Native** for cross-platform mobile development
- **TensorFlow.js Lite** with MoveNet for mobile-optimized pose detection
- **Expo Camera** for real-time video capture and processing
- **React Native TTS** for voice feedback
- **Modular service architecture** for maintainability

## Performance Comparison

| Metric | MediaPipe Benchmark | Mobile Implementation | Target |
|--------|-------------------|---------------------|---------|
| Rep Detection Accuracy | 100% | TBD | >95% |
| Angle Precision | ±0.5° | TBD | ±2° |
| Frame Rate | 30 FPS | 10 FPS | Optimized for mobile |
| Latency | <100ms | TBD | <150ms |

## Setup Instructions

### Prerequisites
- Node.js 18+
- Expo CLI
- iOS Simulator or physical iOS device
- Xcode (for iOS development)

### Installation
```bash
# Install dependencies
npm install

# Start development server
npm start
```

### iOS Testing
```bash
# Run on iOS simulator
npm run ios

# Run on physical device
npm start
# Then scan QR code with Expo Go app
```

## Project Structure

```
DumbbellCurlAnalyzer/
├── components/
│   ├── CameraView.js          # Camera and pose detection
│   └── StatsDisplay.js        # Real-time stats display
├── services/
│   ├── FormAnalyzer.js        # Curl analysis logic
│   ├── PoseDetectionService.js # MoveNet integration
│   └── VoiceFeedbackService.js # TTS functionality
├── App.tsx                    # Main application component
├── metro.config.js           # Metro bundler configuration
└── package.json              # Dependencies and scripts
```

## Key Differences from Web Version

### Pose Detection
- **Web**: MediaPipe with 33 landmarks
- **Mobile**: TensorFlow.js Lite MoveNet with 17 keypoints
- **Trade-off**: Slightly reduced landmark precision for mobile performance

### Camera Access
- **Web**: WebRTC getUserMedia
- **Mobile**: Expo Camera with optimized frame processing

### Voice Feedback
- **Web**: Web Speech API
- **Mobile**: React Native TTS with better mobile audio control

### Performance Optimizations
- Frame rate throttling (10 FPS vs 30 FPS)
- Model quantization for faster inference
- Background processing for pose detection
- Battery-optimized processing intervals

## Usage

1. **Grant camera permission** when prompted
2. **Position yourself** so your full upper body is visible
3. **Tap "Start Analysis"** to begin pose detection
4. **Perform dumbbell curls** and listen for voice feedback
5. **Monitor stats** for rep count, elbow angle, and form tips
6. **Tap "Reset"** to start a new workout session

## Troubleshooting

### Common Issues
- **Camera not working**: Check permissions in device settings
- **Pose detection failing**: Ensure good lighting and full body visibility
- **Voice feedback not playing**: Check device volume and TTS settings
- **App crashes**: Restart Expo development server

### Performance Tips
- Use good lighting for better pose detection
- Keep device stable during workouts
- Close other apps to free up memory
- Ensure strong WiFi connection for development

## Development

### Adding New Features
1. Create new components in `components/` directory
2. Add business logic to `services/` directory
3. Update main App.tsx for integration
4. Test on both simulator and physical device

### Debugging
- Use Expo development tools for debugging
- Check console logs for pose detection issues
- Monitor performance with React Native debugger
- Test voice feedback with device audio settings
