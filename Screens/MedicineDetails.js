import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    SafeAreaView,
    Animated,
    Alert,
    Image,
    Dimensions,
    ActivityIndicator,
} from 'react-native';
import Footer from './FooterH';
import UpdateMedicine from './UpdateMedicine';
import ViewFullImage from './ViewFullImage';
import { getMedicineDetails, updateMedicineReminder } from '../Services/Services';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { extractUserIdFromToken } from './ExtractUserId';
import Toast from 'react-native-toast-message';

const { width } = Dimensions.get('window');

const IOSToggle = ({ value, onValueChange, activeColor = '#9A6BD4', inactiveColor = '#E5E5EA' }) => {
    const [animatedValue] = useState(new Animated.Value(value ? 1 : 0));

    React.useEffect(() => {
        Animated.timing(animatedValue, {
            toValue: value ? 1 : 0,
            duration: 200,
            useNativeDriver: false,
        }).start();
    }, [value]);

    const handleToggle = () => {
        const newValue = !value;
        onValueChange(newValue);
    };

    const translateX = animatedValue.interpolate({
        inputRange: [0, 1],
        outputRange: [2, 22],
    });

    const backgroundColor = animatedValue.interpolate({
        inputRange: [0, 1],
        outputRange: [inactiveColor, activeColor],
    });

    return (
        <TouchableOpacity onPress={handleToggle} activeOpacity={0.8}>
            <Animated.View style={[styles.toggleContainer, { backgroundColor }]}>
                <Animated.View
                    style={[
                        styles.toggleThumb,
                        { transform: [{ translateX }] }
                    ]}
                />
            </Animated.View>
        </TouchableOpacity>
    );
};

