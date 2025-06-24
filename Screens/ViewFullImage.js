import React from 'react';
import { Modal, View, Image, TouchableOpacity, Text, StyleSheet, Alert, Platform, PermissionsAndroid } from 'react-native';
import CameraRoll from '@react-native-camera-roll/camera-roll';

const ViewFullImage = ({ visible, onClose, imageSource }) => {
    const handleDownloadImage = async () => {
        if (Platform.OS === 'android') {
            try {
                const granted = await PermissionsAndroid.request(
                    PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
                    {
                        title: 'Storage Permission Required',
                        message: 'Receiptor needs access to your storage to save images.',
                        buttonNeutral: 'Ask Me Later',
                        buttonNegative: 'Cancel',
                        buttonPositive: 'OK',
                    }
                );
                if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
                    Alert.alert('Permission Denied', 'Storage permission is required to save images.');
                    return;
                }
            } catch (err) {
                Alert.alert('Permission error', err.message);
                return;
            }
        }
        try {
            const imageUri = Image.resolveAssetSource(imageSource).uri;
            await CameraRoll.save(imageUri, { type: 'photo' });
            Alert.alert('Success', 'Image saved to gallery!');
        } catch (error) {
            Alert.alert('Error', error.message);
        }
    };

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.fullscreenModal}>
                <Image
                    source={imageSource}
                    style={styles.fullscreenImage}
                    resizeMode="contain"
                />
                <TouchableOpacity
                    style={styles.closeButton}
                    onPress={onClose}
                >
                    <Text style={{ color: '#fff', fontSize: 18 }}>Close</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.downloadButton}
                    onPress={handleDownloadImage}
                >
                    <Text style={{ color: '#fff', fontSize: 18 }}>Download</Text>
                </TouchableOpacity>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    fullscreenModal: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.95)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    fullscreenImage: {
        width: '90%',
        height: '70%',
    },
    closeButton: {
        position: 'absolute',
        top: 40,
        right: 30,
        backgroundColor: 'rgba(0,0,0,0.6)',
        padding: 10,
        borderRadius: 20,
    },
    downloadButton: {
        position: 'absolute',
        bottom: 60,
        alignSelf: 'center',
        backgroundColor: '#7C3AED',
        paddingHorizontal: 30,
        paddingVertical: 12,
        borderRadius: 25,
    },
});

export default ViewFullImage;