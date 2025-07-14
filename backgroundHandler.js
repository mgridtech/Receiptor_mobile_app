import messaging from '@react-native-firebase/messaging';
import notifee, { AndroidImportance } from '@notifee/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

messaging().setBackgroundMessageHandler(async remoteMessage => {
  console.log('📩 Background notification:', remoteMessage);
  const message = remoteMessage?.notification?.body || 'New message';

  await AsyncStorage.setItem('pendingVoiceMessage', message);

  const channelId = await notifee.createChannel({
    id: 'voice',
    name: 'Voice Notifications',
    importance: AndroidImportance.HIGH,
    sound: 'default',
  });

  await notifee.displayNotification({
    title: remoteMessage.notification?.title || 'New Notification',
    body: message,
    android: {
      channelId,
      pressAction: {
        id: 'default',
        launchActivity: 'default',
      },
    },
  });
});
