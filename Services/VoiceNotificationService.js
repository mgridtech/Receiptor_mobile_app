// services/VoiceNotificationService.js
import Tts from 'react-native-tts';
import { Platform, AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BackgroundTimer from 'react-native-background-timer';

class VoiceNotificationService {
  constructor() {
    this.isInitialized = false;
    this.backgroundTimer = null;
    this.isBackground = false;
  }

  // Initialize TTS settings
  async initializeTTS() {
    if (this.isInitialized) return;

    try {
      // Set TTS options
      await Tts.setDefaultLanguage('en-US');
      await Tts.setDefaultRate(0.5, Platform.OS === 'android');
      await Tts.setDefaultPitch(1.0);
      
      if (Platform.OS === 'android') {
        await Tts.setDucking(true); // Lower other audio when speaking
      }

      // Get available voices
      const voices = await Tts.voices();
      console.log('Available voices:', voices);

      // Set a default voice if available
      if (voices.length > 0) {
        const englishVoice = voices.find(voice => 
          voice.language.includes('en')
        );
        if (englishVoice) {
          await Tts.setDefaultVoice(englishVoice.id);
        }
      }

      this.isInitialized = true;
      console.log('✅ TTS initialized successfully');
    } catch (error) {
      console.error('❌ TTS initialization failed:', error);
    }
  }

  // Play voice notification
  async playVoiceNotification(text) {
    try {
      if (!this.isInitialized) {
        await this.initializeTTS();
      }

      // Stop any ongoing speech
      Tts.stop();

      // Add a small delay to ensure stop is processed
      setTimeout(() => {
        Tts.speak(text);
      }, 100);
      
      console.log('🔊 Voice notification played:', text);
    } catch (error) {
      console.error('❌ Voice notification failed:', error);
    }
  }

  // Enhanced voice notification with retry mechanism
  async playVoiceNotificationWithRetry(text, retries = 3) {
    for (let i = 0; i < retries; i++) {
      try {
        await this.playVoiceNotification(text);
        return; // Success, exit retry loop
      } catch (error) {
        console.error(`❌ Voice notification attempt ${i + 1} failed:`, error);
        if (i === retries - 1) {
          // Last attempt failed, try alternative method
          await this.playFallbackNotification(text);
        }
      }
    }
  }

  // Fallback notification method
  async playFallbackNotification(text) {
    try {
      // Alternative approach: Store for later playback
      await AsyncStorage.setItem('pendingVoiceNotification', JSON.stringify({
        text,
        timestamp: Date.now()
      }));
      
      // Start background timer to check for pending notifications
      this.startBackgroundTimer();
    } catch (error) {
      console.error('❌ Fallback notification failed:', error);
    }
  }

  // Start background timer for checking pending notifications
  startBackgroundTimer() {
    if (this.backgroundTimer) return;

    this.backgroundTimer = BackgroundTimer.setInterval(() => {
      this.checkPendingNotifications();
    }, 2000); // Check every 2 seconds
  }

  // Stop background timer
  stopBackgroundTimer() {
    if (this.backgroundTimer) {
      BackgroundTimer.clearInterval(this.backgroundTimer);
      this.backgroundTimer = null;
    }
  }

  // Check for pending notifications
  async checkPendingNotifications() {
    try {
      const pendingNotification = await AsyncStorage.getItem('pendingVoiceNotification');
      if (pendingNotification) {
        const notificationData = JSON.parse(pendingNotification);
        
        // Check if notification is not too old (5 minutes)
        const now = Date.now();
        const notificationAge = now - notificationData.timestamp;
        
        if (notificationAge < 300000) { // 5 minutes
          await this.playVoiceNotification(notificationData.text);
        }
        
        // Remove the notification after processing
        await AsyncStorage.removeItem('pendingVoiceNotification');
      }
    } catch (error) {
      console.error('❌ Checking pending notifications failed:', error);
    }
  }

  // Handle app state changes
  handleAppStateChange(nextAppState) {
    if (nextAppState === 'background') {
      this.isBackground = true;
      this.startBackgroundTimer();
    } else if (nextAppState === 'active') {
      this.isBackground = false;
      this.stopBackgroundTimer();
    }
  }

  // Get TTS status
  getTTSStatus() {
    return new Promise((resolve) => {
      Tts.getInitStatus().then((initStatus) => {
        resolve(initStatus);
      }).catch((error) => {
        console.error('TTS status error:', error);
        resolve(false);
      });
    });
  }

  // Set custom voice settings
  async setVoiceSettings(rate = 0.5, pitch = 1.0, language = 'en-US') {
    try {
      await Tts.setDefaultRate(rate, Platform.OS === 'android');
      await Tts.setDefaultPitch(pitch);
      await Tts.setDefaultLanguage(language);
      console.log('✅ Voice settings updated');
    } catch (error) {
      console.error('❌ Voice settings update failed:', error);
    }
  }

  // Stop all speech
  stopSpeech() {
    try {
      Tts.stop();
    } catch (error) {
      console.error('❌ Stop speech failed:', error);
    }
  }

  // Clean up resources
  cleanup() {
    this.stopBackgroundTimer();
    this.stopSpeech();
  }
}

// Export singleton instance
export const VoiceNotificationService = new VoiceNotificationService();