const MedicineDetails = ({ navigation, route }) => {
    const { medicine } = route.params;
    const [isAutoReminderEnabled, setIsAutoReminderEnabled] = useState(false);
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [medicineData, setMedicineData] = useState({ ...medicine });
    const [tempMedicineData, setTempMedicineData] = useState({ ...medicine });
    const [imageModalVisible, setImageModalVisible] = useState(false);
    const [loading, setLoading] = useState(true);

    const fetchMedicineDetails = async () => {
        try {
            setLoading(true);
            const userToken = await AsyncStorage.getItem('userToken');

            if (!userToken) {
                Toast.show({
                    type: 'error',
                    text1: 'Error',
                    text2: 'Authentication required. Please login again.',
                    position: 'top',
                    topOffset: 130,
                    visibilityTime: 3000,
                });
                return;
            }

            console.log('Fetching details for medicine ID:', medicine.id);

            const response = await getMedicineDetails(medicine.id, userToken);

            if (response.success) {
                const transformedData = {
                    ...medicineData,
                    id: response.data.id,
                    name: response.data.name,
                    note: response.data.note,
                    notificationTimes: response.data.notificationTimes || [],
                    specificNotifications: response.data.specificNotifications,
                    notificationInteral: response.data.notificationInteral || 1,
                    vaildUntil: response.data.vaildUntil,
                    uploadedOn: response.data.uploaded,
                    nextNotification: response.data.nextNotification,
                    url: response.data.url,
                    notify: response.data.notify || false
                };

                setMedicineData(transformedData);
                setTempMedicineData(transformedData);
                setIsAutoReminderEnabled(response.data.notify || false);
            } else {
                Toast.show({
                    type: 'error',
                    text1: 'Error',
                    text2: response.error || 'Failed to fetch medicine details',
                    position: 'top',
                    topOffset: 130,
                    visibilityTime: 3000,
                });
            }
        } catch (error) {
            console.error('Error fetching medicine details:', error);
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Failed to load medicine details',
                position: 'top',
                topOffset: 130,
                visibilityTime: 3000,
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMedicineDetails();
    }, [medicine.id]);

    const handleBackPress = () => {
        navigation.goBack();
    };

    const handleEditMedicine = () => {
        setTempMedicineData({ ...medicineData });
        setEditModalVisible(true);
    };

    const handleSaveMedicine = () => {
        setMedicineData({ ...tempMedicineData });
        setEditModalVisible(false);
        Toast.show({
            type: 'success',
            text1: 'Success',
            text2: 'Medicine updated successfully!',
            position: 'top',
            topOffset: 130,
            visibilityTime: 3000,
        });
    };

    const handleCancelEdit = () => {
        setTempMedicineData({ ...medicineData });
        setEditModalVisible(false);
    };

    const formatNotificationTimes = (times) => {
        if (!times || times.length === 0) return 'No times set';
        return times.join(', ');
    };

    const formatNotificationInterval = (interval) => {
        if (!interval) return 'Not set';
        return `${interval} day${interval === 1 ? '' : 's'}`;
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'Not set';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const formatDateTime = (dateTimeString) => {
        if (!dateTimeString) return 'Not set';
        const date = new Date(dateTimeString);
        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getMedicineImage = (medicineFileUrl) => {
        if (medicineFileUrl) {
            return { uri: medicineFileUrl };
        }
        return null;
    };

    const handleImagePress = () => {
        if (medicineData.url) {
            setImageModalVisible(true);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.headerWrapper}>
                <View style={styles.header}>
                    <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
                        <Text style={{ color: 'white', fontSize: 30, fontWeight: 'bold', marginTop: -6 }}>
                            ←
                        </Text>
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Medicine Details</Text>
                    <TouchableOpacity
                        style={styles.refreshButton}
                        onPress={fetchMedicineDetails}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.refreshButtonText}>🔄</Text>
                    </TouchableOpacity>
                </View>
                <View style={styles.invertedUBottom} />
            </View>

            {loading ? (
                <View style={styles.loadingWrapper}>
                    <View style={styles.loadingOverlay}>
                        <ActivityIndicator size="large" color="#7C3AED" />
                        <Text style={styles.loadingText}>Loading medicines...</Text>
                    </View>
                </View>
            ) : (
                <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
                    <View style={styles.contentContainer}>
                        {medicineData.url && (
                            <View style={styles.detailItem}>
                                <TouchableOpacity onPress={handleImagePress} style={styles.imageContainer}>
                                    <Image
                                        source={getMedicineImage(medicineData.url)}
                                        style={{ width: 340, height: 220, borderRadius: 10 }}
                                        resizeMode="cover"
                                    />
                                    <View style={{
                                        position: 'absolute',
                                        bottom: 0,
                                        left: 0,
                                        right: 0,
                                        backgroundColor: 'rgba(124,58,237,0.7)',
                                        paddingVertical: 6,
                                        borderBottomLeftRadius: 10,
                                        borderBottomRightRadius: 10,
                                    }}>
                                        <Text style={{ color: 'white', textAlign: 'center', fontWeight: '600' }}>
                                            Tap image to view or download
                                        </Text>
                                    </View>
                                </TouchableOpacity>
                            </View>
                        )}
                        <View style={styles.detailsContainer}>
                            <View style={styles.detailItem}>
                                <Text style={styles.detailLabel}>Medicine Name</Text>
                                <Text style={styles.detailValue}>{medicineData.name}</Text>
                            </View>

                            <View style={styles.detailItem}>
                                <Text style={styles.detailLabel}>Notification Interval</Text>
                                <Text style={styles.detailValue}>{formatNotificationInterval(medicineData.notificationInteral)}</Text>
                            </View>

                            <View style={styles.detailItem}>
                                <Text style={styles.detailLabel}>Notification Times</Text>
                                <Text style={styles.detailValue}>{formatNotificationTimes(medicineData.notificationTimes)}</Text>
                            </View>
                            <View style={styles.detailItem}>
                                <Text style={styles.detailLabel}>Specific Notifications</Text>
                                <Text style={styles.detailValue}>{formatNotificationTimes(medicineData.specificNotifications)}</Text>
                            </View>

                            <View style={styles.detailItem}>
                                <Text style={styles.detailLabel}>Next Notification</Text>
                                <Text style={styles.detailValue}>{formatDateTime(medicineData.nextNotification)}</Text>
                            </View>

                            <View style={styles.detailItem}>
                                <Text style={styles.detailLabel}>Uploaded On</Text>
                                <Text style={styles.detailValue}>{formatDateTime(medicineData.uploadedOn)}</Text>
                            </View>

                            <View style={styles.detailItem}>
                                <Text style={styles.detailLabel}>Note</Text>
                                <Text style={styles.detailValue}>{medicineData.note || 'No note added'}</Text>
                            </View>

                            <View style={styles.autoReminderItem}>
                                <View style={styles.autoReminderTextContainer}>
                                    <Text style={styles.autoReminderLabel}>Auto Reminder</Text>
                                    <Text style={styles.autoReminderSubtext}>Medicine Notifications</Text>
                                </View>
                                <IOSToggle
                                    value={isAutoReminderEnabled}
                                    onValueChange={async (nextValue) => {
                                        const userToken = await AsyncStorage.getItem('userToken');
                                        const userId = extractUserIdFromToken(userToken);

                                        if (!userId) {
                                            Toast.show({
                                                type: 'error',
                                                text1: 'Error',
                                                text2: 'Authentication error. Please login again.',
                                                position: 'top',
                                                topOffset: 130,
                                                visibilityTime: 3000,
                                            });
                                            return;
                                        }

                                        if (nextValue) {
                                            try {
                                                const response = await updateMedicineReminder(medicineData.id);
                                                if (response.success) {
                                                    setIsAutoReminderEnabled(true);
                                                } else {
                                                    Toast.show({
                                                        type: 'error',
                                                        text1: 'Error',
                                                        text2: response.error || 'Failed to enable reminder',
                                                        position: 'top',
                                                        topOffset: 130,
                                                        visibilityTime: 3000,
                                                    });
                                                }
                                            } catch (error) {
                                                Toast.show({
                                                    type: 'error',
                                                    text1: 'Error',
                                                    text2: 'Failed to enable reminder',
                                                    position: 'top',
                                                    topOffset: 130,
                                                    visibilityTime: 3000,
                                                });
                                            }
                                        } else {
                                            Alert.alert(
                                                'Confirmation',
                                                'Do you want to stop receiving medicine reminders?',
                                                [
                                                    { text: 'Cancel', style: 'cancel' },
                                                    {
                                                        text: 'Yes',
                                                        onPress: async () => {
                                                            try {
                                                                const response = await updateMedicineReminder(medicineData.id);
                                                                if (response.success) {
                                                                    setIsAutoReminderEnabled(false);
                                                                } else {
                                                                    Toast.show({
                                                                        type: 'error',
                                                                        text1: 'Error',
                                                                        text2: response.error || 'Failed to disable reminder',
                                                                        position: 'top',
                                                                        topOffset: 130,
                                                                        visibilityTime: 3000,
                                                                    });
                                                                }
                                                            } catch (error) {
                                                                Toast.show({
                                                                    type: 'error',
                                                                    text1: 'Error',
                                                                    text2: 'Failed to disable reminder',
                                                                    position: 'top',
                                                                    topOffset: 130,
                                                                    visibilityTime: 3000,
                                                                });
                                                            }
                                                        }
                                                    },
                                                ]
                                            );
                                        }
                                    }}
                                    activeColor="#7C3AED"
                                    inactiveColor="#E5E5EA"
                                />
                            </View>

                            {/* Valid Until Section - Yellow Color */}
                            <View style={styles.validUntilContainer}>
                                <TouchableOpacity style={styles.validUntilButton} activeOpacity={0.8}>
                                    <View style={styles.validUntilContent}>
                                        <Text style={styles.calendarIcon}>📅</Text>
                                        <View style={styles.validUntilTextContainer}>
                                            <Text style={styles.validUntilLabel}>Valid Until</Text>
                                            <Text style={styles.validUntilSubtext}>
                                                {formatDate(medicineData.vaildUntil)}
                                            </Text>
                                        </View>
                                        <View style={styles.validUntilBadge} />
                                    </View>
                                </TouchableOpacity>
                            </View>

                            <View style={styles.actionButtonsContainer}>
                                <TouchableOpacity
                                    style={styles.updateButton}
                                    activeOpacity={0.8}
                                    onPress={handleEditMedicine}
                                >
                                    <Text style={styles.updateButtonText}>📝 Update Medicine</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>

                    <UpdateMedicine
                        visible={editModalVisible}
                        onClose={handleCancelEdit}
                        tempMedicineData={tempMedicineData}
                        setTempMedicineData={setTempMedicineData}
                        medicineData={medicineData}
                    />

                    {/* Full Image Modal */}
                    <ViewFullImage
                        visible={imageModalVisible}
                        onClose={() => setImageModalVisible(false)}
                        imageSource={getMedicineImage(medicineData.url)}
                    />
                </ScrollView>
            )}
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
        marginTop: -15
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
    contentContainer: {
        paddingHorizontal: 20,
        paddingTop: 30,
        paddingBottom: 100,
    },
    detailsContainer: {
        backgroundColor: 'white',
        borderRadius: 15,
        padding: 20,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        marginBottom: 16,
    },
    detailItem: {
        marginBottom: 20,
    },
    detailLabel: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 5,
    },
    detailValue: {
        fontSize: 16,
        color: '#666',
    },
    imageContainer: {
        marginTop: 10,
        borderRadius: 10,
        overflow: 'hidden',
    },
    medicineImage: {
        width: '100%',
        height: 200,
        backgroundColor: '#f0f0f0',
    },
    autoReminderItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 25,
        paddingBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    autoReminderTextContainer: {
        flex: 1,
    },
    autoReminderLabel: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 3,
    },
    autoReminderSubtext: {
        fontSize: 14,
        color: '#666',
    },
    toggleContainer: {
        width: 45,
        height: 26,
        borderRadius: 13,
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    toggleThumb: {
        width: 22,
        height: 22,
        borderRadius: 11,
        backgroundColor: '#FFFFFF',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.2,
        shadowRadius: 2,
        elevation: 3,
    },
    validUntilContainer: {
        marginBottom: 25,
    },
    validUntilButton: {
        backgroundColor: '#FFF9C4',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#FFC107',
        overflow: 'hidden',
    },
    validUntilContent: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        position: 'relative',
    },
    calendarIcon: {
        fontSize: 20,
        marginRight: 12,
    },
    validUntilTextContainer: {
        flex: 1,
    },
    validUntilLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#F57C00',
        marginBottom: 2,
    },
    validUntilSubtext: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#E65100',
    },
    validUntilBadge: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#FFC107',
        position: 'absolute',
        top: 12,
        right: 12,
    },
    actionButtonsContainer: {
        marginTop: 10,
    },
    updateButton: {
        backgroundColor: '#7C3AED',
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
        elevation: 3,
        shadowColor: '#7C3AED',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    updateButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    loadingWrapper: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
    },
});

export default MedicineDetails;