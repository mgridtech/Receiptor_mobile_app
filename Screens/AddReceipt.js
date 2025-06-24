import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    SafeAreaView,
    Alert,
    Modal,
    Image,
    PermissionsAndroid,
    Platform,
} from 'react-native';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import DocumentPicker from 'react-native-document-picker';
import Footer from './FooterH';
import AddForm from './AddForm';

const AddReceipt = ({ navigation }) => {
    const [selectedFile, setSelectedFile] = useState(null);
    const [showUploadOptions, setShowUploadOptions] = useState(false);
    const [showAddForm, setShowAddForm] = useState(false);
    const requestCameraPermission = async () => {
        if (Platform.OS === 'android') {
            try {
                const granted = await PermissionsAndroid.request(
                    PermissionsAndroid.PERMISSIONS.CAMERA,
                    {
                        title: 'Camera Permission',
                        message: 'This app needs access to camera to take photos of receipts.',
                        buttonNeutral: 'Ask Me Later',
                        buttonNegative: 'Cancel',
                        buttonPositive: 'OK',
                    },
                );
                return granted === PermissionsAndroid.RESULTS.GRANTED;
            } catch (err) {
                console.warn(err);
                return false;
            }
        }
        return true;
    };

    const handleBackPress = () => {
        navigation.goBack();
    };

    const handleCameraLaunch = async () => {
        const hasPermission = await requestCameraPermission();

        if (!hasPermission) {
            Alert.alert('Permission Denied', 'Camera permission is required to take photos.');
            return;
        }

        const options = {
            mediaType: 'photo',
            includeBase64: false,
            maxHeight: 2000,
            maxWidth: 2000,
            quality: 0.8,
        };

        launchCamera(options, (response) => {
            if (response.didCancel) {
                console.log('User cancelled camera');
            } else if (response.errorMessage) {
                console.log('Camera Error: ', response.errorMessage);
                Alert.alert('Error', 'Failed to open camera');
            } else if (response.assets && response.assets[0]) {
                const asset = response.assets[0];
                setSelectedFile({
                    type: 'camera',
                    name: asset.fileName || 'Camera Photo',
                    uri: asset.uri,
                    fileSize: asset.fileSize,
                    mimeType: asset.type,
                    icon: '📷',
                    timestamp: new Date().toLocaleString(),
                });
                setShowUploadOptions(false);
            }
        });
    };

    const handleGalleryLaunch = () => {
        const options = {
            mediaType: 'photo',
            includeBase64: false,
            maxHeight: 2000,
            maxWidth: 2000,
            quality: 0.8,
        };

        launchImageLibrary(options, (response) => {
            if (response.didCancel) {
                console.log('User cancelled gallery');
            } else if (response.errorMessage) {
                console.log('Gallery Error: ', response.errorMessage);
                Alert.alert('Error', 'Failed to open gallery');
            } else if (response.assets && response.assets[0]) {
                const asset = response.assets[0];
                setSelectedFile({
                    type: 'gallery',
                    name: asset.fileName || 'Gallery Photo',
                    uri: asset.uri,
                    fileSize: asset.fileSize,
                    mimeType: asset.type,
                    icon: '🖼️',
                    timestamp: new Date().toLocaleString(),
                });
                setShowUploadOptions(false);
            }
        });
    };

    const handleDocumentPicker = async () => {
        try {
            const result = await DocumentPicker.pickSingle({
                type: [
                    DocumentPicker.types.images,
                    DocumentPicker.types.pdf,
                    DocumentPicker.types.doc,
                    DocumentPicker.types.docx,
                ],
            });

            setSelectedFile({
                type: 'document',
                name: result.name,
                uri: result.uri,
                fileSize: result.size,
                mimeType: result.type,
                icon: getFileIcon(result.type),
                timestamp: new Date().toLocaleString(),
            });
            setShowUploadOptions(false);
        } catch (err) {
            if (DocumentPicker.isCancel(err)) {
                console.log('User cancelled document picker');
            } else {
                console.log('Document Picker Error: ', err);
                Alert.alert('Error', 'Failed to pick document');
            }
        }
    };

    const getFileIcon = (mimeType) => {
        if (mimeType?.includes('image')) return '🖼️';
        if (mimeType?.includes('pdf')) return '📄';
        if (mimeType?.includes('doc')) return '📝';
        return '📄';
    };

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const handleFileUpload = (type) => {
        switch (type) {
            case 'camera':
                handleCameraLaunch();
                break;
            case 'gallery':
                handleGalleryLaunch();
                break;
            case 'document':
                handleDocumentPicker();
                break;
            default:
                break;
        }
    };

    const handleAddReceipt = () => {
        if (!selectedFile) {
            Alert.alert('Missing File', 'Please select an image or file to upload');
            return;
        }
        setShowAddForm(true);
    };

    const removeSelectedFile = () => {
        setSelectedFile(null);
        setShowAddForm(false);
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Purple Header with True Inverted U Shape */}
            <View style={styles.headerWrapper}>
                <View style={styles.header}>
                    <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
                        <Text style={{ color: 'white', fontSize: 30, fontWeight: 'bold', marginTop: -6 }}>
                            ←
                        </Text>
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Add Receipt</Text>
                </View>
                {/* Inverted U Shape Bottom */}
                <View style={styles.invertedUBottom} />
            </View>

            {/* Form Content */}
            <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
                <View style={styles.formContainer}>
                    {/* File Upload Section */}
                    <View style={styles.formSection}>
                        <Text style={styles.sectionLabel}>Receipt Attachment</Text>

                        {!selectedFile ? (
                            <TouchableOpacity
                                style={styles.uploadButton}
                                onPress={() => setShowUploadOptions(true)}
                            >
                                <Text style={styles.uploadIcon}>📎</Text>
                                <Text style={styles.uploadButtonText}>Pick an Upload Option</Text>
                                <Text style={styles.uploadButtonSubtext}>Camera • Gallery • Document</Text>
                            </TouchableOpacity>
                        ) : (
                            <View style={styles.selectedFileCard}>
                                <View style={styles.selectedFileInfo}>
                                    {selectedFile.uri && (selectedFile.type === 'camera' || selectedFile.type === 'gallery') ? (
                                        <Image source={{ uri: selectedFile.uri }} style={styles.selectedFilePreview} />
                                    ) : (
                                        <Text style={styles.selectedFileIcon}>{selectedFile.icon}</Text>
                                    )}
                                    <View style={styles.selectedFileDetails}>
                                        <Text style={styles.selectedFileName}>{selectedFile.name}</Text>
                                        <Text style={styles.selectedFileType}>
                                            {selectedFile.fileSize ? formatFileSize(selectedFile.fileSize) : 'Unknown size'}
                                        </Text>
                                        <Text style={styles.selectedFileTimestamp}>Added: {selectedFile.timestamp}</Text>
                                    </View>
                                </View>
                                <TouchableOpacity
                                    style={styles.removeFileButton}
                                    onPress={removeSelectedFile}
                                >
                                    <Text style={styles.removeFileText}>✕</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>

                    {/* Add Receipt Button */}
                    {!showAddForm ? (
                        <TouchableOpacity
                            style={[
                                styles.addReceiptButton,
                                !selectedFile && styles.addReceiptButtonDisabled
                            ]}
                            onPress={handleAddReceipt}
                            disabled={!selectedFile}
                        >
                            <Text style={styles.addReceiptButtonIcon}>✓</Text>
                            <Text style={styles.addReceiptButtonText}>Add Receipt</Text>
                        </TouchableOpacity>
                    ) : (
                        <AddForm
                            navigation={navigation}
                            onSave={(data) => {
                                setShowAddForm(false);
                            }}
                        />
                    )}

                </View>
            </ScrollView>

            {/* Upload Options Modal */}
            <Modal
                visible={showUploadOptions}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowUploadOptions(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Choose Upload Option</Text>

                        <TouchableOpacity
                            style={styles.modalOption}
                            onPress={() => handleFileUpload('camera')}
                        >
                            <Text style={styles.modalOptionIcon}>📷</Text>
                            <Text style={styles.modalOptionText}>Take Photo</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.modalOption}
                            onPress={() => handleFileUpload('gallery')}
                        >
                            <Text style={styles.modalOptionIcon}>🖼️</Text>
                            <Text style={styles.modalOptionText}>Choose from Gallery</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.modalOption}
                            onPress={() => handleFileUpload('document')}
                        >
                            <Text style={styles.modalOptionIcon}>📄</Text>
                            <Text style={styles.modalOptionText}>Upload Document</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.modalCancelButton}
                            onPress={() => setShowUploadOptions(false)}
                        >
                            <Text style={styles.modalCancelText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
            <Footer />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    headerWrapper: {
        backgroundColor: '#7C3AED',
        position: 'relative',
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
        shadowOffset: {
            width: 0,
            height: 2,
        },
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
        marginRight: 15,
        width: 34,
        height: 34,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: -10,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: 'white',
        flex: 1,
        textAlign: 'center',
    },
    scrollContainer: {
        flex: 1,
        paddingTop: 10,
        marginTop: -30,
    },
    formContainer: {
        paddingHorizontal: 20,
        paddingTop: 30,
        paddingBottom: 100,
    },
    formSection: {
        marginBottom: 24,
    },
    sectionLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 12,
    },
    textInput: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        color: '#333',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    amountInputContainer: {
        backgroundColor: 'white',
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    currencySymbol: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#7C3AED',
        paddingLeft: 16,
        paddingRight: 8,
    },
    amountInput: {
        flex: 1,
        padding: 16,
        paddingLeft: 0,
        fontSize: 16,
        color: '#333',
    },
    dropdownButton: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    dropdownContent: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    dropdownIcon: {
        fontSize: 20,
        marginRight: 12,
    },
    dropdownText: {
        fontSize: 16,
        color: '#333',
        fontWeight: '500',
    },
    dropdownPlaceholder: {
        fontSize: 16,
        color: '#999',
    },
    dropdownArrow: {
        fontSize: 12,
        color: '#666',
    },
    dropdownOptions: {
        backgroundColor: 'white',
        borderRadius: 12,
        marginTop: 8,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    dropdownOption: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    dropdownOptionText: {
        fontSize: 16,
        color: '#333',
    },
    uploadButton: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 32,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#7C3AED',
        borderStyle: 'dashed',
    },
    uploadIcon: {
        fontSize: 32,
        marginBottom: 8,
    },
    uploadButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#7C3AED',
        marginBottom: 4,
    },
    uploadButtonSubtext: {
        fontSize: 14,
        color: '#999',
    },
    selectedFileCard: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    selectedFileInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    selectedFilePreview: {
        width: 50,
        height: 50,
        borderRadius: 8,
        marginRight: 12,
    },
    selectedFileIcon: {
        fontSize: 24,
        marginRight: 12,
    },
    selectedFileDetails: {
        flex: 1,
    },
    selectedFileName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 2,
    },
    selectedFileType: {
        fontSize: 14,
        color: '#666',
        marginBottom: 2,
    },
    selectedFileTimestamp: {
        fontSize: 12,
        color: '#999',
    },
    removeFileButton: {
        padding: 8,
        backgroundColor: '#ffe6e6',
        borderRadius: 6,
    },
    removeFileText: {
        fontSize: 16,
        color: '#ff4444',
        fontWeight: 'bold',
    },
    addReceiptButton: {
        backgroundColor: '#7C3AED',
        borderRadius: 12,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 32,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    addReceiptButtonDisabled: {
        backgroundColor: '#ccc',
        elevation: 1,
    },
    addReceiptButtonIcon: {
        fontSize: 20,
        color: 'white',
        fontWeight: 'bold',
        marginRight: 8,
    },
    addReceiptButtonText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: 'white',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: 'white',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 24,
        paddingBottom: 40,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        textAlign: 'center',
        marginBottom: 20,
    },
    modalOption: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        backgroundColor: '#f8f9fa',
    },
    modalOptionIcon: {
        fontSize: 24,
        marginRight: 16,
    },
    modalOptionText: {
        fontSize: 16,
        color: '#333',
        fontWeight: '500',
    },
    modalCancelButton: {
        marginTop: 12,
        padding: 16,
        alignItems: 'center',
        backgroundColor: '#f0f0f0',
        borderRadius: 12,
    },
    modalCancelText: {
        fontSize: 16,
        color: '#666',
        fontWeight: '500',
    },
});

export default AddReceipt;