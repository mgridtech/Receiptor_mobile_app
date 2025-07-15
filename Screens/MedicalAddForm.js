import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import DropDownPicker from 'react-native-dropdown-picker';
import Toast from 'react-native-toast-message';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createMedicine } from '../Services/Services';

const MedicalAddForm = ({ navigation, selectedFile, onSave, ocrData }) => {
    const [formData, setFormData] = useState({
        medicineName: '',
        note: '',
        reminderType: '',
        customDays: '',
        reminderDate: new Date(),
        reminderTime: new Date(),
        dailyTime: '',
        weeklyTime: '',
    });

    const [showCustomInput, setShowCustomInput] = useState(false);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showTimePicker, setShowTimePicker] = useState(false);
    const [showTimeInput, setShowTimeInput] = useState(false);
    const [hour, setHour] = useState('');
    const [minute, setMinute] = useState('');
    const [savedTimes, setSavedTimes] = useState([]);
    const [reminderOpen, setReminderOpen] = useState(false);
    const [reminderValue, setReminderValue] = useState(null);
    const [reminderItems, setReminderItems] = useState([]);
    const [validUntil, setValidUntil] = useState(new Date());
    const [showValidUntilPicker, setShowValidUntilPicker] = useState(false);


    const reminderOptions = [
        { label: 'Once', value: 'Once' },
        { label: 'Daily', value: 'Daily' },
        { label: 'Weekly', value: 'Weekly' },
        { label: 'Custom (enter number of days)', value: 'Custom' },
    ];
    useEffect(() => {
        setReminderItems(reminderOptions);
    }, []);


    const handleReminderTypeChange = (value) => {
        setFormData({
            ...formData,
            reminderType: value,
            customDays: '',
            dailyTime: '',
            weeklyTime: ''
        });

        setShowCustomInput(false);
        setShowDatePicker(false);
        setShowTimePicker(false);
        setShowTimeInput(false);

        if (value === 'Custom') {
            setShowCustomInput(true);
        } else if (value === 'Once') {
            setShowDatePicker(true);
        }
    };


    const handleDateChange = (event, selectedDate) => {
        setShowDatePicker(false);

        if (selectedDate) {
            setFormData({ ...formData, reminderDate: selectedDate });
            setShowTimePicker(true);
        }
    };


    const handleTimeChange = (event, selectedTime) => {
        if (Platform.OS === 'android') {
            setShowTimePicker(false);
        }
        if (selectedTime) {
            setFormData({ ...formData, reminderTime: selectedTime });
        }
    };

    const formatDate = (date) => {
        return date.toLocaleDateString();
    };

    const formatTime = (date) => {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };


    const handleSave = async () => {
        if (!formData.medicineName.trim()) {
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Please enter medicine name',
                position: 'top',
                topOffset: 130,
                visibilityTime: 3000,
            });
            return;
        }

        if (!formData.reminderType) {
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Please select reminder type',
                position: 'top',
                topOffset: 130,
                visibilityTime: 3000,
            });
            return;
        }

        if (formData.reminderType === 'Custom' && !formData.customDays.trim()) {
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Please enter number of days for custom reminder',
                position: 'top',
                topOffset: 130,
                visibilityTime: 3000,
            });
            return;
        }

        if ((formData.reminderType === 'Daily' || formData.reminderType === 'Weekly' || formData.reminderType === 'Custom') && savedTimes.length === 0) {
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: `Please add at least one reminder time for ${formData.reminderType.toLowerCase()} reminder`,
                position: 'top',
                topOffset: 130,
                visibilityTime: 3000,
            });
            return;
        }

        try {
            const apiFormData = new FormData();

            apiFormData.append('name', formData.medicineName);
            apiFormData.append('note', formData.note);
            apiFormData.append('validUntil', validUntil.toISOString().split('T')[0]); // Format: YYYY-MM-DD
            apiFormData.append('notifyOnce', formData.reminderType === 'Once' ? 'true' : 'false');

            let notificationDays = 0;
            let notificationTimes = [];
            let specificNotificationDateTimes = [];

            switch (formData.reminderType) {
                case 'Once':
                    notificationDays = 0;
                    notificationTimes = [];
                    const onceDateTime = new Date(formData.reminderDate);
                    const reminderTime = new Date(formData.reminderTime);
                    onceDateTime.setHours(reminderTime.getHours(), reminderTime.getMinutes(), 0, 0);
                    specificNotificationDateTimes = [onceDateTime.toISOString()];
                    break;

                case 'Daily':
                    notificationDays = 1;
                    notificationTimes = savedTimes;
                    break;

                case 'Weekly':
                    notificationDays = 7;
                    notificationTimes = savedTimes;
                    break;

                case 'Custom':
                    notificationDays = parseInt(formData.customDays, 10);
                    notificationTimes = savedTimes;
                    break;
            }

            apiFormData.append('notificationDays', notificationDays.toString());
            apiFormData.append('notificationTimes', JSON.stringify(notificationTimes));
            apiFormData.append('specificNotificationDateTimes', JSON.stringify(specificNotificationDateTimes));

            if (selectedFile && selectedFile.length > 0) {
                const file = selectedFile[0];
                const maxFileSize = 2 * 1024 * 1024; // 2MB limit

                if (file.fileSize && file.fileSize > maxFileSize) {
                    Toast.show({
                        type: 'error',
                        text1: 'Error',
                        text2: 'File too large. Max 2MB allowed.',
                        position: 'top',
                        topOffset: 130,
                        visibilityTime: 3000,
                    });
                    setSaving(false);
                    return;
                }

                apiFormData.append('medicineFile', {
                    uri: file.uri,
                    type: file.mimeType || 'image/jpeg',
                    name: file.name || 'medicine.jpg',
                });
            }

            console.log('API Data being sent:', {
                name: formData.medicineName,
                note: formData.note,
                validUntil: validUntil.toISOString().split('T')[0],
                notifyOnce: formData.reminderType === 'Once' ? 'true' : 'false',
                notificationDays: notificationDays.toString(),
                notificationTimes: JSON.stringify(notificationTimes),
                specificNotificationDateTimes: JSON.stringify(specificNotificationDateTimes)
            });

            const token = await AsyncStorage.getItem('userToken');
            const result = await createMedicine(apiFormData, token);

            console.log('Medicine created successfully:', result);

            if (onSave) {
                onSave(result);
            }

            Toast.show({
                type: 'success',
                text1: 'Success',
                text2: 'Medicine added successfully!',
                position: 'top',
                topOffset: 130,
                visibilityTime: 3000,
                onHide: () => {
                    navigation?.goBack();
                },
            });

        } catch (error) {
            console.error('Error creating medicine:', error);
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: error.message || 'Failed to save medicine',
                position: 'top',
                topOffset: 130,
                visibilityTime: 3000,
            });
        }
    };

    const handleAddTime = () => {
        const hh = parseInt(hour, 10);
        const mm = parseInt(minute, 10);

        if (isNaN(hh) || isNaN(mm)) {
            Toast.show({
                type: 'error',
                text1: 'Invalid Input',
                text2: 'Please enter valid numeric values for hour and minute.',
                position: 'top',
                topOffset: 130,
                visibilityTime: 3000,
            });
            return;
        }

        if (hh < 0 || hh > 23) {
            Toast.show({
                type: 'error',
                text1: 'Invalid Hour',
                text2: 'Please enter an hour between 00 and 23.',
                position: 'top',
                topOffset: 130,
                visibilityTime: 3000,
            });
            return;
        }

        if (mm < 0 || mm > 59) {
            Toast.show({
                type: 'error',
                text1: 'Invalid Minute',
                text2: 'Please enter minutes between 00 and 59.',
                position: 'top',
                topOffset: 130,
                visibilityTime: 3000,
            });
            return;
        }

        if (savedTimes.length >= 3) {
            Toast.show({
                type: 'error',
                text1: 'Limit Reached',
                text2: 'You can only add maximum 3 reminder times.',
                position: 'top',
                topOffset: 130,
                visibilityTime: 3000,
            });
            return;
        }

        const formattedTime = `${hour.padStart(2, '0')}:${minute.padStart(2, '0')}`;
        setSavedTimes(prev => [...prev, formattedTime]);

        setHour('');
        setMinute('');
    };



    const handleDeleteTime = (index) => {
        setSavedTimes(prev => prev.filter((_, i) => i !== index));
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

                    <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 16 }}>Add Medicine</Text>

                    <Text>Medicine Name *</Text>
                    <TextInput
                        style={{
                            borderWidth: 1,
                            borderColor: '#ccc',
                            borderRadius: 8,
                            marginBottom: 12,
                            padding: 8,
                            backgroundColor: '#fff'
                        }}
                        value={formData.medicineName}
                        onChangeText={text => setFormData({ ...formData, medicineName: text })}
                        placeholder="Enter medicine name"
                        placeholderTextColor={'#999'}
                    />

                    <Text>Reminder Type *</Text>
                    <View style={{ zIndex: reminderOpen ? 1000 : 1, marginBottom: reminderOpen ? 180 : 20 }}>
                        <DropDownPicker
                            open={reminderOpen}
                            value={reminderValue}
                            items={reminderItems}
                            setOpen={setReminderOpen}
                            setValue={(callback) => {
                                const value = callback(reminderValue);
                                setReminderValue(value);
                                handleReminderTypeChange(value);
                            }}
                            setItems={setReminderItems}
                            placeholder="Select reminder type"
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


                    {formData.reminderType === 'Once' && (
                        <View>
                            <Text>Date *</Text>
                            <TouchableOpacity
                                style={{
                                    borderWidth: 1,
                                    borderColor: '#ccc',
                                    borderRadius: 8,
                                    marginBottom: 12,
                                    padding: 12,
                                    backgroundColor: '#fff'
                                }}
                                onPress={() => setShowDatePicker(true)}
                            >
                                <Text style={{ color: '#000' }}>
                                    {formatDate(formData.reminderDate)}
                                </Text>
                            </TouchableOpacity>

                            <Text>Time *</Text>
                            <TouchableOpacity
                                style={{
                                    borderWidth: 1,
                                    borderColor: '#ccc',
                                    borderRadius: 8,
                                    marginBottom: 12,
                                    padding: 12,
                                    backgroundColor: '#fff'
                                }}
                                onPress={() => setShowTimePicker(true)}
                            >
                                <Text style={{ color: '#000' }}>
                                    {formatTime(formData.reminderTime)}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {showCustomInput && (
                        <>
                            <Text>Number of Days *</Text>
                            <TextInput
                                style={{
                                    borderWidth: 1,
                                    borderColor: '#ccc',
                                    borderRadius: 8,
                                    marginBottom: 12,
                                    padding: 8,
                                    backgroundColor: '#fff'
                                }}
                                value={formData.customDays}
                                onChangeText={text => setFormData({ ...formData, customDays: text })}
                                placeholder="Enter number of days"
                                placeholderTextColor={'#999'}
                                keyboardType="numeric"
                            />
                        </>
                    )}

                    {(formData.reminderType === 'Daily' || formData.reminderType === 'Weekly' || formData.reminderType === 'Custom') && (
                        <>
                            <Text>Reminder Time (24 Hrs)</Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12, justifyContent: 'space-between' }}>
                                <TextInput
                                    style={{
                                        borderWidth: 1,
                                        borderColor: '#ccc',
                                        borderRadius: 6,
                                        paddingHorizontal: 10,
                                        height: 40,
                                        width: '30%',
                                        textAlign: 'center',
                                        backgroundColor: '#fff'
                                    }}
                                    placeholder="HH"
                                    placeholderTextColor={'black'}
                                    keyboardType="numeric"
                                    value={hour}
                                    onChangeText={setHour}
                                    maxLength={2}
                                />

                                <Text style={{ fontSize: 18, marginHorizontal: 4 }}>:</Text>

                                <TextInput
                                    style={{
                                        borderWidth: 1,
                                        borderColor: '#ccc',
                                        borderRadius: 6,
                                        paddingHorizontal: 10,
                                        height: 40,
                                        width: '30%',
                                        textAlign: 'center',
                                        backgroundColor: '#fff'
                                    }}
                                    placeholder="MM"
                                    placeholderTextColor={'black'}
                                    keyboardType="numeric"
                                    value={minute}
                                    onChangeText={setMinute}
                                    maxLength={2}
                                />

                                <TouchableOpacity
                                    style={{
                                        backgroundColor: savedTimes.length >= 3 ? '#ccc' : '#10B981',
                                        borderRadius: 6,
                                        width: '30%',
                                        height: 40,
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}
                                    onPress={handleAddTime}
                                    disabled={savedTimes.length >= 3}
                                >
                                    <Text style={{ color: '#fff', fontWeight: 'bold' }}>
                                        {savedTimes.length >= 3 ? 'Max 3' : '+ Add'}
                                    </Text>
                                </TouchableOpacity>
                            </View>


                            {/* Show added times */}
                            {savedTimes.length > 0 && (
                                <View style={{ marginBottom: 12 }}>
                                    {savedTimes.map((time, index) => (
                                        <View
                                            key={index}
                                            style={{
                                                flexDirection: 'row',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                borderWidth: 1,
                                                borderColor: '#ccc',
                                                borderRadius: 6,
                                                padding: 8,
                                                marginBottom: 4,
                                                backgroundColor: '#f9f9f9'
                                            }}
                                        >
                                            <Text style={{ fontSize: 16 }}>{time}</Text>
                                            <TouchableOpacity
                                                onPress={() => handleDeleteTime(index)}
                                                style={{
                                                    backgroundColor: '#EF4444',
                                                    paddingVertical: 4,
                                                    paddingHorizontal: 10,
                                                    borderRadius: 4
                                                }}
                                            >
                                                <Text style={{ color: '#fff', fontSize: 12 }}>Delete</Text>
                                            </TouchableOpacity>
                                        </View>
                                    ))}
                                </View>
                            )}
                        </>
                    )}

                    <Text>Valid Until</Text>
                    <TouchableOpacity
                        style={{
                            borderWidth: 1,
                            borderColor: '#ccc',
                            borderRadius: 8,
                            marginBottom: 12,
                            padding: 12,
                            backgroundColor: '#fff'
                        }}
                        onPress={() => setShowValidUntilPicker(true)}
                    >
                        <Text style={{ color: '#000' }}>{formatDate(validUntil)}</Text>
                    </TouchableOpacity>


                    <Text>Note (optional)</Text>
                    <TextInput
                        style={{
                            borderWidth: 1,
                            borderColor: '#ccc',
                            borderRadius: 8,
                            marginBottom: 20,
                            padding: 8,
                            minHeight: 80,
                            textAlignVertical: 'top'
                        }}
                        value={formData.note}
                        onChangeText={text => setFormData({ ...formData, note: text })}
                        placeholder="Add a note about the medicine"
                        placeholderTextColor={'#999'}
                        multiline={true}
                        numberOfLines={4}
                    />

                    {/* Action Buttons */}
                    <View style={{ flexDirection: 'row', gap: 12 }}>
                        <TouchableOpacity
                            style={{
                                backgroundColor: '#7C3AED',
                                padding: 12,
                                borderRadius: 8,
                                alignItems: 'center',
                                flex: 1
                            }}
                            onPress={handleSave}
                        >
                            <Text style={{ color: '#fff', fontWeight: 'bold' }}>Save Medicine</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>

            {/* Date Picker Modal */}
            {showDatePicker && (
                <DateTimePicker
                    value={formData.reminderDate}
                    mode="date"
                    display="default"
                    onChange={handleDateChange}
                    minimumDate={new Date()}
                />
            )}

            {/* Time Picker Modal */}
            {showTimePicker && (
                <DateTimePicker
                    value={formData.reminderTime}
                    mode="time"
                    display="default"
                    onChange={handleTimeChange}
                />
            )}

            {showValidUntilPicker && (
                <DateTimePicker
                    value={validUntil}
                    mode="date"
                    display="default"
                    onChange={(event, selectedDate) => {
                        setShowValidUntilPicker(false);
                        if (selectedDate) {
                            setValidUntil(selectedDate);
                        }
                    }}
                    minimumDate={new Date()}
                />
            )}

        </View>
    );
};

export default MedicalAddForm;