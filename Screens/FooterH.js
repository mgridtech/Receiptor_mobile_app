import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, Image, StyleSheet, Keyboard } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';

const Footer = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const currentRoute = route.name;

  const [keyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
      setKeyboardVisible(true);
    });
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardVisible(false);
    });

    return () => {
      keyboardDidShowListener?.remove();
      keyboardDidHideListener?.remove();
    };
  }, []);

  if (keyboardVisible) {
    return null;
  }

  return (
    <View style={styles.footerWrapper}>
      {/* Left side of footer */}
      <View style={styles.footerLeft}>
        <View style={styles.sideIcons}>
          <TouchableOpacity onPress={() => navigation.navigate('Home')}>
            <Image
              source={{
                uri: currentRoute === 'Home'
                  ? 'https://cdn-icons-png.flaticon.com/512/1946/1946436.png'
                  : 'https://cdn-icons-png.flaticon.com/512/1946/1946488.png'
              }}
              style={styles.icon}
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('ReceiptsList')}>
            <Image
              source={{
                uri: currentRoute === 'ReceiptsList'
                  ? 'https://cdn-icons-png.flaticon.com/512/7939/7939880.png' // active
                  : 'https://cdn-icons-png.flaticon.com/512/12473/12473594.png' // inactive
              }}
              style={styles.icon}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Right side of footer */}
      <View style={styles.footerRight}>
        <View style={styles.sideIcons}>
          <TouchableOpacity onPress={() => navigation.navigate('Settings')}>
            <Image
              source={{
                uri: currentRoute === 'Settings'
                  ? 'https://cdn-icons-png.flaticon.com/512/3524/3524659.png' // active
                  : 'https://cdn-icons-png.flaticon.com/512/3524/3524636.png' // inactive
              }}
              style={styles.icon}
            />
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
            <Image
              source={{
                uri: currentRoute === 'Profile'
                  ? 'https://cdn-icons-png.flaticon.com/512/1144/1144811.png' // active
                  : 'https://cdn-icons-png.flaticon.com/512/1946/1946429.png' // inactive
              }}
              style={styles.icon}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* U-shaped background elements */}
      <View style={styles.uShapeLeft} />
      <View style={styles.uShapeRight} />

      {/* Center plus button */}
      <TouchableOpacity style={styles.plusButton} onPress={() => navigation.navigate('AddReceipt')}>
        {/* Plus icon */}
        <Image
          source={{ uri: 'https://cdn-icons-png.flaticon.com/512/992/992651.png' }}
          style={styles.plusIcon}
        />
      </TouchableOpacity>
    </View>
  );
};

export default Footer;

const styles = StyleSheet.create({
  footerWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
    zIndex: 100,
  },
  footerLeft: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: '40%',
    height: 60,
    backgroundColor: '#E9D5FF',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 0,
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: -2 },
    elevation: 5,
  },
  footerRight: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: '40%',
    height: 60,
    backgroundColor: '#E9D5FF',
    borderTopLeftRadius: 0,
    borderTopRightRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    paddingRight: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: -2 },
    elevation: 5,
  },
  uShapeLeft: {
    position: 'absolute',
    bottom: 0,
    left: '40%',
    width: '10%',
    height: 60,
    backgroundColor: '#E9D5FF',
    borderTopRightRadius: 40,
    marginRight: -1,
  },
  uShapeRight: {
    position: 'absolute',
    bottom: 0,
    right: '40%',
    width: '10%',
    height: 60,
    backgroundColor: '#E9D5FF',
    borderTopLeftRadius: 40,
    marginLeft: -1,
  },
  sideIcons: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  iconWrapper: {
    width: 10,
    alignItems: 'center',
  },
  icon: {
    width: 25,
    height: 25,
    tintColor: '#7C3AED',
  },
  plusButton: {
    position: 'absolute',
    top: -3,
    left: '50%',
    marginLeft: -35,
    width: 70,
    height: 70,
    backgroundColor: '#7C3AED',
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    // elevation: 15,
    // shadowColor: '#7C3AED',
    // shadowOpacity: 0.4,
    // shadowRadius: 15,
    // shadowOffset: { width: 0, height: 8 },
    borderWidth: 8,
    borderColor: '#FFFFFF',
    zIndex: 20,
  },
  plusIcon: {
    width: 28,
    height: 28,
    tintColor: '#FFFFFF',
  },
});