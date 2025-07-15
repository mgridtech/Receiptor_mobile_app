import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';
import { updateUserProfile } from '../Services/Services';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';

const EditProfile = ({
  visible,
  profileData,
  onClose,
  onSave,
}) => {
  const [tempProfileData, setTempProfileData] = useState(profileData);

  useEffect(() => {
    if (visible) setTempProfileData(profileData);
  }, [visible, profileData]);

  const handleCancel = () => {
    setTempProfileData(profileData);
    onClose();
  };

  const handleSave = async () => {
    if (!tempProfileData.name.trim() || !tempProfileData.email.trim() || !tempProfileData.phone.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'All fields are required.',
        position: 'top',
        topOffset: 130,
        visibilityTime: 3000,
      });
      return;
    }

    try {
      const result = await updateUserProfile({
        name: tempProfileData.name.trim(),
        email: tempProfileData.email.trim(),
        phone: tempProfileData.phone.trim(),
      });

      if (result.success) {
        await AsyncStorage.setItem('userName', tempProfileData.name.trim());
        console.log('Updated name in AsyncStorage:', tempProfileData.name.trim());

        if (onSave) onSave(tempProfileData);
        onClose();
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'Profile updated successfully!',
          position: 'top',
          topOffset: 130,
          visibilityTime: 3000,
        });
      } else {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: result.error || 'Failed to update profile',
          position: 'top',
          topOffset: 130,
          visibilityTime: 3000,
        });
      }
    } catch (error) {
      console.error('Error in handleSave:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'An unexpected error occurred',
        position: 'top',
        topOffset: 130,
        visibilityTime: 3000,
      });
    } finally {
    }
  };

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={handleCancel}
    >
      <View style={styles.modalOverlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'position' : 'height'}
          style={styles.modalContainer}
        >
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={handleCancel}>
                <Text style={styles.cancelButton}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Edit Profile</Text>
              <TouchableOpacity onPress={handleSave}>
                <Text style={styles.saveButton}>Save</Text>
              </TouchableOpacity>
            </View>

            {/* Scrollable Form Fields */}
            <ScrollView
              style={styles.formContainer}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.formGroup}>
                <Text style={styles.label}>Full Name</Text>
                <TextInput
                  style={styles.input}
                  value={tempProfileData.name}
                  onChangeText={(text) => setTempProfileData({ ...tempProfileData, name: text })}
                  placeholder="Enter your full name"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Email Address</Text>
                <TextInput
                  style={styles.input}
                  value={tempProfileData.email}
                  onChangeText={(text) => setTempProfileData({ ...tempProfileData, email: text })}
                  placeholder="Enter your email"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={[styles.formGroup, { marginBottom: 40 }]}>
                <Text style={styles.label}>Phone Number</Text>
                <TextInput
                  style={styles.input}
                  value={tempProfileData.phone}
                  onChangeText={(text) => setTempProfileData({ ...tempProfileData, phone: text })}
                  placeholder="Enter your phone number"
                  keyboardType="phone-pad"
                />
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
    minHeight: '49%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
  },
  cancelButton: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '600',
  },
  saveButton: {
    fontSize: 16,
    color: '#7C3AED',
    fontWeight: '700',
  },
  formContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#fff',
    color: '#1f2937',
  },
});

export default EditProfile;