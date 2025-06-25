import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    SafeAreaView,
    Image,
    Animated,
    Alert,
} from 'react-native';
import Footer from './FooterH';
import UpdateReceipt from './UpdateReceipt';
import ViewFullImage from './ViewFullImage';

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

const ReceiptDetailsScreen = ({ navigation, route }) => {
    const { receipt } = route.params;
    const [isAutoReminderEnabled, setIsAutoReminderEnabled] = useState(false);
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [receiptData, setReceiptData] = useState({ ...receipt });
    const [tempReceiptData, setTempReceiptData] = useState({ ...receipt });
    const [imageModalVisible, setImageModalVisible] = useState(false);

    const handleBackPress = () => {
        navigation.goBack();
    };

    const getReceiptImage = (vendorName) => {
        if (!vendorName) return require('../assets/medical.png');
        switch (vendorName) {
            case 'Target':
                return require('../assets/target.png');
            case 'Costco':
                return require('../assets/coscto.jpg');
            case 'Best Buy':
                return require('../assets/best_buy.jpg');
            case 'Walmart':
                return require('../assets/walmart.jpg');
            default:
                return require('../assets/medical.png');
        }
    };

    const handleEditReceipt = () => {
        setTempReceiptData({ ...receiptData });
        setEditModalVisible(true);
    };

    const handleSaveReceipt = () => {
        setReceiptData({ ...tempReceiptData });
        setEditModalVisible(false);
        Alert.alert('Success', 'Receipt updated successfully!');
    };

    const handleCancelEdit = () => {
        setTempReceiptData({ ...receiptData });
        setEditModalVisible(false);
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
                    <Text style={styles.headerTitle}>Receipt Details</Text>
                </View>
                <View style={styles.invertedUBottom} />
            </View>

            <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
                <View style={styles.contentContainer}>
                    <View style={styles.receiptImageContainer}>
                        <View style={styles.receiptImageBox}>
                            <TouchableOpacity onPress={() => setImageModalVisible(true)} activeOpacity={0.8}>
                                <Image
                                    source={getReceiptImage(receiptData.vendorName)}
                                    style={{ width: 340, height: 220, borderRadius: 10 }}
                                    resizeMode="stretch"
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
                    </View>

                    <View style={styles.detailsContainer}>
                        <View style={styles.detailItem}>
                            <Text style={styles.detailLabel}>Vendor name</Text>
                            <Text style={styles.detailValue}>{receiptData.vendorName}</Text>
                        </View>

                        <View style={styles.detailItem}>
                            <Text style={styles.detailLabel}>Date received</Text>
                            <Text style={styles.detailValue}>{receiptData.dateReceived}</Text>
                        </View>

                        <View style={styles.detailItem}>
                            <Text style={styles.detailLabel}>Category</Text>
                            <Text style={styles.detailValue}>{receiptData.groupName}</Text>
                        </View>

                        <View style={styles.detailItem}>
                            <Text style={styles.detailLabel}>Amount</Text>
                            <Text style={styles.detailValue}>{receiptData.amount}</Text>
                        </View>

                        <View style={styles.autoReminderItem}>
                            <View style={styles.autoReminderTextContainer}>
                                <Text style={styles.autoReminderLabel}>Auto Reminder</Text>
                                <Text style={styles.autoReminderSubtext}>Before Expiry</Text>
                            </View>
                            <IOSToggle
                                value={isAutoReminderEnabled}
                                onValueChange={(nextValue) => {
                                    if (nextValue) {
                                        setIsAutoReminderEnabled(true);
                                    } else {
                                        Alert.alert(
                                            'Confirmation',
                                            'Do you want to stop receiving auto reminders?',
                                            [
                                                { text: 'Cancel', style: 'cancel' },
                                                { text: 'Yes', onPress: () => setIsAutoReminderEnabled(false) },
                                            ]
                                        );
                                    }
                                }}
                                activeColor="#7C3AED"
                                inactiveColor="#E5E5EA"
                            />
                        </View>

                        {receiptData.expiryDate && receiptData.expiryDate !== 'N/A' ? (
                            <View style={styles.expiryAlertContainer}>
                                <TouchableOpacity style={styles.expiryAlertButton} activeOpacity={0.8}>
                                    <View style={styles.expiryAlertContent}>
                                        <Text style={styles.clockIcon}>⏰</Text>
                                        <View style={styles.expiryAlertTextContainer}>
                                            <Text style={styles.expiryAlertLabel}>Expiring on</Text>
                                            <Text style={styles.expiryAlertDate}>{receiptData.expiryDate}</Text>
                                        </View>
                                        <View style={styles.alertBadge} />
                                    </View>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <View style={styles.expiryAlertContainer}>
                                <TouchableOpacity style={styles.expiryAlertButton} activeOpacity={0.8}>
                                    <View style={styles.expiryAlertContent}>
                                        <Text style={styles.clockIcon}>⏰</Text>
                                        <View style={styles.expiryAlertTextContainer}>
                                            <Text style={styles.expiryAlertLabel}>Valid upto</Text>
                                            <Text style={styles.expiryAlertDate}>{receiptData.validupto}</Text>
                                        </View>
                                        <View style={styles.alertBadge} />
                                    </View>
                                </TouchableOpacity>
                            </View>
                        )}

                        <View style={styles.actionButtonsContainer}>
                            <TouchableOpacity
                                style={styles.updateButton}
                                activeOpacity={0.8}
                                onPress={handleEditReceipt}
                            >
                                <Text style={styles.updateButtonText}>📝 Update Receipt</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                <UpdateReceipt
                    visible={editModalVisible}
                    onClose={handleCancelEdit}
                    tempReceiptData={tempReceiptData}
                    setTempReceiptData={setTempReceiptData}
                    handleSaveReceipt={handleSaveReceipt}
                    receiptData={receiptData}
                />
            </ScrollView>
            <ViewFullImage
                visible={imageModalVisible}
                onClose={() => setImageModalVisible(false)}
                imageSource={getReceiptImage(receiptData.vendorName)}
            />
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
    receiptImageContainer: {
        alignItems: 'center',
        marginBottom: 30,
        width: '100%',
    },
    receiptImageBox: {
        width: '100%',
        height: 230,
        backgroundColor: 'white',
        borderRadius: 15,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        padding: 15,
        justifyContent: 'center',
        alignItems: 'center',
    },
    receiptImage: {
        width: '100%',
        height: '100%',
        borderRadius: 10,
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
    expiryAlertContainer: {
        marginBottom: 25,
    },
    expiryAlertButton: {
        backgroundColor: '#FFF3E0',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#FFB74D',
        overflow: 'hidden',
    },
    expiryAlertContent: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        position: 'relative',
    },
    clockIcon: {
        fontSize: 20,
        marginRight: 12,
    },
    expiryAlertTextContainer: {
        flex: 1,
    },
    expiryAlertLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#E65100',
        marginBottom: 2,
    },
    expiryAlertDate: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#BF360C',
    },
    alertBadge: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#FF5722',
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
});

export default ReceiptDetailsScreen;