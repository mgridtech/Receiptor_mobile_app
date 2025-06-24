import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, ScrollView, Platform } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { createReceipt } from '../Services/Services';

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

    const handleSave = async () => {
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
            const apiFormData = new FormData();

            if (selectedFile) {
                apiFormData.append('receiptFile', {
                    uri: selectedFile.uri,
                    type: selectedFile.mimeType || 'image/jpeg',
                    name: selectedFile.name || 'receipt.jpg',
                });
            }

            apiFormData.append('vendorName', formData.vendorName);
            apiFormData.append('note', formData.note || '');
            apiFormData.append('purchaseDate', formData.dateReceived);
            apiFormData.append('totalAmount', formData.amount);
            apiFormData.append('validUntil', formData.expiryDate || formData.dateReceived);
            apiFormData.append('userId', '1');
            apiFormData.append('categoryId', formData.groupName.toLowerCase() === 'medical' ? '1' : '2');

            if (formData.groupName.toLowerCase() === 'medical' && formData.medicines) {
                apiFormData.append('medicines', JSON.stringify(formData.medicines));
            }

            const response = await createReceipt(apiFormData);

            Alert.alert('Success', 'Receipt saved successfully!');

            if (onSave) onSave(formData);

            if (formData.groupName.toLowerCase() === 'medical') {
                navigation.navigate('MedicalReceipts');
            } else {
                navigation.navigate('ReceiptsList');
            }
        } catch (error) {
            console.error('Error saving receipt:', error);
            Alert.alert('Error', 'Failed to save receipt. Please try again.');
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