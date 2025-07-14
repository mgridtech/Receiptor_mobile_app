
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Footer from './FooterH';
import EditProfile from './EditProfile';
import { getUserProfile, testTokenFormat, testServerConnection,logout } from '../Services/Services';
const ProfileScreen = ({ navigation }) => {
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
    tier: '',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      setError(null);

      await new Promise(resolve => setTimeout(resolve, 100));

      const token = await AsyncStorage.getItem('userToken');

      if (!token) {
        await new Promise(resolve => setTimeout(resolve, 500));
        const retryToken = await AsyncStorage.getItem('userToken');

        if (!retryToken) {
          Alert.alert('Error', 'No authentication token found. Please login again.');
          navigation.replace('Login');
          return;
        } else {
          token = retryToken;
        }
      }

      await testTokenFormat(token);
      await testServerConnection();

      const result = await getUserProfile(token);

      if (result.success) {
        setProfileData({
          name: result.data.name || '',
          email: result.data.email || '',
          phone: result.data.phone || '',
          tier: result.data.tier || '',
        });
      } else {
        setError(result.error);
        Alert.alert('Error', `Failed to load profile: ${result.error}`);
      }
    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
      setError(error.message);
      Alert.alert('Error', 'Failed to load profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('User logging out...');
              
              const logoutResult = await logout();
              
              if (logoutResult.success) {
                console.log('Logout successful:', logoutResult.data);
              } else {
                console.error('Logout failed:', logoutResult.error);
              }
              
              await AsyncStorage.removeItem('userToken');
              await AsyncStorage.removeItem('userEmail');
              await AsyncStorage.removeItem('userName');
              await AsyncStorage.removeItem('firebaseUserId');
              await AsyncStorage.removeItem('storedFcmToken');
              
              console.log('User logged out and AsyncStorage cleared');
              navigation.replace('Login');
            } catch (error) {
              console.error('Error during logout:', error);
              navigation.replace('Login');
            }
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={[styles.mainContainer, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#7C3AED" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <View style={styles.mainContainer}>
      {/* Sticky Header */}
      <View style={styles.headerWrapper}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} activeOpacity={0.7}>
            <Text style={{ color: 'white', fontSize: 30, fontWeight: 'bold', marginTop: -6 }}>
              ←
            </Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profile</Text>
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={fetchUserProfile}
            activeOpacity={0.7}
          >
            <Text style={styles.refreshButtonText}>🔄</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.invertedUBottom} />
      </View>

      {/* Scrollable Content */}
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Profile Information Card */}
        <View style={styles.profileInfoCard}>
          <Text style={styles.sectionTitle}>Personal Information</Text>

          <View style={styles.infoItem}>
            <View style={styles.infoIcon}>
              <Text style={styles.iconText}>👤</Text>
            </View>
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>Full Name</Text>
              <Text style={styles.infoValue}>{profileData.name || 'Not provided'}</Text>
            </View>
          </View>

          <View style={styles.infoItem}>
            <View style={styles.infoIcon}>
              <Text style={styles.iconText}>📧</Text>
            </View>
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>Email Address</Text>
              <Text style={styles.infoValue}>{profileData.email || 'Not provided'}</Text>
            </View>
          </View>

          <View style={styles.infoItem}>
            <View style={styles.infoIcon}>
              <Text style={styles.iconText}>📱</Text>
            </View>
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>Phone Number</Text>
              <Text style={styles.infoValue}>{profileData.phone || 'Not provided'}</Text>
            </View>
          </View>

          {profileData.tier && (
            <View style={styles.infoItem}>
              <View style={styles.infoIcon}>
                <Text style={styles.iconText}>⭐</Text>
              </View>
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>Tier</Text>
                <Text style={styles.infoValue}>{profileData.tier}</Text>
              </View>
            </View>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionContainer}>
          {/* Edit Profile Button */}
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => setEditModalVisible(true)}
            activeOpacity={0.7}
          >
            <View style={styles.actionButtonContent}>
              <View style={[styles.actionIconLarge, { backgroundColor: '#7C3AED' }]}>
                <Text style={styles.actionIconTextLarge}>✏️</Text>
              </View>
              <View style={styles.actionTextContainer}>
                <Text style={styles.actionTitle}>Edit Profile</Text>
                <Text style={styles.actionSubtitle}>Update your personal information</Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* Logout Section */}
        <View style={styles.logoutContainer}>
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
            activeOpacity={0.8}
          >
            <Text style={styles.logoutIcon}>🚪</Text>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <EditProfile
        visible={editModalVisible}
        profileData={profileData}
        onClose={() => setEditModalVisible(false)}
        onSave={(updatedProfile) => {
          setProfileData(updatedProfile);
          fetchUserProfile();
        }}
      />
      <Footer />
    </View>
  );
};

export default ProfileScreen;

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollContent: {
    paddingBottom: 100,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#6b7280',
  },
  headerWrapper: {
    backgroundColor: '#7C3AED',
    position: 'relative',
    zIndex: 1,
    marginTop: -15,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    paddingTop: 50,
    paddingBottom: 30,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
  },
  invertedUBottom: {
    height: 30,
    backgroundColor: '#f8f9fa',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginTop: -1,
  },
  backButton: {
    padding: 5,
    width: 34,
    height: 34,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: -10,
  },
  refreshButton: {
    padding: 5,
    width: 34,
    height: 34,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: -10,
  },
  refreshButtonText: {
    color: 'white',
    fontSize: 18,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 34,
    height: 34,
  },
  profileInfoCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 20,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  iconText: {
    fontSize: 18,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  actionContainer: {
    marginHorizontal: 20,
    marginBottom: 25,
  },
  actionButton: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
  actionButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 20,
  },
  actionIconLarge: {
    width: 50,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  actionIconTextLarge: {
    fontSize: 20,
  },
  actionTextContainer: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 3,
  },
  actionSubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  logoutContainer: {
    marginHorizontal: 20,
    marginBottom: 10,
  },
  logoutButton: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  logoutIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#dc2626',
  },
});