import { React, useState } from 'react';
import {
    Modal,
    View,
    KeyboardAvoidingView,
    Platform,
    TouchableOpacity,
    Text,
    ScrollView,
    TextInput,
    StyleSheet,
    Alert
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { updateMedicine } from '../Services/Services';
import Toast from 'react-native-toast-message';

const UpdateMedicine = ({
    visible,
    onClose,
    tempMedicineData,
    setTempMedicineData,
    medicineData
}) => {
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showTimePicker, setShowTimePicker] = useState(false);
    const [showValidUntilPicker, setShowValidUntilPicker] = useState(false);
    const [saving, setSaving] = useState(false);
    const [selectedDateTimeIndex, setSelectedDateTimeIndex] = useState(null);
    const [isEditingDateTime, setIsEditingDateTime] = useState(false);
    const [validUntil, setValidUntil] = useState(tempMedicineData.validUntil ? new Date(tempMedicineData.validUntil) : new Date());
    const [nextNotification, setNextNotification] = useState(
        tempMedicineData.nextNotification ? new Date(tempMedicineData.nextNotification) : null
    );
    const [showNextNotificationDatePicker, setShowNextNotificationDatePicker] = useState(false);
    const [showNextNotificationTimePicker, setShowNextNotificationTimePicker] = useState(false);
    const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];


    const handleNextNotificationDateChange = (event, selectedDate) => {
        setShowNextNotificationDatePicker(false);
        if (event.type === 'set' && selectedDate) {
            const existingTime = nextNotification || new Date();
            const combinedDate = new Date(selectedDate);
            combinedDate.setHours(existingTime.getHours(), existingTime.getMinutes());
            setNextNotification(combinedDate);
            setShowNextNotificationTimePicker(true);
        }
    };

    const handleNextNotificationTimeChange = (event, selectedTime) => {
        setShowNextNotificationTimePicker(false);
        if (event.type === 'set' && selectedTime && nextNotification) {
            const updatedDate = new Date(nextNotification);
            updatedDate.setHours(selectedTime.getHours(), selectedTime.getMinutes());
            setNextNotification(updatedDate);
        }
    };

    const addNotificationTime = () => {
        if ((tempMedicineData.notificationTimes || []).length >= 3) {
            Alert.alert('Limit Reached', 'You can only add up to 3 notification times');
            return;
        }
        const newTime = '08:00';
        const updatedTimes = [...(tempMedicineData.notificationTimes || []), newTime];
        setTempMedicineData({ ...tempMedicineData, notificationTimes: updatedTimes });
    };

    const removeNotificationTime = (index) => {
        const updatedTimes = tempMedicineData.notificationTimes.filter((_, i) => i !== index);
        setTempMedicineData({ ...tempMedicineData, notificationTimes: updatedTimes });
    };

    const updateNotificationTime = (index, time) => {
        const updatedTimes = [...tempMedicineData.notificationTimes];
        updatedTimes[index] = time;
        setTempMedicineData({ ...tempMedicineData, notificationTimes: updatedTimes });
    };

    const updateNotificationDays = (days) => {
        setTempMedicineData({ ...tempMedicineData, notificationDays: days });
    };

    const addSpecificNotification = () => {
        const newNotification = {
            date: new Date().toISOString().split('T')[0],
            time: '08:00'
        };
        const updatedNotifications = [...(tempMedicineData.specificNotificationDateTimes || []), newNotification];
        setTempMedicineData({ ...tempMedicineData, specificNotificationDateTimes: updatedNotifications });
    };

    const removeSpecificNotification = (index) => {
        const updatedNotifications = tempMedicineData.specificNotificationDateTimes.filter((_, i) => i !== index);
        setTempMedicineData({ ...tempMedicineData, specificNotificationDateTimes: updatedNotifications });
    };

    const updateSpecificNotification = (index, field, value) => {
        const updatedNotifications = [...tempMedicineData.specificNotificationDateTimes];
        updatedNotifications[index][field] = value;
        setTempMedicineData({ ...tempMedicineData, specificNotificationDateTimes: updatedNotifications });
    };

    const formatTimeForDisplay = (time) => {
        if (!time) return '08:00';
        return time;
    };

    const formatDateForDisplay = (date) => {
        if (!date) return new Date().toISOString().split('T')[0];
        if (date instanceof Date) return date.toISOString().split('T')[0];
        return date;
    };

    const formatDate = (date) => {
        if (!date) return new Date().toLocaleDateString();
        return date.toLocaleDateString();
    };

    const handleTimeChange = (event, selectedTime) => {
        setShowTimePicker(false);
        if (event.type === 'set' && selectedTime) {
            const timeString = selectedTime.toTimeString().substring(0, 5);
            if (isEditingDateTime) {
                updateSpecificNotification(selectedDateTimeIndex, 'time', timeString);
            } else {
                updateNotificationTime(selectedDateTimeIndex, timeString);
            }
        }
        setIsEditingDateTime(false);
        setSelectedDateTimeIndex(null);
    };

    const handleDateChange = (event, selectedDate) => {
        setShowDatePicker(false);
        if (event.type === 'set' && selectedDate) {
            const dateString = selectedDate.toISOString().split('T')[0];
            updateSpecificNotification(selectedDateTimeIndex, 'date', dateString);
        }
        setIsEditingDateTime(false);
        setSelectedDateTimeIndex(null);
    };

    const handleValidUntilChange = (event, selectedDate) => {
        setShowValidUntilPicker(false);
        if (event.type === 'set' && selectedDate) {
            setValidUntil(selectedDate);
        }
    };

    const handleSaveMedicine = async () => {
        try {
            setSaving(true);

            // Validate required fields
            if (!tempMedicineData.name?.trim()) {
                Toast.show({
                    type: 'error',
                    text1: 'Error',
                    text2: 'Medicine name is required',
                    position: 'top',
                    topOffset: 130,
                    visibilityTime: 3000,
                });
                return;
            }

            if (!medicineData.id) {
                Toast.show({
                    type: 'error',
                    text1: 'Error',
                    text2: 'Medicine ID is missing',
                    position: 'top',
                    topOffset: 130,
                    visibilityTime: 3000,
                });
                return;
            }

            // Handle notificationDays - convert to integer or default to 0
            let notificationDays = 0;
            if (Array.isArray(tempMedicineData.notificationDays) && tempMedicineData.notificationDays.length > 0) {
                // If you have specific logic for converting days array to integer, implement it here
                // For now, defaulting to 0 if it's an empty array
                notificationDays = tempMedicineData.notificationDays.length > 0 ? tempMedicineData.notificationDays[0] : 0;
            } else if (typeof tempMedicineData.notificationDays === 'number') {
                notificationDays = tempMedicineData.notificationDays;
            }

            // Ensure notificationTimes is an array of strings in HH:mm format
            const notificationTimes = Array.isArray(tempMedicineData.notificationTimes)
                ? tempMedicineData.notificationTimes
                : [];

            // Ensure specificNotificationDateTimes is an array
            const specificNotificationDateTimes = Array.isArray(tempMedicineData.specificNotificationDateTimes)
                ? tempMedicineData.specificNotificationDateTimes
                : [];

            const payload = {
                medicineId: medicineData.id,
                name: tempMedicineData.name.trim(),
                note: tempMedicineData.note?.trim() || null,
                notificationDays, // This is now an integer
                notificationTimes,
                specificNotificationDateTimes,
                validUntil: validUntil.toISOString().split('T')[0],
                nextNotification: nextNotification ? nextNotification.toISOString() : null
            };

            console.log('Updating medicine with payload:', payload);

            const response = await updateMedicine(payload);

            console.log('Update medicine response:', response);

            if (response.success) {
                Toast.show({
                    type: 'success',
                    text1: 'Success',
                    text2: response.message || 'Medicine updated successfully!',
                    position: 'top',
                    topOffset: 130,
                    visibilityTime: 3000,
                    onHide: () => {
                        onClose();
                    },
                });
            } else {
                Toast.show({
                    type: 'error',
                    text1: 'Error',
                    text2: response.error || 'Failed to update medicine',
                    position: 'top',
                    topOffset: 130,
                    visibilityTime: 3000,
                });
            }
        } catch (error) {
            console.error('Error updating medicine:', error);
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Something went wrong. Please try again.',
                position: 'top',
                topOffset: 130,
                visibilityTime: 3000,
            });
        } finally {
            setSaving(false);
        }
    };


    return (
        <Modal
            animationType="fade"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.modalContainer}
                >
                    <View style={styles.modalContent}>
                        {/* Modal Header */}
                        <View style={styles.modalHeader}>
                            <TouchableOpacity onPress={onClose}>
                                <Text style={styles.cancelButton}>Cancel</Text>
                            </TouchableOpacity>
                            <Text style={styles.modalTitle}>Update Medicine</Text>
                            <TouchableOpacity
                                onPress={handleSaveMedicine}
                                disabled={saving}
                            >
                                <Text style={styles.saveButton}>{saving ? 'Saving...' : 'Save'}</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Form Fields */}
                        <ScrollView style={styles.formContainer} showsVerticalScrollIndicator={false}>
                            <View style={styles.formGroup}>
                                <Text style={styles.label}>Medicine Name *</Text>
                                <TextInput
                                    style={styles.input}
                                    value={tempMedicineData.name || ''}
                                    onChangeText={(text) => setTempMedicineData({ ...tempMedicineData, name: text })}
                                    placeholder="Enter medicine name"
                                    placeholderTextColor={'black'}
                                />
                            </View>

                            <View style={styles.formGroup}>
                                <Text style={styles.label}>Note (optional)</Text>
                                <TextInput
                                    style={[styles.input, { height: 80 }]}
                                    value={tempMedicineData.note || ''}
                                    onChangeText={(text) => setTempMedicineData({ ...tempMedicineData, note: text })}
                                    placeholder="Add a note about the medicine"
                                    placeholderTextColor={'black'}
                                    multiline
                                    textAlignVertical="top"
                                />
                            </View>



                            {/* Notification Days */}
                            <View style={styles.formGroup}>
                                <Text style={styles.label}>Number of Days</Text>
                                <TextInput
                                    style={styles.input}
                                    value={tempMedicineData.notificationInteral?.toString() || ''}
                                    onChangeText={(text) => {
                                        const numericValue = text.replace(/[^0-9]/g, '');
                                        updateNotificationDays(numericValue ? parseInt(numericValue) : '');
                                    }}
                                    placeholder="Enter number of days"
                                    placeholderTextColor={'black'}
                                    keyboardType="numeric"
                                />
                            </View>

                            {/* Notification Times */}
                            <View style={styles.formGroup}>
                                <View style={styles.sectionHeader}>
                                    <Text style={styles.label}>Notification Times</Text>
                                    <TouchableOpacity
                                        style={[
                                            styles.addButton,
                                            (tempMedicineData.notificationTimes || []).length >= 3 && styles.addButtonDisabled
                                        ]}
                                        onPress={addNotificationTime}
                                        disabled={(tempMedicineData.notificationTimes || []).length >= 3}
                                    >
                                        <Text style={[
                                            styles.addButtonText,
                                            (tempMedicineData.notificationTimes || []).length >= 3 && styles.addButtonTextDisabled
                                        ]}>
                                            {(tempMedicineData.notificationTimes || []).length >= 3 ? 'Max 3 Times' : '+ Add Time'}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                                {(tempMedicineData.notificationTimes || []).map((time, index) => (
                                    <View key={index} style={styles.timeItem}>
                                        <TouchableOpacity
                                            style={[styles.input, { flex: 1, justifyContent: 'center' }]}
                                            onPress={() => {
                                                setSelectedDateTimeIndex(index);
                                                setIsEditingDateTime(false);
                                                setShowTimePicker(true);
                                            }}
                                        >
                                            <Text style={{ color: '#1f2937' }}>
                                                {formatTimeForDisplay(time)}
                                            </Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={styles.removeButton}
                                            onPress={() => removeNotificationTime(index)}
                                        >
                                            <Text style={styles.removeButtonText}>✕</Text>
                                        </TouchableOpacity>
                                    </View>
                                ))}
                                {(tempMedicineData.notificationTimes || []).length === 0 && (
                                    <Text style={styles.emptyText}>No notification times added</Text>
                                )}
                            </View>

                            {/* Specific Notification Date Times */}
                            <View style={styles.formGroup}>
                                <View style={styles.sectionHeader}>
                                    <Text style={styles.label}>Specific Notifications</Text>
                                    <TouchableOpacity
                                        style={styles.addButton}
                                        onPress={addSpecificNotification}
                                    >
                                        <Text style={styles.addButtonText}>+ Add Specific</Text>
                                    </TouchableOpacity>
                                </View>
                                {(tempMedicineData.specificNotificationDateTimes || []).map((notification, index) => (
                                    <View key={index} style={styles.specificNotificationItem}>
                                        <View style={styles.dateTimeRow}>
                                            <TouchableOpacity
                                                style={[styles.input, { flex: 1, justifyContent: 'center', marginRight: 10 }]}
                                                onPress={() => {
                                                    setSelectedDateTimeIndex(index);
                                                    setIsEditingDateTime(true);
                                                    setShowDatePicker(true);
                                                }}
                                            >
                                                <Text style={{ color: '#1f2937' }}>
                                                    {formatDateForDisplay(notification.date)}
                                                </Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                style={[styles.input, { flex: 1, justifyContent: 'center' }]}
                                                onPress={() => {
                                                    setSelectedDateTimeIndex(index);
                                                    setIsEditingDateTime(true);
                                                    setShowTimePicker(true);
                                                }}
                                            >
                                                <Text style={{ color: '#1f2937' }}>
                                                    {formatTimeForDisplay(notification.time)}
                                                </Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                style={styles.removeButton}
                                                onPress={() => removeSpecificNotification(index)}
                                            >
                                                <Text style={styles.removeButtonText}>✕</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                ))}
                                {(tempMedicineData.specificNotificationDateTimes || []).length === 0 && (
                                    <Text style={styles.emptyText}>No specific notifications added</Text>
                                )}
                            </View>

                            <View style={styles.formGroup}>
                                <Text style={styles.label}>Next Notification</Text>
                                <TouchableOpacity
                                    style={styles.input}
                                    onPress={() => setShowNextNotificationDatePicker(true)}
                                >
                                    <Text style={{ color: '#1f2937' }}>
                                        {nextNotification ? nextNotification.toLocaleString() : 'Select next notification'}
                                    </Text>
                                </TouchableOpacity>
                            </View>

                            {/* Valid Until */}
                            <View style={styles.formGroup}>
                                <Text style={styles.label}>Valid Until</Text>
                                <TouchableOpacity
                                    style={styles.input}
                                    onPress={() => setShowValidUntilPicker(true)}
                                >
                                    <Text style={{ color: '#1f2937' }}>
                                        {formatDate(validUntil)}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </ScrollView>

                        {/* Date/Time Pickers */}
                        {showTimePicker && (
                            <DateTimePicker
                                value={new Date()}
                                mode="time"
                                display="default"
                                onChange={handleTimeChange}
                            />
                        )}
                        {showDatePicker && (
                            <DateTimePicker
                                value={new Date()}
                                mode="date"
                                display="default"
                                onChange={handleDateChange}
                                minimumDate={new Date()}
                            />
                        )}
                        {showValidUntilPicker && (
                            <DateTimePicker
                                value={validUntil}
                                mode="date"
                                display="default"
                                onChange={handleValidUntilChange}
                                minimumDate={new Date()}
                            />
                        )}
                    </View>
                </KeyboardAvoidingView>
                {/* Show pickers */}
                {showNextNotificationDatePicker && (
                    <DateTimePicker
                        value={nextNotification || new Date()}
                        mode="date"
                        display="default"
                        onChange={handleNextNotificationDateChange}
                        minimumDate={new Date()}
                    />
                )}
                {showNextNotificationTimePicker && (
                    <DateTimePicker
                        value={nextNotification || new Date()}
                        mode="time"
                        display="default"
                        onChange={handleNextNotificationTimeChange}
                    />
                )}

            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '85%',
        minHeight: '60%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1f2937',
    },
    cancelButton: {
        fontSize: 16,
        color: '#6b7280',
        fontWeight: '600',
    },
    saveButton: {
        fontSize: 16,
        color: '#7C3AED',
        fontWeight: '700',
    },
    formContainer: {
        flex: 1,
        paddingHorizontal: 20,
        paddingTop: 20,
        marginBottom: 20,
    },
    formGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16,
        backgroundColor: '#fff',
        color: '#1f2937',
    },
    daysContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    dayButton: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#d1d5db',
        backgroundColor: '#fff',
        minWidth: 45,
        alignItems: 'center',
    },
    dayButtonSelected: {
        backgroundColor: '#7C3AED',
        borderColor: '#7C3AED',
    },
    dayButtonText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#374151',
    },
    dayButtonTextSelected: {
        color: '#fff',
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    addButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: '#7C3AED',
        borderRadius: 8,
    },
    addButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    timeItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    specificNotificationItem: {
        marginBottom: 8,
    },
    dateTimeRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    removeButton: {
        width: 32,
        height: 32,
        backgroundColor: '#ef4444',
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 10,
    },
    removeButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    addButtonDisabled: {
        backgroundColor: '#9ca3af',
    },
    addButtonTextDisabled: {
        color: '#6b7280',
    },
    emptyText: {
        fontSize: 14,
        color: '#6b7280',
        fontStyle: 'italic',
        textAlign: 'center',
        paddingVertical: 20,
    },
});

export default UpdateMedicine;