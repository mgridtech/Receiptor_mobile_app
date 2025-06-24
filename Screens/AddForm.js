import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, ScrollView, Platform } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { createReceipt } from '../Services/Services';
import AsyncStorage from '@react-native-async-storage/async-storage';

const groupOptions = ['Household Essentials', 'Groceries', 'Electronics', 'Medical'];

const getCurrentDate = () => {
    const today = new Date();
    const day = today.getDate().toString().padStart(2, '0');
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    const year = today.getFullYear();
    return `${day}-${month}-${year}`;
};

const AddForm = ({ navigation, ocrData, selectedFile, onSave }) => {
    const [formData, setFormData] = useState({
        groupName: '',
        vendorName: '',
        dateReceived: getCurrentDate(),
        amount: '',
        wore: '',
        note: '',
    });
    const [showDatePicker, setShowDatePicker] = useState(false);

    useEffect(() => {
        if (ocrData) {
            setFormData(prevData => ({
                ...prevData,
                groupName: ocrData.groupName || prevData.groupName, // Auto-select group if detected
                vendorName: ocrData.vendorName || prevData.vendorName,
                amount: ocrData.amount || prevData.amount,
                dateReceived: formatDateForForm(ocrData.dateReceived) || prevData.dateReceived,
                wore: formatDateForForm(ocrData.expiryDate) || prevData.wore,
            }));
        }
    }, [ocrData]);

    const formatDateForForm = (dateString) => {
        if (!dateString) return null;

        try {
            let date;

            if (dateString.match(/^\d{2}-\d{2}-\d{4}$/)) {
                return dateString;
            }

            if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
                const [year, month, day] = dateString.split('-');
                return `${day}-${month}-${year}`;
            }

            if (dateString.match(/^\d{1,2}\/\d{1,2}\/\d{4}$/)) {
                const [month, day, year] = dateString.split('/');
                return `${day.padStart(2, '0')}-${month.padStart(2, '0')}-${year}`;
            }

            date = new Date(dateString);
            if (!isNaN(date.getTime())) {
                const day = date.getDate().toString().padStart(2, '0');
                const month = (date.getMonth() + 1).toString().padStart(2, '0');
                const year = date.getFullYear();
                return `${day}-${month}-${year}`;
            }

            return null;
        } catch (error) {
            console.error('Date formatting error:', error);
            return null;
        }
    };
    const formatDateForAPI = (dateStr) => {
        if (!dateStr) return null;
        const [day, month, year] = dateStr.split('-');
        return `${year}-${month}-${day}`;
    };
    const getCategoryId = (groupName) => {
        const categoryMap = {
            'Household Essentials': 1,
            'Groceries': 2,
            'Electronics': 3,
            'Medical': 4
        };
        return categoryMap[groupName] || 1;
    };

    const handleSave = async (retryCount = 0) => {
        if (
            !formData.groupName ||
            formData.groupName === "" ||
            !formData.vendorName.trim() ||
            !formData.dateReceived ||
            !formData.amount.trim()
        ) {
            Alert.alert('Error', 'Please fill all required fields.');
            return;
        }

        try {
            // Get userId from AsyncStorage
            const firebaseUserId = await AsyncStorage.getItem('firebaseUserId');
            if (!firebaseUserId) {
                Alert.alert('Error', 'User authentication required. Please login again.');
                return;
            }

            console.log('Starting receipt save process... Attempt:', retryCount + 1);
            console.log('Form data:', formData);

            const apiFormData = new FormData();

            // Optimize file handling
            if (selectedFile) {
                console.log('Adding file to FormData:', selectedFile.name);

                // Check file size (reduce to 2MB for better performance)
                const maxFileSize = 2 * 1024 * 1024; // 2MB limit
                if (selectedFile.size && selectedFile.size > maxFileSize) {
                    Alert.alert('Error', 'File size too large. Please select a smaller image (max 2MB).');
                    return;
                }

                apiFormData.append('receiptFile', {
                    uri: selectedFile.uri,
                    type: selectedFile.mimeType || 'image/jpeg',
                    name: selectedFile.name || 'receipt.jpg',
                });
            }

            const purchaseDate = formatDateForAPI(formData.dateReceived);
            const validUntilDate = formatDateForAPI(formData.wore || formData.dateReceived);
            const categoryId = getCategoryId(formData.groupName);

            console.log('Formatted dates - Purchase:', purchaseDate, 'Valid Until:', validUntilDate);
            console.log('Category ID:', categoryId);

            // Add all form fields (removed userId)
            apiFormData.append('vendorName', formData.vendorName.trim());
            apiFormData.append('note', formData.note?.trim() || '');
            apiFormData.append('purchaseDate', purchaseDate);
            apiFormData.append('totalAmount', formData.amount.trim());
            apiFormData.append('validUntil', validUntilDate);
            apiFormData.append('categoryId', categoryId.toString());

            if (formData.groupName.toLowerCase() === 'medical' && formData.medicines) {
                apiFormData.append('medicines', JSON.stringify(formData.medicines));
            }

            console.log('Calling API...');

            const response = await createReceipt(apiFormData);
            console.log('API call successful:', response);

            Alert.alert('Success', 'Receipt saved successfully!');

            if (onSave) onSave(formData);

            // Navigate based on category
            if (formData.groupName.toLowerCase() === 'medical') {
                navigation.navigate('MedicalReceipts');
            } else {
                navigation.navigate('ReceiptsList');
            }
        } catch (error) {
            console.error('Error saving receipt:', error);

            // Retry logic for database timeouts
            if (error.message.includes('Database connection timeout') && retryCount < 2) {
                Alert.alert(
                    'Retry?',
                    `Database is busy. Attempt ${retryCount + 1} failed. Try again?`,
                    [
                        { text: 'Cancel', style: 'cancel' },
                        {
                            text: 'Retry',
                            onPress: () => {
                                setTimeout(() => handleSave(retryCount + 1), 2000); // Wait 2 seconds before retry
                            }
                        }
                    ]
                );
                return;
            }

            // Show user-friendly error messages
            let errorMessage = 'Failed to save receipt. Please try again.';

            if (error.message.includes('Database connection timeout')) {
                errorMessage = 'Database is currently busy. Please try again in a few minutes.';
            } else if (error.message.includes('Server is temporarily unavailable')) {
                errorMessage = 'Server is temporarily unavailable. Please try again later.';
            } else if (error.message.includes('authentication')) {
                errorMessage = 'Authentication failed. Please login again.';
            } else if (error.message.includes('Invalid data format')) {
                errorMessage = 'Please check your input data and try again.';
            }

            Alert.alert('Error', errorMessage);
        }
    };

    const parseDate = (dateStr) => {
        if (!dateStr) return new Date();
        const [day, month, year] = dateStr.split('-');
        return new Date(`${year}-${month}-${day}`);
    };

    return (
        <View style={{ flex: 1 }}>
            <ScrollView
                contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 16 }}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                <View style={{
                    backgroundColor: '#fff',
                    borderRadius: 16,
                    padding: 24,
                    width: '100%',
                    maxWidth: 500,
                    alignSelf: 'center',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.08,
                    shadowRadius: 8,
                    elevation: 4,
                }}>

                    <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 16 }}>Add Receipt</Text>

                    {/* Show OCR status if data was extracted */}
                    {ocrData && (
                        <View style={{
                            backgroundColor: '#F0FDF4',
                            borderColor: '#10B981',
                            borderWidth: 1,
                            borderRadius: 8,
                            padding: 12,
                            marginBottom: 16,
                        }}>
                            <Text style={{ color: '#059669', fontSize: 14, fontWeight: '500' }}>
                                ✓ Receipt data extracted automatically. Please verify and edit if needed.
                            </Text>
                        </View>
                    )}

                    <Text>Group Name *</Text>
                    <View style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 8, marginBottom: 12 }}>
                        <Picker
                            selectedValue={formData.groupName}
                            onValueChange={itemValue => setFormData({ ...formData, groupName: itemValue })}
                            style={{ color: '#000' }}
                            dropdownIconColor="#000"
                        >
                            <Picker.Item label="Select group" value="" enabled={false} />
                            {groupOptions.map(option => (
                                <Picker.Item key={option} label={option} value={option} />
                            ))}
                        </Picker>
                    </View>

                    <Text>Vendor Name *</Text>
                    <TextInput
                        style={{
                            borderWidth: 1,
                            borderColor: ocrData?.vendorName ? '#10B981' : '#ccc',
                            borderRadius: 8,
                            marginBottom: 12,
                            padding: 8,
                            backgroundColor: ocrData?.vendorName ? '#F0FDF4' : '#fff'
                        }}
                        value={formData.vendorName}
                        onChangeText={text => setFormData({ ...formData, vendorName: text })}
                        placeholder="Enter vendor name"
                    />

                    <Text>Date Received *</Text>
                    <TouchableOpacity
                        style={{
                            borderWidth: 1,
                            borderColor: ocrData?.dateReceived ? '#10B981' : '#ccc',
                            borderRadius: 8,
                            marginBottom: 12,
                            padding: 8,
                            backgroundColor: ocrData?.dateReceived ? '#F0FDF4' : '#fff'
                        }}
                        onPress={() => setShowDatePicker('dateReceived')}
                        activeOpacity={0.7}
                    >
                        <Text style={{ color: formData.dateReceived ? '#1f2937' : '#aaa' }}>
                            {formData.dateReceived ? formData.dateReceived : 'Select date'}
                        </Text>
                    </TouchableOpacity>
                    {showDatePicker && (
                        <DateTimePicker
                            value={formData.dateReceived ? parseDate(formData.dateReceived) : new Date()}
                            mode="date"
                            display="default"
                            onChange={(event, date) => {
                                setShowDatePicker(null);
                                if (event.type === 'set' && date) {
                                    const formatted = `${date.getDate().toString().padStart(2, '0')}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getFullYear()}`;
                                    setFormData({ ...formData, dateReceived: formatted });
                                }
                            }}
                        />
                    )}

                    <Text>Amount *</Text>
                    <TextInput
                        style={{
                            borderWidth: 1,
                            borderColor: ocrData?.amount ? '#10B981' : '#ccc',
                            borderRadius: 8,
                            marginBottom: 12,
                            padding: 8,
                            backgroundColor: ocrData?.amount ? '#F0FDF4' : '#fff'
                        }}
                        value={formData.amount}
                        onChangeText={text => setFormData({ ...formData, amount: text })}
                        keyboardType="numeric"
                        placeholder="Enter amount"
                    />

                    <Text>Warranty or Expiry</Text>
                    <TouchableOpacity
                        style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 8, marginBottom: 12, padding: 8 }}
                        onPress={() => setShowDatePicker('wore')}
                        activeOpacity={0.7}
                    >
                        <Text style={{ color: formData.wore ? '#1f2937' : '#aaa' }}>
                            {formData.wore ? formData.wore : 'Select expiry/warranty date'}
                        </Text>
                    </TouchableOpacity>

                    {showDatePicker === 'wore' && (
                        <DateTimePicker
                            value={formData.wore ? parseDate(formData.wore) : new Date()}
                            mode="date"
                            display="default"
                            onChange={(event, date) => {
                                setShowDatePicker(null);
                                if (event.type === 'set' && date) {
                                    const formatted = `${date.getDate().toString().padStart(2, '0')}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getFullYear()}`;
                                    setFormData({ ...formData, wore: formatted });
                                }
                            }}
                        />
                    )}

                    <Text>Note (optional)</Text>
                    <TextInput
                        style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 8, marginBottom: 20, padding: 8 }}
                        value={formData.note}
                        onChangeText={text => setFormData({ ...formData, note: text })}
                        placeholder="Add a note"
                    />

                    <TouchableOpacity
                        style={{
                            backgroundColor: '#7C3AED',
                            padding: 12,
                            borderRadius: 8,
                            alignItems: 'center'
                        }}
                        onPress={handleSave}
                    >
                        <Text style={{ color: '#fff', fontWeight: 'bold' }}>Save</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </View>
    );
};

export default AddForm;