import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  KeyboardAvoidingView,
  ScrollView,
  Platform
} from 'react-native';
import { register } from '../Services/Services';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';

const Registration = ({ navigation }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');

  const handleRegister = async () => {
    const response = await register({
      name,
      email,
      phone,
      password,
    });
    console.log('Register API response:', response);

    if (response.success) {
      const userId = response?.data?.[0]?.id;

      if (userId) {
        await AsyncStorage.setItem('userId', userId.toString());
        console.log('User ID stored in AsyncStorage:', userId);
      } else {
        console.log('User ID not found in response data.');
      }
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Registration successful! Login now.',
        position: 'top',
        topOffset: 130,
        visibilityTime: 3000,
      });
      navigation.replace('Login');
    } else {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: response.error || 'Registration failed. Please try again.',
        position: 'top',
        topOffset: 130,
        visibilityTime: 3000,
      });
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
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
            placeholder="Name"
            value={name}
            onChangeText={setName}
            style={styles.input}
            placeholderTextColor={'black'}
          />
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
            placeholder="Phone Number"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            style={styles.input}
            placeholderTextColor={'black'}
          />
          <TextInput
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            color={'black'}
            style={styles.input}
            placeholderTextColor={'black'}
          />
        </View>

        <TouchableOpacity style={styles.button} onPress={handleRegister}>
          <Text style={styles.buttonText}>Register</Text>
        </TouchableOpacity>

        {/* Already a user? Sign In */}
        <TouchableOpacity
          style={styles.signinContainer}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.signinText}>Already a user? Sign In</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default Registration;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContainer: {
    flexGrow: 1,
    alignItems: 'center',
    paddingTop: 100,
    paddingBottom: 50,
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
    paddingVertical: 12,
    color: 'black',
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
  signinContainer: {
    marginTop: 15,
    marginBottom: 20,
  },
  signinText: {
    color: '#7C3AED',
    fontSize: 16,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});