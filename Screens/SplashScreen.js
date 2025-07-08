import React, { useEffect } from 'react'
import { View, Text, StyleSheet, Image } from 'react-native'
import * as Animatable from 'react-native-animatable'
import LinearGradient from 'react-native-linear-gradient'
import AsyncStorage from '@react-native-async-storage/async-storage'

const SplashScreen = ({ navigation }) => {
  useEffect(() => {
    const timer = setTimeout(async () => {
      try {
        const userToken = await AsyncStorage.getItem('userToken')
        
        if (userToken) {
          navigation.replace('Home')
        } else {
          navigation.replace('Login')
        }
      } catch (error) {
        console.error('Error checking user token:', error)
        navigation.replace('Login')
      }
    }, 3000)
    
    return () => clearTimeout(timer)
  }, [navigation])

  return (
    <LinearGradient
      colors={['#B88CE4', '#D2BDF1', '#B6F5E1']}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <Animatable.Image
        animation="bounceIn"
        duration={2000}
        source={require('../assets/Logo.png')}
        style={styles.logo}
        resizeMode="contain"
      />
      <Animatable.Text animation="fadeInUp" delay={1000} style={styles.text}>
        Receiptor
      </Animatable.Text>
    </LinearGradient>
  )
}
export default SplashScreen

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  logo: {
    width: 150,
    height: 150,
    marginBottom: 20
  },
  text: {
    fontSize: 28,
    color: '#6A0DAD',
    fontWeight: 'bold',
    textAlign: 'center'
  },
  subText: {
    fontSize: 16,
    color: '#f0f0f0',
    marginTop: 10,
    textAlign: 'center'
  }
})
