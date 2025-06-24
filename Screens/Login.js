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
  Alert
} from 'react-native';
import ForgotPasswordScreen from './ForgotPass';
import auth from '@react-native-firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  // const baseURL = "http://10.0.2.2:8010"; // For Android emulator
  const baseURL = "http://192.168.1.11:8010"; // For physical device


  const handleLogin = async () => {
    if (!email || !password) {
      return Alert.alert('Missing fields', 'Please enter both email and password');
    }

    try {
      const { user } = await auth().signInWithEmailAndPassword(email, password);
      const token = await user.getIdToken();
      console.log('token:', token);

      await AsyncStorage.setItem('userToken', token);
      console.log('Token stored successfully');

      const response = await fetch(`${baseURL}/user/profile`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

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
        console.log('=============================');

        const displayName = userData.name || user.email;
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
        console.log('=======================================');

        Alert.alert(
          'Login Successful',
          `Welcome back, ${user.email}!`,
          [
            {
              text: 'OK',
              onPress: () => navigation.replace('Home'),
            },
          ],
          { cancelable: false }
        );
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
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
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
