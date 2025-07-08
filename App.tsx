import React, { useEffect } from 'react'
import { Platform, Alert, PermissionsAndroid, ToastAndroid } from 'react-native'
import firebase from '@react-native-firebase/app';
import messaging from '@react-native-firebase/messaging';
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import SplashScreen from './Screens/SplashScreen'
import Login from './Screens/Login'
import Home from './Screens/Home'
import Registration from './Screens/Registration'
import ReceiptsList from './Screens/ReceiptsList'
import ReceiptDetailsScreen from './Screens/ReceiptDetails'
import MedicalReceipts from './Screens/MedicalReceipts'
import ProfileScreen from './Screens/Profile'
import Settings from './Screens/Settings'
import AddReceipt from './Screens/AddReceipt'
import AsyncStorage from '@react-native-async-storage/async-storage'
import notifee, { AndroidImportance } from '@notifee/react-native';
import Tts from 'react-native-tts';

const Stack = createNativeStackNavigator()

const App = () => {
  // Simple voice function - ADD THIS
  const speakText = (text) => {
    try {
      Tts.speak(text);
    } catch (error) {
      console.log('Voice failed:', error);
    }
  };

  useEffect(() => {
    // Handle background/quit state notifications
    messaging().onNotificationOpenedApp(remoteMessage => {
      console.log('Notification opened app:', remoteMessage);
      const text = remoteMessage.notification?.body || 'New message';
      setTimeout(() => speakText(text), 1000); // Delay to ensure app is ready
    });

    // Handle notification when app is quit
    messaging()
      .getInitialNotification()
      .then(remoteMessage => {
        if (remoteMessage) {
          console.log('Notification caused app to open:', remoteMessage);
          const text = remoteMessage.notification?.body || 'New message';
          setTimeout(() => speakText(text), 2000); // Longer delay for cold start
        }
      });
  }, []);

  useEffect(() => {
    // Initialize TTS - ADD THIS
    Tts.setDefaultLanguage('en-US');
    Tts.setDefaultRate(0.5);

    const requestPermissions = async () => {
      if (Platform.OS === 'android' && Platform.Version >= 33) {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
          {
            title: 'Notification Permission',
            message: 'This app needs access to send you notifications',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          },
        );

        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          console.log('❌ Notification permission denied');
          return;
        }
      }

      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (enabled) {
        const token = await messaging().getToken();
        console.log('🔥 FCM Device Token:', token);
        await AsyncStorage.setItem('fcmToken', token);
      } else {
        console.log('🚫 Notification permission not granted');
      }
    };

    requestPermissions();
  }, []);

  useEffect(() => {
    const unsubscribe = messaging().onMessage(async remoteMessage => {
      console.log('📱 Foreground notification:', remoteMessage);

      await notifee.requestPermission();

      const channelId = await notifee.createChannel({
        id: 'default',
        name: 'Default Channel',
        importance: AndroidImportance.HIGH,
        sound: 'default',
        vibration: true,
      });

      const notificationText = remoteMessage.notification?.body || 'You have a new message';


      // ADD THIS LINE - Voice notification
      speakText(notificationText);

      await notifee.displayNotification({
        title: remoteMessage.notification?.title || 'New Notification',
        body: notificationText,
        android: {
          channelId,
          sound: 'default',
          smallIcon: 'ic_launcher',
          pressAction: {
            id: 'default',
          },
          // Add this for better background handling
          ongoing: false,
          autoCancel: true,
        },
      });
    });

    return unsubscribe;
  }, []);

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Splash" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Login" component={Login} />
        <Stack.Screen name="Register" component={Registration} />
        <Stack.Screen name="Home" component={Home} />
        <Stack.Screen name="ReceiptsList" component={ReceiptsList} />
        <Stack.Screen name="ReceiptDetails" component={ReceiptDetailsScreen} />
        <Stack.Screen name="MedicalReceipts" component={MedicalReceipts} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
        <Stack.Screen name="Settings" component={Settings} />
        <Stack.Screen name="AddReceipt" component={AddReceipt} />
      </Stack.Navigator>
    </NavigationContainer>
  )
}

export default App