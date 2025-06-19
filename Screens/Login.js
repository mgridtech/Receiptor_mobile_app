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
} from 'react-native';
import ForgotPasswordScreen from './ForgotPass';

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  const handleLogin = () => {
    // Handle login logic here
    navigation.replace('Home');
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
