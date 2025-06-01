import Tts from 'react-native-tts';

export class VoiceFeedbackService {
  constructor() {
    this.isEnabled = true;
    this.setupTts();
  }

  setupTts() {
    try {
      Tts.setDefaultRate(0.5);
      Tts.setDefaultPitch(1.0);
      Tts.setDefaultLanguage('en-US');
      console.log('Voice feedback service initialized');
    } catch (error) {
      console.error('Failed to setup TTS:', error);
    }
  }

  speak(text) {
    if (!this.isEnabled || !text) return;
    
    try {
      Tts.stop();
      Tts.speak(text);
    } catch (error) {
      console.error('TTS speak error:', error);
    }
  }

  setEnabled(enabled) {
    this.isEnabled = enabled;
    if (!enabled) {
      try {
        Tts.stop();
      } catch (error) {
        console.error('TTS stop error:', error);
      }
    }
  }

  stop() {
    try {
      Tts.stop();
    } catch (error) {
      console.error('TTS stop error:', error);
    }
  }
}
