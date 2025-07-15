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
    ActivityIndicator,
} from 'react-native';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import DocumentPicker from 'react-native-document-picker';
import Footer from './FooterH';
import AddForm from './AddForm';
// import { baseURL } from '../Services/Services';
import MedicalAddForm from './MedicalAddForm';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';

const AddReceipt = ({ navigation }) => {
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [combinedOcrData, setCombinedOcrData] = useState({
        vendorName: '',
        amount: '',
        dateReceived: '',
        expiryDate: '',
        groupName: '',
        medicineName: '',
        validUntil: '',
    });

    const [showUploadOptions, setShowUploadOptions] = useState(false);
    const [showAddForm, setShowAddForm] = useState(false);
    const [isProcessingOCR, setIsProcessingOCR] = useState(false);
    const [ocrData, setOcrData] = useState(null);
    const [selectedCategory, setSelectedCategory] = useState(null);


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

    const callOCRAPI = async (imageUri) => {
        setIsProcessingOCR(true);
        try {
            console.log('Starting OCR API call with image URI:', imageUri);

            const formData = new FormData();
            formData.append('receipt', {
                uri: imageUri,
                type: 'image/jpeg',
                name: 'receipt.jpg',
            });

            const baseURL = 'https://receiptor-backend.onrender.com';
            const apiUrl = `${baseURL}/api/ocr`;

            console.log('Making request to:', apiUrl);

            const token = await AsyncStorage.getItem('userToken');
            console.log('Using token:', token);

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 30000);

            const response = await fetch(apiUrl, {
                method: 'POST',
                body: formData,
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                signal: controller.signal,
            });

            clearTimeout(timeoutId);

            console.log('Response status:', response.status);
            console.log('Response headers:', response.headers);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('API Error Response:', errorText);
                throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
            }

            const data = await response.json();
            console.log('OCR Response:', data);

            const processedData = processOCRData(data);
            setOcrData(processedData);

            if (processedData) {
                combineOcrData(processedData);
            }

            return processedData;
        } catch (error) {
            console.error('OCR API Error Details:', {
                message: error.message,
                stack: error.stack,
                name: error.name
            });

            let errorMessage = 'Could not extract data from image. You can still fill the form manually.';

            if (error.name === 'AbortError') {
                errorMessage = 'Request timed out. Please try again.';
            } else if (error.message.includes('Network request failed')) {
                errorMessage = 'Network connection failed. Please check your internet connection and try again.';
            } else if (error.message.includes('timeout')) {
                errorMessage = 'Request timed out. Please try again.';
            }

            Toast.show({
                type: 'error',
                text1: 'OCR Processing Failed',
                text2: errorMessage,
                position: 'top',
                topOffset: 130,
                visibilityTime: 3000,
            });
            return null;
        } finally {
            setIsProcessingOCR(false);
        }
    };

    const processOCRData = (ocrResponse) => {
        console.log('OCR Response for processing:', ocrResponse);

        const extractedText = ocrResponse.data?.[0] || '';
        let wordsArray = ocrResponse.data || [];

        if (!Array.isArray(wordsArray)) {
            wordsArray = [];
        }

        if (Array.isArray(ocrResponse.data) && ocrResponse.data.length > 1 && Array.isArray(ocrResponse.data[1])) {
            wordsArray = ocrResponse.data[1];
        }

        console.log('Words array:', wordsArray);

        let vendorName = '';
        let amount = '';
        let expiryDate = '';
        let groupName = '';

        // Check if "Medical" word exists anywhere in the receipt - if yes, set group as Medical
        const hasMedical = wordsArray.some(word =>
            word && typeof word === 'string' && word.toLowerCase() === 'medical'
        );

        if (hasMedical) {
            groupName = 'Medical';
        }

        // Extract vendor name - look for "Name:" or "Name" pattern and get the value after it
        if (wordsArray.length > 0) {
            for (let i = 0; i < wordsArray.length - 1; i++) {
                const currentWord = wordsArray[i];
                const nextWord = wordsArray[i + 1];

                // Look for "Name:" pattern (exact match)
                if (currentWord && typeof currentWord === 'string' &&
                    (currentWord === 'Name:' || currentWord === 'Name')) {

                    // Get the next word(s) as vendor name
                    if (nextWord && typeof nextWord === 'string') {
                        let nameWords = [nextWord];

                        // Look ahead for more name words (until we hit a colon or specific keywords)
                        for (let j = i + 2; j < Math.min(i + 5, wordsArray.length); j++) {
                            const word = wordsArray[j];
                            if (word && typeof word === 'string' &&
                                !word.includes(':') &&
                                !word.toLowerCase().includes('address') &&
                                !word.toLowerCase().includes('phone') &&
                                !word.toLowerCase().includes('date') &&
                                !word.toLowerCase().includes('time') &&
                                !word.toLowerCase().includes('receipt')) {
                                nameWords.push(word);
                            } else {
                                break;
                            }
                        }

                        vendorName = nameWords.join(' ').replace(/^:\s*/, '');
                    }
                }
            }
        }

        // Keep original amount extraction logic
        const amountRegex = /\d+\.\d{2}/g;
        const amounts = extractedText.match(amountRegex) || [];
        if (amounts.length > 0) {
            amount = Math.max(...amounts.map(parseFloat)).toString();
        }

        // Extract any date from the receipt
        if (wordsArray.length > 0) {
            // Look for various date patterns in the words array
            for (let i = 0; i < wordsArray.length; i++) {
                const word = wordsArray[i];

                if (word && typeof word === 'string') {
                    // Check for date formats like DD-MM-YYYY, MM-DD-YYYY, YYYY-MM-DD
                    const dateMatch = word.match(/\d{1,2}[-/]\d{1,2}[-/]\d{4}|\d{4}[-/]\d{1,2}[-/]\d{1,2}/);
                    if (dateMatch) {
                        expiryDate = formatDateString(dateMatch[0]);
                        break;
                    }

                    // Check for month name patterns (May, June, etc.)
                    if (word.match(/^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/i)) {
                        const month = word;
                        const day = wordsArray[i + 1];
                        const year = wordsArray[i + 2];

                        if (day && year &&
                            day.replace(',', '').match(/^\d{1,2}$/) &&
                            year.match(/^\d{4}$/)) {
                            const monthNum = getMonthNumber(month);
                            const dayNum = day.replace(',', '');
                            expiryDate = `${dayNum.padStart(2, '0')}-${monthNum.padStart(2, '0')}-${year}`;
                            break;
                        }
                    }
                }
            }

            // If no date found in individual words, check the full text
            if (!expiryDate) {
                const fullTextDateMatch = extractedText.match(/\d{1,2}[-/]\d{1,2}[-/]\d{4}|\d{4}[-/]\d{1,2}[-/]\d{1,2}/);
                if (fullTextDateMatch) {
                    expiryDate = formatDateString(fullTextDateMatch[0]);
                }
            }
        }

        // Helper function to convert date formats to DD-MM-YYYY
        function formatDateString(dateStr) {
            try {
                if (dateStr.match(/^\d{1,2}[-/]\d{1,2}[-/]\d{4}$/)) {
                    const parts = dateStr.split(/[-/]/);
                    const day = parts[0].padStart(2, '0');
                    const month = parts[1].padStart(2, '0');
                    const year = parts[2];
                    return `${day}-${month}-${year}`;
                }

                if (dateStr.match(/^\d{4}[-/]\d{1,2}[-/]\d{1,2}$/)) {
                    const parts = dateStr.split(/[-/]/);
                    const year = parts[0];
                    const month = parts[1].padStart(2, '0');
                    const day = parts[2].padStart(2, '0');
                    return `${day}-${month}-${year}`;
                }

                return dateStr;
            } catch (error) {
                console.error('Date formatting error:', error);
                return dateStr;
            }
        }

        // Helper function to get month number
        function getMonthNumber(monthName) {
            const months = {
                'jan': '01', 'feb': '02', 'mar': '03', 'apr': '04',
                'may': '05', 'jun': '06', 'jul': '07', 'aug': '08',
                'sep': '09', 'oct': '10', 'nov': '11', 'dec': '12'
            };
            return months[monthName.toLowerCase().substring(0, 3)] || '01';
        }

        const result = {
            vendorName: vendorName || '',
            amount: amount || '',
            dateReceived: '',
            expiryDate: expiryDate || '',
            groupName: groupName || '', // Add group name to the result
        };

        console.log('Processed OCR data:', result);
        return result;
    };

    const handleBackPress = () => {
        if (showAddForm) {
            setShowAddForm(false);
            setSelectedFiles([]);
            setSelectedCategory(null);
            setCombinedOcrData({
                vendorName: '',
                amount: '',
                dateReceived: '',
                expiryDate: '',
                groupName: '',
            });
            setOcrData(null);
            return;
        }

        // if (showUploadOptions) {
        //     setShowUploadOptions(false);
        //     return;
        // }

        // if (selectedFiles.length > 0 && selectedCategory) {
        //     setSelectedFiles([]);
        //     setCombinedOcrData({
        //         vendorName: '',
        //         amount: '',
        //         dateReceived: '',
        //         expiryDate: '',
        //         groupName: '',
        //     });
        //     setOcrData(null);
        //     return;
        // }

        // if (selectedCategory) {
        //     setSelectedCategory(null);
        //     return;
        // }
        navigation.goBack();
    };

    const handleCameraLaunch = async () => {
        const hasPermission = await requestCameraPermission();

        if (!hasPermission) {
            Toast.show({
                type: 'error',
                text1: 'Permission Denied',
                text2: 'Camera permission is required to take photos.',
                position: 'top',
                topOffset: 130,
                visibilityTime: 3000,
            });
            return;
        }

        const options = {
            mediaType: 'photo',
            includeBase64: false,
            maxHeight: 2000,
            maxWidth: 2000,
            quality: 0.8,
        };

        launchCamera(options, async (response) => {
            if (response.didCancel) {
                console.log('User cancelled camera');
            } else if (response.errorMessage) {
                console.log('Camera Error: ', response.errorMessage);
                Toast.show({
                    type: 'error',
                    text1: 'Error',
                    text2: 'Failed to open camera',
                    position: 'top',
                    topOffset: 130,
                    visibilityTime: 3000,
                });
            } else if (response.assets && response.assets[0]) {
                const asset = response.assets[0];
                const fileData = {
                    type: 'camera',
                    name: asset.fileName || `Camera Photo ${selectedFiles.length + 1}`,
                    uri: asset.uri,
                    fileSize: asset.fileSize,
                    mimeType: asset.type,
                    icon: '📷',
                    timestamp: new Date().toLocaleString(),
                };

                setSelectedFiles(prev => [...prev, fileData]);
                setShowUploadOptions(false);

                await callOCRAPI(asset.uri);

                setTimeout(() => {
                    checkMissingFieldsAndPrompt();
                }, 1000);
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

        launchImageLibrary(options, async (response) => {
            if (response.didCancel) {
                console.log('User cancelled gallery');
            } else if (response.errorMessage) {
                console.log('Gallery Error: ', response.errorMessage);
                Toast.show({
                    type: 'error',
                    text1: 'Error',
                    text2: 'Failed to open gallery',
                    position: 'top',
                    topOffset: 130,
                    visibilityTime: 3000,
                });
            } else if (response.assets && response.assets[0]) {
                const asset = response.assets[0];
                const fileData = {
                    type: 'gallery',
                    name: asset.fileName || `Gallery Photo ${selectedFiles.length + 1}`,
                    uri: asset.uri,
                    fileSize: asset.fileSize,
                    mimeType: asset.type,
                    icon: '🖼️',
                    timestamp: new Date().toLocaleString(),
                };

                setSelectedFiles(prev => [...prev, fileData]);
                setShowUploadOptions(false);

                await callOCRAPI(asset.uri);

                setTimeout(() => {
                    checkMissingFieldsAndPrompt();
                }, 1000);
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

            const fileData = {
                type: 'document',
                name: result.name,
                uri: result.uri,
                fileSize: result.size,
                mimeType: result.type,
                icon: getFileIcon(result.type),
                timestamp: new Date().toLocaleString(),
            };

            setSelectedFiles(prev => [...prev, fileData]);
            setShowUploadOptions(false);

            if (result.type?.includes('image')) {
                await callOCRAPI(result.uri);

                setTimeout(() => {
                    checkMissingFieldsAndPrompt();
                }, 1000);
            }
        } catch (err) {
            if (DocumentPicker.isCancel(err)) {
                console.log('User cancelled document picker');
            } else {
                console.log('Document Picker Error: ', err);
                Toast.show({
                    type: 'error',
                    text1: 'Error',
                    text2: 'Failed to pick document',
                    position: 'top',
                    topOffset: 130,
                    visibilityTime: 3000,
                });
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
        if (selectedFiles.length === 0) {
            Toast.show({
                type: 'error',
                text1: 'Missing File',
                text2: 'Please select at least one image or file to upload',
                position: 'top',
                topOffset: 130,
                visibilityTime: 3000,
            });
            return;
        }
        setShowAddForm(true);
    };

    const removeSelectedFile = (indexToRemove = null) => {
        if (indexToRemove !== null) {
            setSelectedFiles(prev => prev.filter((_, index) => index !== indexToRemove));
        } else {
            setSelectedFiles([]);
            setCombinedOcrData({
                vendorName: '',
                amount: '',
                dateReceived: '',
                expiryDate: '',
                groupName: '',
            });
        }
        setShowAddForm(false);
    };


    const checkMissingFieldsAndPrompt = () => {
        const missingFields = [];

        if (selectedCategory === 'receipt') {
            // Fields for receipt
            if (!combinedOcrData.vendorName) missingFields.push('Vendor Name');
            if (!combinedOcrData.amount) missingFields.push('Amount');
            if (!combinedOcrData.dateReceived) missingFields.push('Date Received');
            if (!combinedOcrData.expiryDate) missingFields.push('Expiry Date');
            if (!combinedOcrData.groupName) missingFields.push('Category');
        } else if (selectedCategory === 'medicine') {
            // Fields for medicine
            if (!combinedOcrData.medicineName) missingFields.push('Medicine Name');
            if (!combinedOcrData.validUntil) missingFields.push('Valid Until');
        }

        if (missingFields.length > 0) {
            Alert.alert(
                'Missing Information',
                `The following fields are missing: ${missingFields.join(', ')}. Would you like to upload another image to fill the remaining fields?`,
                [
                    {
                        text: 'No, I\'ll fill manually',
                        onPress: () => setShowAddForm(true),
                        style: 'cancel'
                    },
                    {
                        text: 'Yes, upload another image',
                        onPress: () => setShowUploadOptions(true)
                    }
                ]
            );
        } else {
            setShowAddForm(true);
        }
    };

    const combineOcrData = (newOcrData) => {
        setCombinedOcrData(prevData => ({
            vendorName: prevData.vendorName || newOcrData.vendorName || '',
            amount: prevData.amount || newOcrData.amount || '',
            dateReceived: prevData.dateReceived || newOcrData.dateReceived || '',
            expiryDate: prevData.expiryDate || newOcrData.expiryDate || '',
            groupName: prevData.groupName || newOcrData.groupName || '',
            medicineName: prevData.medicineName || newOcrData.medicineName || '',
            validUntil: prevData.validUntil || newOcrData.validUntil || '',
        }));
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
                    <Text style={styles.headerTitle}>Add Receipt / Medicine</Text>
                </View>
                {/* Inverted U Shape Bottom */}
                <View style={styles.invertedUBottom} />
            </View>

            {/* OCR Processing Indicator */}
            {isProcessingOCR && (
                <View style={styles.processingContainer}>
                    <ActivityIndicator size="large" color="#7C3AED" />
                    <Text style={styles.processingText}>Processing receipt data...</Text>
                </View>
            )}

            {/* Form Content */}
            <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
                <View style={styles.formContainer}>
                    {/* Initial Category Selection */}
                    {!showAddForm && selectedFiles.length === 0 && !showUploadOptions && !selectedCategory && (
                        <View style={styles.formSection}>
                            <Text style={styles.sectionLabel}>Select Category</Text>

                            <TouchableOpacity
                                style={styles.categoryButton}
                                onPress={() => setSelectedCategory('receipt')}
                            >
                                <Text style={styles.categoryButtonIcon}>🧾</Text>
                                <Text style={styles.categoryButtonText}>Receipt</Text>
                                <Text style={styles.categoryButtonSubtext}>General receipts and bills</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.categoryButton}
                                onPress={() => setSelectedCategory('medicine')}
                            >
                                <Text style={styles.categoryButtonIcon}>💊</Text>
                                <Text style={styles.categoryButtonText}>Medicine</Text>
                                <Text style={styles.categoryButtonSubtext}>Medicines</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {selectedCategory && !showAddForm && selectedFiles.length === 0 && !showUploadOptions && (
                        <View style={styles.formSection}>
                            <Text style={styles.sectionLabel}>Selected Category</Text>

                            <View style={styles.categoryButton}>
                                <Text style={styles.categoryButtonIcon}>
                                    {selectedCategory === 'receipt' ? '🧾' : '💊'}
                                </Text>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.categoryButtonText}>
                                        {selectedCategory === 'receipt' ? 'Receipt' : 'Medicine'}
                                    </Text>
                                    <Text style={styles.categoryButtonSubtext}>
                                        {selectedCategory === 'receipt' ? 'General receipts and bills' : 'Medicines'}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    )}
                    {/* Entry Method Selection */}
                    {selectedCategory && !showAddForm && selectedFiles.length === 0 && !showUploadOptions && (
                        <View style={styles.formSection}>
                            <Text style={styles.sectionLabel}>
                                How would you like to add your {selectedCategory}?
                            </Text>

                            <TouchableOpacity
                                style={styles.methodButton}
                                onPress={() => setShowUploadOptions(true)}
                            >
                                <Text style={styles.methodButtonIcon}>📸</Text>
                                <Text style={styles.methodButtonText}>Upload File</Text>
                                <Text style={styles.methodButtonSubtext}>Take photo or upload document</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.methodButton}
                                onPress={() => {
                                    if (selectedCategory === 'receipt') {
                                        setShowAddForm(true);
                                    } else if (selectedCategory === 'medicine') {
                                        // Navigate to AddMedicine page
                                        navigation.navigate('AddMedicine');
                                    }
                                }}
                            >
                                <Text style={styles.methodButtonIcon}>✍️</Text>
                                <Text style={styles.methodButtonText}>Manual Entry</Text>
                                <Text style={styles.methodButtonSubtext}>Enter details manually</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.backToSelectionButton}
                                onPress={() => setSelectedCategory(null)}
                            >
                                <Text style={styles.backToSelectionButtonText}>Back to Category Selection</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* File Upload Section */}
                    {selectedCategory && (selectedFiles.length > 0 || showUploadOptions) && (
                        <View style={styles.formSection}>
                            <Text style={styles.sectionLabel}>
                                {selectedCategory === 'receipt' ? 'Receipt' : 'Medicine'} Attachment
                            </Text>

                            {selectedFiles.length === 0 ? (
                                <TouchableOpacity
                                    style={styles.uploadButton}
                                    onPress={() => setShowUploadOptions(true)}
                                >
                                    <Text style={styles.uploadIcon}>📎</Text>
                                    <Text style={styles.uploadButtonText}>Pick an Upload Option</Text>
                                    <Text style={styles.uploadButtonSubtext}>Camera • Gallery • Document</Text>
                                </TouchableOpacity>
                            ) : (
                                <View>
                                    {selectedFiles.map((file, index) => (
                                        <View key={index} style={styles.selectedFileCard}>
                                            <View style={styles.selectedFileInfo}>
                                                {file.uri && (file.type === 'camera' || file.type === 'gallery') ? (
                                                    <Image source={{ uri: file.uri }} style={styles.selectedFilePreview} />
                                                ) : (
                                                    <Text style={styles.selectedFileIcon}>{file.icon}</Text>
                                                )}
                                                <View style={styles.selectedFileDetails}>
                                                    <Text style={styles.selectedFileName}>{file.name}</Text>
                                                    <Text style={styles.selectedFileType}>
                                                        {file.fileSize ? formatFileSize(file.fileSize) : 'Unknown size'}
                                                    </Text>
                                                    <Text style={styles.selectedFileTimestamp}>Added: {file.timestamp}</Text>
                                                </View>
                                            </View>
                                            <TouchableOpacity
                                                style={styles.removeFileButton}
                                                onPress={() => removeSelectedFile(index)}
                                            >
                                                <Text style={styles.removeFileText}>✕</Text>
                                            </TouchableOpacity>
                                        </View>
                                    ))}
                                    <TouchableOpacity
                                        style={styles.addMoreButton}
                                        onPress={() => setShowUploadOptions(true)}
                                    >
                                        <Text style={styles.addMoreButtonText}>+ Add Another Image</Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                        </View>
                    )}

                    {/* Add Receipt/Medicine Button */}
                    {selectedCategory && selectedFiles.length > 0 && !showAddForm && (
                        <TouchableOpacity
                            style={[
                                styles.addReceiptButton,
                                isProcessingOCR && styles.addReceiptButtonDisabled
                            ]}
                            onPress={handleAddReceipt}
                            disabled={isProcessingOCR}
                        >
                            <Text style={styles.addReceiptButtonIcon}>✓</Text>
                            <Text style={styles.addReceiptButtonText}>
                                Add {selectedCategory === 'receipt' ? 'Receipt' : 'Medicine'}
                            </Text>
                        </TouchableOpacity>
                    )}

                    {/* Add Form */}
                    {showAddForm && selectedCategory === 'receipt' && (
                        <AddForm
                            navigation={navigation}
                            ocrData={combinedOcrData}
                            selectedFile={selectedFiles}
                            onSave={(data) => {
                                setShowAddForm(false);
                            }}
                        />
                    )}

                    {showAddForm && selectedCategory === 'medicine' && (
                        <MedicalAddForm
                            navigation={navigation}
                            ocrData={combinedOcrData}
                            selectedFile={selectedFiles}
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
    processingContainer: {
        backgroundColor: '#F3F4F6',
        padding: 16,
        margin: 16,
        borderRadius: 8,
        alignItems: 'center',
    },
    processingText: {
        marginTop: 8,
        fontSize: 14,
        color: '#7C3AED',
        fontWeight: '500',
    },
    ocrStatusText: {
        fontSize: 12,
        color: '#10B981',
        marginTop: 4,
        fontWeight: '500',
    },
    addMoreButton: {
        backgroundColor: '#F3F4F6',
        borderRadius: 8,
        padding: 12,
        marginTop: 8,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderStyle: 'dashed',
    },
    addMoreButtonText: {
        color: '#6B7280',
        fontSize: 14,
        fontWeight: '500',
    },
    categoryButton: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 20,
        marginBottom: 16,
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
    categoryButtonIcon: {
        fontSize: 32,
        marginRight: 16,
    },
    categoryButtonText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        flex: 1,
    },
    categoryButtonSubtext: {
        fontSize: 14,
        color: '#666',
        marginTop: 4,
    },
    methodButton: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 20,
        marginBottom: 16,
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
    methodButtonIcon: {
        fontSize: 28,
        marginRight: 16,
    },
    methodButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        flex: 1,
    },
    methodButtonSubtext: {
        fontSize: 14,
        color: '#666',
        marginTop: 4,
    },
    backToSelectionButton: {
        backgroundColor: '#F3F4F6',
        borderRadius: 8,
        padding: 12,
        marginTop: 8,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    backToSelectionButtonText: {
        color: '#6B7280',
        fontSize: 14,
        fontWeight: '500',
    },
});

export default AddReceipt;