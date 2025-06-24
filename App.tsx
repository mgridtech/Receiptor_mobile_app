import React from 'react'
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
import ForgotPasswordScreen from './Screens/ForgotPass'

const Stack = createNativeStackNavigator()

const App = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Splash" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Login" component={Login} />
        <Stack.Screen name="ForgotPass" component={ForgotPasswordScreen} />
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