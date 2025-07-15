import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { createReceipt, fetchCategories } from '../Services/Services';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DropDownPicker from 'react-native-dropdown-picker';
import Toast from 'react-native-toast-message';

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
    const [categories, setCategories] = useState([]);
    const [loadingCategories, setLoadingCategories] = useState(true);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [dropdownItems, setDropdownItems] = useState([]);
    const [dropdownValue, setDropdownValue] = useState(null);
    const [amountError, setAmountError] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (categories.length > 0) {
            const formattedItems = categories.map(cat => ({
                label: cat.name,
                value: cat.name
            }));
            setDropdownItems(formattedItems);
        }
    }, [categories]);

    useEffect(() => {
        setDropdownValue(formData.groupName);
    }, [formData.groupName]);

    useEffect(() => {
        const getCategories = async () => {
            try {
                const token = await AsyncStorage.getItem('userToken');
                if (!token) {
                    Toast.show({
                        type: 'error',
                        text1: 'Error',
                        text2: 'Authentication token not found',
                        position: 'top',
                        topOffset: 130,
                        visibilityTime: 3000,
                    });
                    return;
                }

                const response = await fetchCategories(token);
                if (response.success) {
                    setCategories(response.data);
                } else {
                    console.error('Failed to fetch categories:', response.error);
                    Toast.show({
                        type: 'error',
                        text1: 'Error',
                        text2: 'Failed to load categories',
                        position: 'top',
                        topOffset: 130,
                        visibilityTime: 3000,
                    });
                }
            } catch (error) {
                console.error('Error fetching categories:', error);
                Toast.show({
                    type: 'error',
                    text1: 'Error',
                    text2: 'Failed to load categories',
                    position: 'top',
                    topOffset: 130,
                    visibilityTime: 3000,
                });
            } finally {
                setLoadingCategories(false);
            }
        };

        getCategories();
    }, []);

    useEffect(() => {
        if (ocrData) {
            setFormData(prevData => ({
                ...prevData,
                groupName: ocrData?.groupName || prevData?.groupName,
                vendorName: ocrData?.vendorName || prevData?.vendorName,
                amount: ocrData?.amount || prevData?.amount,
                dateReceived: formatDateForForm(ocrData?.dateReceived) || prevData?.dateReceived,
                wore: formatDateForForm(ocrData?.expiryDate) || prevData?.wore,
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

    const getCategoryId = (categoryName) => {
        const category = categories.find(cat => cat.name === categoryName);
        return category ? category.id : (categories.length > 0 ? categories[0].id : 1);
    };

    const handleSave = async () => {
        if (!formData.groupName || !formData.vendorName.trim() || !formData.dateReceived || !formData.amount.trim()) {
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Please fill all required fields.',
                position: 'top',
                topOffset: 130,
                visibilityTime: 3000,
            });
            return;
        }

        setSaving(true);

        try {
            const userToken = await AsyncStorage.getItem('userToken');
            if (!userToken) {
                Toast.show({
                    type: 'error',
                    text1: 'Error',
                    text2: 'Please login again.',
                    position: 'top',
                    topOffset: 130,
                    visibilityTime: 3000,
                });
                return;
            }

            const apiFormData = new FormData();

            if (selectedFile && selectedFile.length > 0) {
                const file = selectedFile[0];
                const maxFileSize = 2 * 1024 * 1024;

                if (file.size && file.size > maxFileSize) {
                    Toast.show({
                        type: 'error',
                        text1: 'Error',
                        text2: 'File too large. Max 2MB allowed.',
                        position: 'top',
                        topOffset: 130,
                        visibilityTime: 3000,
                    });
                    return;
                }
                apiFormData.append('receiptFile', {
                    uri: file.uri,
                    type: file.mimeType || 'image/jpeg',
                    name: file.name || 'receipt.jpg',
                });
            }

            const purchaseDate = new Date(parseDate(formData.dateReceived)).toISOString().split('T')[0];
            const validUntilDate = new Date(parseDate(formData.wore || formData.dateReceived)).toISOString().split('T')[0];
            const categoryId = getCategoryId(formData.groupName);

            apiFormData.append('categoryId', categoryId.toString());
            apiFormData.append('vendorName', formData.vendorName.trim());
            apiFormData.append('note', formData.note?.trim() || '');
            apiFormData.append('purchaseDate', purchaseDate);
            apiFormData.append('totalAmount', formData.amount.trim());
            apiFormData.append('validUntil', validUntilDate);

            console.log('Saving receipt...');
            const response = await createReceipt(apiFormData, userToken);

            Toast.show({
                type: 'success',
                text1: 'Success',
                text2: response.message || 'Receipt saved successfully!',
                position: 'top',
                topOffset: 130,
                visibilityTime: 3000,
                onHide: () => {
                    if (onSave) onSave(formData);

                    if (formData.groupName.toLowerCase() === 'medicine') {
                        navigation.navigate('MedicalReceipts');
                    } else {
                        navigation.navigate('ReceiptsList');
                    }
                },
            });

        } catch (error) {
            console.error('Save error:', error);
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: error.message || 'Failed to save receipt.',
                position: 'top',
                topOffset: 130,
                visibilityTime: 3000,
            });
        } finally {
            setSaving(false);
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
                    <View style={{ zIndex: dropdownOpen ? 1000 : 1, marginBottom: dropdownOpen ? 170 : 20 }}>
                        <DropDownPicker
                            open={dropdownOpen}
                            value={dropdownValue}
                            items={dropdownItems}
                            setOpen={setDropdownOpen}
                            setValue={(callback) => {
                                const value = callback(dropdownValue);
                                setDropdownValue(value);
                                setFormData({ ...formData, groupName: value });
                            }}
                            setItems={setDropdownItems}
                            placeholder={loadingCategories ? 'Loading categories...' : 'Select category'}
                            disabled={loadingCategories}
                            listMode="SCROLLVIEW"
                            style={{
                                borderColor: '#ccc',
                                borderRadius: 8,
                                backgroundColor: '#fff',
                            }}
                            dropDownContainerStyle={{
                                borderColor: '#ccc',
                                zIndex: 999,
                            }}
                        />
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
                        placeholderTextColor={'black'}
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
                        onChangeText={(text) => {
                            const validAmountRegex = /^(\d+)?(\.\d{0,2})?$/;

                            if (text === '' || validAmountRegex.test(text)) {
                                setFormData({ ...formData, amount: text });
                                setAmountError('');
                            } else {
                                setFormData({ ...formData, amount: text });
                                setAmountError('Invalid amount format. Only one decimal point is allowed.');
                            }
                        }}
                        keyboardType="numeric"
                        placeholder="Enter amount"
                        placeholderTextColor={'black'}
                    />
                    {amountError !== '' && (
                        <Text style={{ color: 'red', marginBottom: 8 }}>{amountError}</Text>
                    )}


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
                        placeholderTextColor={'black'}
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
                        <Text style={{ color: '#fff', fontWeight: 'bold' }}>
                            {saving ? 'Saving...' : 'Save'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </View>
    );
};

export default AddForm;