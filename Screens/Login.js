import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
} from 'react-native';
import ForgotPasswordScreen from './ForgotPass';
import auth from '@react-native-firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { jwtDecode } from 'jwt-decode';
import { baseURL, DeviceToken, updateDeviceToken } from '../Services/Services';

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      return Alert.alert('Missing fields', 'Please enter both email and password');
    }

    try {
      const { user } = await auth().signInWithEmailAndPassword(email, password);
      const token = await user.getIdToken();
      console.log('Token:', token);

      const decoded = jwtDecode(token);
      console.log('Decoded JWT:', decoded);

      const firebaseUserId = decoded.user_id || decoded.userId;
      console.log('Firebase User ID:', firebaseUserId);

      await AsyncStorage.setItem('userToken', token);
      await AsyncStorage.setItem('firebaseUserId', firebaseUserId);

      const fcmToken = await AsyncStorage.getItem('fcmToken');
      const storedFcmToken = await AsyncStorage.getItem('storedFcmToken');

      console.log('=== FCM Token Debug ===');
      console.log('Current FCM Token from AsyncStorage:', fcmToken);
      console.log('Previously stored FCM Token:', storedFcmToken);
      console.log('FCM Token length:', fcmToken?.length);
      console.log('FCM Token exists:', !!fcmToken);
      console.log('Tokens are same:', fcmToken === storedFcmToken);

      const response = await fetch(`${baseURL}/user/profile`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'FCM-Token': fcmToken || '',
        },
      });

      console.log('=== Request Headers Sent ===');
      console.log('Authorization header:', `Bearer ${token.substring(0, 20)}...`);
      console.log('FCM-Token header:', fcmToken || 'NOT SENT');
      console.log('========================');

      if (response.ok) {
        const userData = await response.json();
        console.log('User data from API:', userData);

        await AsyncStorage.setItem('userEmail', user.email);

        if (userData.data && userData.data.name && userData.data.name.trim() !== '') {
          await AsyncStorage.setItem('userName', userData.data.name);
        } else {
          console.log('Name not found in user data, skipping storage');
        }

        const storedToken = await AsyncStorage.getItem('userToken');
        const storedEmail = await AsyncStorage.getItem('userEmail');
        const storedName = await AsyncStorage.getItem('userName');

        console.log('=== AsyncStorage Contents ===');
        console.log('Stored Token:', storedToken);
        console.log('Stored Email:', storedEmail);
        console.log('Stored Name:', storedName);
        console.log('Stored Firebase UID:', firebaseUserId);
        console.log('=============================');

        const displayName = userData?.data?.name || user.email;

        if (fcmToken) {
          // Get the stored user ID to compare with current login
          const storedUserId = await AsyncStorage.getItem('firebaseUserId');

          console.log('=== User ID Comparison ===');
          console.log('Current Firebase User ID:', firebaseUserId);
          console.log('Stored Firebase User ID:', storedUserId);
          console.log('User IDs are same:', firebaseUserId === storedUserId);
          console.log('Stored User ID exists:', !!storedUserId);
          console.log('========================');

          // Check if stored user ID exists and matches current user ID
          if (storedUserId && firebaseUserId === storedUserId) {
            // Same user - check if FCM token has changed
            if (fcmToken !== storedFcmToken) {
              console.log('Same user, FCM token has changed, updating device token...');

              if (storedFcmToken) {
                // Update existing device token
                const updateResult = await updateDeviceToken({
                  oldToken: storedFcmToken,
                  newToken: fcmToken
                });
                console.log('Update result:', updateResult);

                if (updateResult.success) {
                  console.log('Device token updated successfully:', updateResult.data);
                  await AsyncStorage.setItem('storedFcmToken', fcmToken);
                } else {
                  console.error('Failed to update device token:', updateResult.error);
                }
              } else {
                // Same user but no previous token stored, create new record
                console.log('Same user but no previous FCM token, creating new record...');
                const deviceTokenResponse = await DeviceToken(fcmToken);
                console.log('DeviceToken API response:', deviceTokenResponse);
                await AsyncStorage.setItem('storedFcmToken', fcmToken);
              }
            } else {
              console.log('Same user, FCM token is the same, no update needed');
            }
          } else {
            // Different user OR first time login - create new device token record
            console.log('Different user OR first time login, creating new device token record...');
            const deviceTokenResponse = await DeviceToken(fcmToken);
            console.log('DeviceToken API response:', deviceTokenResponse);
            await AsyncStorage.setItem('storedFcmToken', fcmToken);
          }
        } else {
          console.warn('FCM token not found — skipping device token registration.');
        }
        Alert.alert(
          'Login Successful',
          `Welcome back, ${displayName}!`,
          [
            {
              text: 'OK',
              onPress: () => navigation.replace('Home'),
            },
          ],
          { cancelable: false }
        );
      } else {
        await AsyncStorage.setItem('userEmail', user.email);

        console.log('=== AsyncStorage Contents (Fallback) ===');
        console.log('Stored Token:', await AsyncStorage.getItem('userToken'));
        console.log('Stored Email:', await AsyncStorage.getItem('userEmail'));
        console.log('Stored Name:', 'API call failed');
        console.log('Stored Firebase UID:', firebaseUserId);
        console.log('=======================================');
      }
    } catch (e) {
      console.error('Login Error:', e);

      let message = 'An unexpected error occurred. Please try again.';
      switch (e.code) {
        case 'auth/invalid-email':
          message = 'That email address is badly formatted.';
          break;
        case 'auth/user-not-found':
        case 'auth/wrong-password':
        case 'auth/invalid-credential':
          message = 'Invalid email or password.';
          break;
        case 'auth/user-disabled':
          message = 'This user account has been disabled.';
          break;
        case 'auth/network-request-failed':
          message = 'Network error: please check your connection.';
          break;
      }

      Alert.alert('Login Failed', message);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header} />

        <Image
          source={require('../assets/Logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />

        <Text style={styles.title}>Receiptor</Text>

        <View style={styles.inputContainer}>
          <TextInput
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            style={styles.input}
            placeholderTextColor={'black'}
          />
          <TextInput
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            style={styles.input}
            color={'black'}
            placeholderTextColor={'black'}
          />
        </View>

        <TouchableOpacity style={styles.button} onPress={handleLogin}>
          <Text style={styles.buttonText}>Sign In</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.createAccountContainer}
          onPress={() => setShowForgotPassword(true)}
        >
          <Text style={styles.createAccountText}>Forgot Password ?</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.createAccountContainer}
          onPress={() => navigation.navigate('Register')}
        >
          <Text style={styles.createAccountText}>New user ? Create Account</Text>
        </TouchableOpacity>
        {showForgotPassword && (
          <ForgotPasswordScreen
            visible={showForgotPassword}
            onClose={() => setShowForgotPassword(false)}
          />
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default LoginScreen;
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    paddingTop: 100,
  },
  header: {
    position: 'absolute',
    top: 0,
    width: '100%',
    height: 100,
    backgroundColor: '#7C3AED',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  logo: {
    marginTop: 20,
    width: 200,
    height: 200,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 30,
  },
  inputContainer: {
    width: '80%',
  },
  input: {
    borderBottomWidth: 1,
    borderBottomColor: '#7C3AED',
    marginBottom: 20,
    fontSize: 16,
    paddingVertical: 8,
  },
  button: {
    backgroundColor: '#7C3AED',
    marginTop: 20,
    borderRadius: 8,
    width: '60%',
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  createAccountContainer: {
    marginTop: 15,
  },
  createAccountText: {
    color: '#7C3AED',
    fontSize: 16,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});
