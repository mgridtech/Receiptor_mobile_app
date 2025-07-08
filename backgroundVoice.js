import messaging from '@react-native-firebase/messaging';
import Tts from 'react-native-tts';

messaging().setBackgroundMessageHandler(async remoteMessage => {
  console.log('Background notification:', remoteMessage);
  
  const text = remoteMessage.notification?.body || 'New message';
  
  try {
    Tts.speak(text);
  } catch (error) {
    console.log('Background voice failed:', error);
  }
});