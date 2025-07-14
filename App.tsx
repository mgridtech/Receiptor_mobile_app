import { NativeModules } from 'react-native';
const { VoiceNotification } = NativeModules;
import React, { useEffect } from 'react'
import { Platform, Alert, PermissionsAndroid, AppState } from 'react-native'
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
import AddMedicine from './Screens/AddMedicine';

const Stack = createNativeStackNavigator()

const App = () => {
  const speakText = (text: any) => {
    try {
      Tts.speak(text);
    } catch (error) {
      console.log('Voice failed:', error);
    }
  };

  useEffect(() => {
    messaging().onNotificationOpenedApp(remoteMessage => {
      console.log('Notification opened app:', remoteMessage);
      const text = remoteMessage.notification?.body || 'New message';
      setTimeout(() => speakText(text), 1000);
    });

    messaging()
      .getInitialNotification()
      .then(remoteMessage => {
        if (remoteMessage) {
          console.log('Notification caused app to open:', remoteMessage);
          const text = remoteMessage.notification?.body || 'New message';
          setTimeout(() => speakText(text), 2000);
        }
      });
  }, []);

  useEffect(() => {
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

      const notificationText = remoteMessage.notification?.body;

      if (notificationText) {
        speakText(notificationText);
      }
      if (remoteMessage.notification?.title && remoteMessage.notification?.body) {
        await notifee.displayNotification({
          title: remoteMessage.notification?.title,
          body: remoteMessage.notification?.body,
          android: {
            channelId,
            sound: 'default',
            smallIcon: 'ic_launcher',
            pressAction: {
              id: 'default',
            },
            ongoing: false,
            autoCancel: true,
          },
        });
      }
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
        <Stack.Screen name="AddMedicine" component={AddMedicine} />
      </Stack.Navigator>
    </NavigationContainer>
  )
}

export default App