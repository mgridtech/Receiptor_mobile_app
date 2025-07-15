import { React, useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import Footer from './FooterH';
import { getReceipts, deleteReceipt } from '../Services/Services';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { extractUserIdFromToken } from './ExtractUserId';

const MedicalReceipts = ({ navigation }) => {
  const [selectedDate, setSelectedDate] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [receiptToDelete, setReceiptToDelete] = useState(null);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);


  const fetchMedicalReceipts = async () => {
    try {
      setLoading(true);

      const userToken = await AsyncStorage.getItem('userToken');

      if (!userToken) {
        setError('Authentication required. Please login again.');
        return;
      }

      const userId = extractUserIdFromToken(userToken);

      if (!userId) {
        setError('Invalid authentication token. Please login again.');
        return;
      }

      console.log('Using numeric userId:', userId);

      const response = await getReceipts(userToken);

      if (response.success) {

        if (response.data && response.data.message && response.data.message.includes("No receipts found")) {
          setReceipts([]);
          setError('no_receipts_found');
          return;
        }
        const medicalReceipts = response.data.filter(receipt =>
          receipt.category && receipt.category.toLowerCase() === 'medicine'
        );

        if (medicalReceipts.length === 0) {
          setReceipts([]);
          setError('no_medical_receipts');
          return;
        }

        const transformedReceipts = medicalReceipts.map(receipt => ({
          id: receipt.id,
          vendorName: receipt.vendor,
          dateReceived: formatDateForDisplay(receipt.purchaseDate),
          groupName: receipt.category,
          amount: `₹${receipt.amount}`,
          icon: getMedicalIcon(receipt.vendor),
          expiryDate: receipt.validUntil ? formatDateForDisplay(receipt.validUntil) : 'N/A',
        }));

        setReceipts(transformedReceipts);
      } else {
        setError(response.error || 'Failed to fetch receipts');
      }
    } catch (err) {
      console.error('Error fetching medical receipts:', err);
      setError('Failed to load medical receipts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedicalReceipts();
  }, []);

  const handleDeletePress = (receipt) => {
    setReceiptToDelete(receipt);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      setShowDeleteModal(false);

      const response = await deleteReceipt(receiptToDelete.id);

      if (response.success) {
        setReceipts(receipts.filter(receipt => receipt.id !== receiptToDelete.id));
        setShowSuccessMessage(true);
        setTimeout(() => {
          setShowSuccessMessage(false);
        }, 2000);
      } else {
        setError(response.error || 'Failed to delete receipt');
      }
    } catch (err) {
      console.error('Error deleting receipt:', err);
      setError('Failed to delete receipt');
    }

    setReceiptToDelete(null);
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setReceiptToDelete(null);
  };

  const formatDateForDisplay = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const getMedicalIcon = (vendor) => {
    const icons = ['🧾'];
    const index = vendor ? vendor.length % icons.length : 0;
    return icons[index];
  };
  const handleBackPress = () => {
    navigation.goBack();
  };

  const handleReceiptPress = (receipt) => {
    navigation.navigate('ReceiptDetails', { receipt });
  };

  let filteredReceipts = receipts;
  if (selectedDate) {
    filteredReceipts = filteredReceipts.filter(r => r.dateReceived === selectedDate);
  }

  const getReceiptStatus = (expiryDate) => {
    if (!expiryDate || expiryDate === 'N/A') {
      return { status: 'No Expiry', color: '#6B7280' };
    }

    const today = new Date();
    const dateParts = expiryDate.split('/');
    const validDate = new Date(dateParts[2], dateParts[1] - 1, dateParts[0]);

    today.setHours(0, 0, 0, 0);
    validDate.setHours(0, 0, 0, 0);

    const timeDiff = validDate.getTime() - today.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

    if (daysDiff < 0) {
      return { status: 'Expired', color: '#EF4444' };
    } else if (daysDiff <= 15) {
      return { status: 'Expiring Soon', color: '#F59E0B' };
    } else {
      return { status: 'Active', color: '#10B981' };
    }
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
          <Text style={styles.headerTitle}>Medical Receipts List</Text>
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={fetchMedicalReceipts}
            activeOpacity={0.7}
          >
            <Text style={styles.refreshButtonText}>🔄</Text>
          </TouchableOpacity>
        </View>
        {/* Inverted U Shape Bottom */}
        <View style={styles.invertedUBottom} />
      </View>

      <View style={{ marginHorizontal: 20, marginTop: 8, marginBottom: 8 }}>
        <TouchableOpacity
          style={{
            backgroundColor: '#fff',
            borderRadius: 8,
            borderWidth: 1,
            borderColor: '#E5E7EB',
            padding: 12,
          }}
          onPress={() => setShowDatePicker(true)}
        >
          <Text style={{ color: '#7C3AED' }}>
            {selectedDate ? `Filter Date: ${selectedDate}` : 'Select Date'}
          </Text>
        </TouchableOpacity>

        {/* Date Picker Modal */}
        {showDatePicker && (
          <DateTimePicker
            value={selectedDate ? new Date(selectedDate.split('/').reverse().join('-')) : new Date()}
            mode="date"
            display="default"
            onChange={(event, date) => {
              setShowDatePicker(false);
              if (event.type === 'set' && date) {
                const formatted = formatDateForDisplay(date.toISOString());
                setSelectedDate(formatted);
              }
            }}
          />
        )}

        {selectedDate && !showDatePicker && (
          <TouchableOpacity
            style={{
              marginTop: 8,
              alignSelf: 'flex-end',
              backgroundColor: '#f3f4f6',
              paddingHorizontal: 16,
              paddingVertical: 12,
              borderRadius: 8,
              minHeight: 20,
              minWidth: 44,
              justifyContent: 'center',
              alignItems: 'center',
            }}
            onPress={() => setSelectedDate(null)}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={{ color: '#7C3AED', fontSize: 14, fontWeight: '500' }}>
              Clear Date Filter
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Receipt List */}
      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.receiptList}>
          {!loading && (
            <>
              {error === 'no_receipts_found' ? (
                <View style={styles.noReceiptsContainer}>
                  <View style={styles.noReceiptsIcon}>
                    <Text style={styles.noReceiptsEmoji}>📋</Text>
                  </View>
                  <Text style={styles.noReceiptsTitle}>No Receipts Found</Text>
                  <Text style={styles.noReceiptsSubtitle}>Please add a receipt to get started</Text>
                  <TouchableOpacity
                    style={styles.addReceiptButton}
                    onPress={() => navigation.navigate('AddReceipt')}
                  >
                    <Text style={styles.addReceiptButtonText}>+ Add Receipt</Text>
                  </TouchableOpacity>
                </View>
              ) : error === 'no_medical_receipts' ? (
                <View style={styles.noReceiptsContainer}>
                  <View style={styles.noReceiptsIcon}>
                    <Text style={styles.noReceiptsEmoji}>💊</Text>
                  </View>
                  <Text style={styles.noReceiptsTitle}>No Medical Receipts Found</Text>
                  <Text style={styles.noReceiptsSubtitle}>Add medical receipts to track your healthcare expenses</Text>
                  <TouchableOpacity
                    style={styles.addReceiptButton}
                    onPress={() => navigation.navigate('AddReceipt')}
                  >
                    <Text style={styles.addReceiptButtonText}>+ Add Medical Receipt</Text>
                  </TouchableOpacity>
                </View>
              ) : error ? (
                <Text style={{ textAlign: 'center', color: '#ff0000', marginTop: 40 }}>
                  {error}
                </Text>
              ) : filteredReceipts.length === 0 ? (
                <Text style={{ textAlign: 'center', color: '#7C3AED', marginTop: 40 }}>
                  {selectedDate ? 'No receipts uploaded on the selected date' : 'No receipts found'}
                </Text>
              ) : (
                filteredReceipts.map((receipt) => (
                  <TouchableOpacity
                    key={receipt.id}
                    style={styles.receiptCard}
                    onPress={() => handleReceiptPress(receipt)}
                  >
                    <View style={styles.receiptIcon}>
                      <Text style={styles.iconText}>{receipt.icon}</Text>
                    </View>

                    <View style={styles.receiptContent}>
                      <View style={styles.receiptContent}>
                        {/* Status button positioned at top-right */}
                        <View style={{
                          position: 'absolute',
                          top: -2,
                          right: -9,
                          paddingHorizontal: 8,
                          paddingVertical: 4,
                          borderRadius: 12,
                          backgroundColor: getReceiptStatus(receipt.expiryDate).color,
                          zIndex: 2,
                        }}>
                          <Text style={{
                            color: 'white',
                            fontSize: 10,
                            fontWeight: '600',
                          }}>
                            {getReceiptStatus(receipt.expiryDate).status}
                          </Text>
                        </View>
                        <View style={styles.receiptInfo}>
                          <Text style={styles.storeName}>{receipt.vendorName}</Text>
                          <Text style={styles.receiptDate}>Date:  {receipt.dateReceived}</Text>
                          <Text style={{ fontSize: 12, color: '#666' }}>Expiry: {receipt.expiryDate}</Text>
                        </View>

                        <View style={styles.receiptAmount}>
                          <TouchableOpacity
                            style={{ alignSelf: 'flex-end', marginBottom: 7, marginTop: 27 }}
                            onPress={() => handleDeletePress(receipt)}
                            hitSlop={{ top: 10, bottom: 13, left: 10, right: 10 }}
                          >
                            <View style={{
                              width: 16,
                              height: 16,
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}>
                              <View style={{
                                width: 12,
                                height: 2,
                                backgroundColor: '#ff4444',
                                marginBottom: 1,
                                borderRadius: 1,
                              }} />
                              <View style={{
                                width: 10,
                                height: 12,
                                backgroundColor: '#ff4444',
                                borderRadius: 2,
                                position: 'relative',
                              }}>
                                <View style={{
                                  position: 'absolute',
                                  top: 2,
                                  left: 2,
                                  width: 1,
                                  height: 6,
                                  backgroundColor: 'white',
                                }} />
                                <View style={{
                                  position: 'absolute',
                                  top: 2,
                                  left: 4.5,
                                  width: 1,
                                  height: 6,
                                  backgroundColor: 'white',
                                }} />
                                <View style={{
                                  position: 'absolute',
                                  top: 2,
                                  right: 2,
                                  width: 1,
                                  height: 6,
                                  backgroundColor: 'white',
                                }} />
                              </View>
                            </View>
                          </TouchableOpacity>
                          <Text style={styles.amountText}>{receipt.amount}</Text>
                        </View>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </>
          )}
        </View>
      </ScrollView>
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#7C3AED" />
          <Text style={styles.loadingText}>Loading receipts...</Text>
        </View>
      )}

      {/* Footer Component */}
      <Footer />
      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <View style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          justifyContent: 'center',
          alignItems: 'center',
        }}>
          <View style={{
            backgroundColor: 'white',
            padding: 20,
            borderRadius: 10,
            width: '80%',
            alignItems: 'center',
          }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>
              Delete Receipt
            </Text>
            <Text style={{ fontSize: 16, textAlign: 'center', marginBottom: 20 }}>
              Are you sure you want to delete this receipt?
            </Text>
            <View style={{ flexDirection: 'row', gap: 15 }}>
              <TouchableOpacity
                style={{
                  backgroundColor: '#f3f4f6',
                  paddingHorizontal: 20,
                  paddingVertical: 10,
                  borderRadius: 8,
                }}
                onPress={handleDeleteCancel}
              >
                <Text style={{ color: '#333', fontWeight: '500' }}>No</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  backgroundColor: '#ff4444',
                  paddingHorizontal: 20,
                  paddingVertical: 10,
                  borderRadius: 8,
                }}
                onPress={handleDeleteConfirm}
              >
                <Text style={{ color: 'white', fontWeight: '500' }}>Yes</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Success Message Modal */}
      {showSuccessMessage && (
        <View style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          justifyContent: 'center',
          alignItems: 'center',
        }}>
          <View style={{
            backgroundColor: 'white',
            padding: 20,
            borderRadius: 10,
            width: '80%',
            alignItems: 'center',
          }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#28a745' }}>
              Receipt Deleted Successfully!
            </Text>
          </View>
        </View>
      )}
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
    marginLeft: -10
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
  receiptList: {
    paddingHorizontal: 20,
    paddingTop: 30,
    paddingBottom: 100,
  },
  receiptCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
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
  },
  receiptIcon: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#9A6BD4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  iconText: {
    fontSize: 20,
    color: 'white',
  },
  receiptContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  receiptInfo: {
    flex: 1,
  },
  storeName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  receiptDate: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  receiptCategory: {
    fontSize: 14,
    color: '#666',
  },
  receiptAmount: {
    alignItems: 'flex-end',
  },
  amountText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  noReceiptsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  noReceiptsIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  noReceiptsEmoji: {
    fontSize: 40,
  },
  noReceiptsTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  noReceiptsSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 22,
  },
  addReceiptButton: {
    backgroundColor: '#7C3AED',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  addReceiptButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
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
  loadingOverlay: {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  justifyContent: 'center',
  alignItems: 'center',
  // backgroundColor: 'rgba(255,255,255,0.6)', 
  zIndex: 999,
},
loadingText: {
  marginTop: 10,
  fontSize: 16,
  fontWeight: '500',
  color: '#333',
},

});

export default MedicalReceipts;