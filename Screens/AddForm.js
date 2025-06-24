import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, ScrollView, Platform } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';

const groupOptions = ['Household Essentials', 'Groceries', 'Electronics', 'Medical'];

const AddForm = ({ navigation, onSave }) => {
    const [formData, setFormData] = useState({
        groupName: '',
        vendorName: 'Walmart',
        dateReceived: '18-06-2024',
        amount: '150.00',
        wore: '15-09-2027',
        note: '',
    });
    const [showDatePicker, setShowDatePicker] = useState(false);


    const handleDateChange = (event, selectedDate) => {
        setShowDatePicker(false);
        if (selectedDate) {
            setFormData({
                ...formData,
                dateReceived: selectedDate.toISOString().split('T')[0],
            });
        }
    };

    const handleSave = () => {
        if (
            !formData.groupName ||
            formData.groupName === "" ||
            !formData.vendorName.trim() ||
            !formData.dateReceived ||
            !formData.amount.trim()
        ) {
            Alert.alert('Error', 'Please fill all required fields.');
            return;
        } if (onSave) onSave(formData);

        if (formData.groupName.toLowerCase() === 'medical') {
            navigation.navigate('MedicalReceipts');
        } else {
            navigation.navigate('ReceiptsList');
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
                <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 24, width: '100%', maxWidth: 500, alignSelf: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 4, }}>

                    <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 16 }}>Add Receipt</Text>

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
                        style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 8, marginBottom: 12, padding: 8 }}
                        value={formData.vendorName}
                        onChangeText={text => setFormData({ ...formData, vendorName: text })}
                        placeholder="Enter vendor name"
                    />

                    <Text>Date Received *</Text>
                    <TouchableOpacity
                        style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 8, marginBottom: 12, padding: 8 }}
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
                        style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 8, marginBottom: 12, padding: 8 }}
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