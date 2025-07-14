import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    Alert,
    Platform,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';

const MedicalAddForm = ({ navigation, onSave }) => {
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
    const [ampm, setAmPm] = useState('AM');
    const [showAmPmDropdown, setShowAmPmDropdown] = useState(false);

    const reminderOptions = [
        { label: 'Once', value: 'Once' },
        { label: 'Daily', value: 'Daily' },
        { label: 'Weekly', value: 'Weekly' },
        { label: 'Custom (enter number of days)', value: 'Custom' },
    ];

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

    const handleSave = () => {
        if (!formData.medicineName.trim()) {
            Alert.alert('Error', 'Please enter medicine name');
            return;
        }

        if (!formData.reminderType) {
            Alert.alert('Error', 'Please select reminder type');
            return;
        }

        if (formData.reminderType === 'Custom' && !formData.customDays.trim()) {
            Alert.alert('Error', 'Please enter number of days for custom reminder');
            return;
        }

        if (formData.reminderType === 'Daily' && savedTimes.length === 0) {
            Alert.alert('Error', 'Please add at least one reminder time for daily reminder');
            return;
        }

        if (formData.reminderType === 'Weekly' && savedTimes.length === 0) {
            Alert.alert('Error', 'Please add at least one reminder time for weekly reminder');
            return;
        }

        let finalReminderType = formData.reminderType;
        let scheduleDetails = {};

        switch (formData.reminderType) {
            case 'Once':
                finalReminderType = `Once on ${formatDate(formData.reminderDate)} at ${formatTime(formData.reminderTime)}`;
                scheduleDetails = {
                    date: formData.reminderDate,
                    time: formData.reminderTime
                };
                break;
            case 'Daily':
                finalReminderType = `Daily at ${savedTimes.join(', ')}`;
                scheduleDetails = {
                    times: savedTimes
                };
                break;
            case 'Weekly':
                finalReminderType = `Weekly at ${savedTimes.join(', ')}`;
                scheduleDetails = {
                    times: savedTimes
                };
                break;
            case 'Custom':
                finalReminderType = `Every ${formData.customDays} days`;
                scheduleDetails = {
                    customDays: formData.customDays
                };
                break;
        }

        const medicineData = {
            medicineName: formData.medicineName,
            note: formData.note,
            reminderType: finalReminderType,
            originalReminderType: formData.reminderType,
            scheduleDetails: scheduleDetails,
            customDays: formData.reminderType === 'Custom' ? formData.customDays : null,
        };

        console.log('Medicine data to save:', medicineData);

        if (onSave) {
            onSave(medicineData);
        }

        Alert.alert('Success', 'Medicine added successfully!', [
            { text: 'OK', onPress: () => navigation?.goBack() }
        ]);
    };

    const handleAddTime = () => {
    const hh = parseInt(hour, 10);
    const mm = parseInt(minute, 10);

    if (isNaN(hh) || isNaN(mm)) {
        Alert.alert('Invalid Input', 'Please enter valid numeric values for hour and minute.');
        return;
    }

    if (hh < 0 || hh > 23) {
        Alert.alert('Invalid Hour', 'Please enter an hour between 00 and 23.');
        return;
    }

    if (mm < 0 || mm > 59) {
        Alert.alert('Invalid Minute', 'Please enter minutes between 00 and 59.');
        return;
    }

    if (savedTimes.length >= 3) {
        Alert.alert('Limit Reached', 'You can only add maximum 3 reminder times.');
        return;
    }

    const formattedTime = `${hour.padStart(2, '0')}:${minute.padStart(2, '0')}`;
    setSavedTimes(prev => [...prev, formattedTime]);

    // Reset inputs
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
                    <View style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 8, marginBottom: 12 }}>
                        <Picker
                            selectedValue={formData.reminderType}
                            onValueChange={handleReminderTypeChange}
                            style={{ color: '#000' }}
                            dropdownIconColor="#000"
                        >
                            <Picker.Item
                                label="Select reminder type"
                                value=""
                                enabled={false}
                            />
                            {reminderOptions.map(option => (
                                <Picker.Item
                                    key={option.value}
                                    label={option.label}
                                    value={option.value}
                                />
                            ))}
                        </Picker>
                    </View>

                    {/* Date and Time Pickers for "Once" option */}
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

                    {/* Custom Days Input - Only show when Custom is selected */}
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

                                {/* <View style={{ position: 'relative', width: '22%' }}>
                                    <TouchableOpacity
                                        style={{
                                            borderWidth: 1,
                                            borderColor: '#ccc',
                                            borderRadius: 6,
                                            width: '100%',
                                            height: 40,
                                            backgroundColor: '#fff',
                                            justifyContent: 'center',
                                            alignItems: 'center',
                                            paddingHorizontal: 8,
                                            flexDirection: 'row',
                                        }}
                                        onPress={() => setShowAmPmDropdown(!showAmPmDropdown)}
                                    >
                                        <Text style={{
                                            color: '#000',
                                            fontWeight: 'bold',
                                            fontSize: 16,
                                            flex: 1,
                                            textAlign: 'center'
                                        }}>
                                            {ampm}
                                        </Text>
                                        <Text style={{ color: '#666', fontSize: 10 }}>▼</Text>
                                    </TouchableOpacity>

                                    {showAmPmDropdown && (
                                        <View style={{
                                            position: 'absolute',
                                            top: 42,
                                            left: 0,
                                            width: '100%',
                                            backgroundColor: '#fff',
                                            borderWidth: 1,
                                            borderColor: '#ccc',
                                            borderRadius: 6,
                                            zIndex: 1000,
                                            elevation: 5,
                                            shadowColor: '#000',
                                            shadowOffset: { width: 0, height: 2 },
                                            shadowOpacity: 0.1,
                                            shadowRadius: 4,
                                        }}>
                                            <TouchableOpacity
                                                style={{
                                                    paddingVertical: 10,
                                                    paddingHorizontal: 12,
                                                    borderBottomWidth: 1,
                                                    borderBottomColor: '#eee'
                                                }}
                                                onPress={() => {
                                                    setAmPm('AM');
                                                    setShowAmPmDropdown(false);
                                                }}
                                            >
                                                <Text style={{
                                                    color: '#000',
                                                    fontWeight: ampm === 'AM' ? 'bold' : 'normal',
                                                    textAlign: 'center',
                                                    fontSize: 14
                                                }}>AM</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                style={{
                                                    paddingVertical: 10,
                                                    paddingHorizontal: 12,
                                                }}
                                                onPress={() => {
                                                    setAmPm('PM');
                                                    setShowAmPmDropdown(false);
                                                }}
                                            >
                                                <Text style={{
                                                    color: '#000',
                                                    fontWeight: ampm === 'PM' ? 'bold' : 'normal',
                                                    textAlign: 'center',
                                                    fontSize: 14
                                                }}>PM</Text>
                                            </TouchableOpacity>
                                        </View>
                                    )}
                                </View> */}
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
        </View>
    );
};

export default MedicalAddForm;