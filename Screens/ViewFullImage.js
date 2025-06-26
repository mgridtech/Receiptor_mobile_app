import React, { useState } from 'react';
import { Modal, View, Image, TouchableOpacity, Text, StyleSheet, Alert, Platform, PermissionsAndroid, Linking } from 'react-native';
import RNFS from 'react-native-fs';

const ViewFullImage = ({ visible, onClose, imageSource }) => {
    const [isDownloading, setIsDownloading] = useState(false);

    const handleDownloadImage = async () => {
        setIsDownloading(true);
        if (Platform.OS === 'android') {
            try {
                let imageUri;
                if (typeof imageSource === 'string') {
                    imageUri = imageSource;
                } else if (imageSource.uri) {
                    imageUri = imageSource.uri;
                } else {
                    const resolvedImage = Image.resolveAssetSource(imageSource);
                    imageUri = resolvedImage.uri;
                }

                const date = new Date();
                const fileName = `Receiptor_${date.getTime()}.jpg`;

                const downloadPath = `${RNFS.DownloadDirectoryPath}/${fileName}`;

                const downloadResult = await RNFS.downloadFile({
                    fromUrl: imageUri,
                    toFile: downloadPath,
                }).promise;

                if (downloadResult.statusCode === 200) {
                    await RNFS.scanFile(downloadPath);
                    Alert.alert('Success', `Image saved to Downloads folder: ${fileName}`);
                } else {
                    Alert.alert('Error', 'Failed to download image');
                }
            } catch (error) {
                console.error('Download error:', error);
                Alert.alert('Error', 'Failed to save image: ' + error.message);
            } finally {
                setIsDownloading(false);
            }
        }

        try {
            let imageUri;
            if (typeof imageSource === 'string') {
                imageUri = imageSource;
            } else if (imageSource.uri) {
                imageUri = imageSource.uri;
            } else {
                const resolvedImage = Image.resolveAssetSource(imageSource);
                imageUri = resolvedImage.uri;
            }

            const date = new Date();
            const fileName = `image_${date.getTime()}.jpg`;
            const downloadPath = `${RNFS.PicturesDirectoryPath}/${fileName}`;

            const downloadResult = await RNFS.downloadFile({
                fromUrl: imageUri,
                toFile: downloadPath,
            }).promise;

            if (downloadResult.statusCode === 200) {
                Alert.alert('Success', 'Image saved to gallery!');
            } else {
                Alert.alert('Error', 'Failed to download image');
            }
        } catch (error) {
            console.error('Download error:', error);
            Alert.alert('Error', 'Failed to save image: ' + error.message);
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
                    style={[styles.downloadButton, isDownloading && { opacity: 0.6 }]}
                    onPress={handleDownloadImage}
                    disabled={isDownloading}
                >
                    <Text style={{ color: '#fff', fontSize: 18 }}>
                        {isDownloading ? 'Downloading...' : 'Download'}
                    </Text>
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