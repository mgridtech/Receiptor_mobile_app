import { React, useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import Footer from './FooterH';
import { getMedicines, deleteMedicine } from '../Services/Services';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { extractUserIdFromToken } from './ExtractUserId';

const Medicines = ({ navigation }) => {
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDateFilter, setSelectedDateFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [medicineToDelete, setMedicineToDelete] = useState(null);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [shouldFetchOnMount, setShouldFetchOnMount] = useState(true);

  const handleDeletePress = (medicine) => {
    setMedicineToDelete(medicine);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      setShowDeleteModal(false);

      const response = await deleteMedicine(medicineToDelete.id);

      console.log('Delete response:', response);

      if (response.success) {
        setMedicines(medicines.filter(medicine => medicine.id !== medicineToDelete.id));
        setShowSuccessMessage(true);
        setTimeout(() => {
          setShowSuccessMessage(false);
        }, 2000);
      } else {
        setError(response.error || 'Failed to delete medicine');
      }
    } catch (err) {
      console.error('Error deleting medicine:', err);
      setError('Failed to delete medicine');
    }

    setMedicineToDelete(null);
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setMedicineToDelete(null);
  };

  const formatDateForDisplay = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const formatTimeForDisplay = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const fetchAllMedicines = async () => {
    try {
      setLoading(true);
      setError(null);
      setMedicines([]);

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

      const response = await getMedicines(userToken);
      if (response.success) {
        if (response.data?.message?.includes("No medicines found") || response.data.length === 0) {
          setMedicines([]);
          setError('no_medicines_found');
          return;
        }

        const transformedMedicines = response.data.map(medicine => ({
          id: medicine.id,
          medicineName: medicine.name || 'Unknown Medicine',
          nextNotification: medicine.nextNotification,
          uploaded: medicine.uploaded,
          note: medicine.note,
          formatteduploaded: formatDateForDisplay(medicine.uploaded),
          formattedNextNotification: formatDateForDisplay(medicine.nextNotification),
          formattedNextNotificationTime: formatTimeForDisplay(medicine.nextNotification),
        }));

        setMedicines(transformedMedicines);
      } else {
        setError(response.error || 'Failed to fetch medicines');
      }
    } catch (err) {
      console.error('Error fetching medicines:', err);
      setError('Failed to load medicines');
    } finally {
      setLoading(false);
      setShouldFetchOnMount(false);
    }
  };


  useEffect(() => {
    if (shouldFetchOnMount) {
      fetchAllMedicines();
    }
  }, [shouldFetchOnMount]);


  const handleBackPress = () => {
    navigation.goBack();
  };

  const handleMedicinePress = (medicine) => {
    navigation.navigate('MedicineDetails', { medicine });
  };

  const getReminderStatus = (nextNotification) => {
    if (!nextNotification) {
      return { status: 'No Reminder', color: '#6B7280', bgColor: '#F3F4F6' };
    }

    const now = new Date();
    const notificationDate = new Date(nextNotification);
    const timeDiff = notificationDate.getTime() - now.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

    if (daysDiff < 0) {
      return { status: 'Overdue', color: '#EF4444', bgColor: '#FEF2F2' };
    } else if (daysDiff === 0) {
      return { status: 'Today', color: '#F59E0B', bgColor: '#FFFBEB' };
    } else if (daysDiff === 1) {
      return { status: 'Tomorrow', color: '#8B5CF6', bgColor: '#F3F4F6' };
    } else if (daysDiff <= 7) {
      return { status: 'This Week', color: '#10B981', bgColor: '#ECFDF5' };
    } else {
      return { status: 'Scheduled', color: '#3B82F6', bgColor: '#EFF6FF' };
    }
  };

  const getReminderIcon = (reminderType) => {
    switch (reminderType?.toLowerCase()) {
      case 'daily':
        return '📅';
      case 'weekly':
        return '🗓️';
      case 'monthly':
        return '📆';
      case 'as needed':
        return '⚡';
      default:
        return '💊';
    }
  };

  const filterMedicinesByDate = (medicines) => {
    if (selectedDateFilter === 'all') return medicines;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return medicines.filter(medicine => {
      const uploaded = new Date(medicine.uploaded);
      uploaded.setHours(0, 0, 0, 0);

      const daysDiff = Math.floor((today - uploaded) / (1000 * 60 * 60 * 24));

      switch (selectedDateFilter) {
        case 'today':
          return daysDiff === 0;
        case 'week':
          return daysDiff <= 7;
        case 'month':
          return daysDiff <= 30;
        case 'older':
          return daysDiff > 30;
        default:
          return true;
      }
    });
  };

  const filteredMedicines = filterMedicinesByDate(
    medicines.filter(medicine =>
      medicine.medicineName.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

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
          <Text style={styles.headerTitle}>My Medicines</Text>
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={() => {
              setShouldFetchOnMount(false);
              setMedicines([]);
              setError(null);
              setLoading(true);
              fetchAllMedicines();
            }}
            activeOpacity={0.7}
          >
            <Text style={styles.refreshButtonText}>🔄</Text>
          </TouchableOpacity>

        </View>
        {/* Inverted U Shape Bottom */}
        <View style={styles.invertedUBottom} />
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search medicines..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <View style={{ width: '100%', backgroundColor: '#fff', zIndex: 10 }}>
        <View>
          <View style={styles.filterContainer}>
            <Picker
              selectedValue={selectedDateFilter}
              onValueChange={setSelectedDateFilter}
              style={{ color: '#7C3AED', width: '100%' }}
              dropdownIconColor="#7C3AED"
            >
              <Picker.Item label="All Medicines" value="all" />
              <Picker.Item label="Added Today" value="today" />
              <Picker.Item label="This Week" value="week" />
              <Picker.Item label="This Month" value="month" />
              <Picker.Item label="Older" value="older" />
            </Picker>
          </View>
        </View>
      </View>

      {/* Medicine List */}
      <View style={{ flex: 1 }}>
        <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          <View style={styles.medicineList}>
            {error === 'no_medicines_found' ? (
              <View style={styles.noMedicinesContainer}>
                <View style={styles.noMedicinesIcon}>
                  <Text style={styles.noMedicinesEmoji}>💊</Text>
                </View>
                <Text style={styles.noMedicinesTitle}>No Medicines Found</Text>
                <Text style={styles.noMedicinesSubtitle}>Add your first medicine to start tracking</Text>
                <TouchableOpacity
                  style={styles.addMedicineButton}
                  onPress={() => navigation.navigate('AddMedicine')}
                >
                  <Text style={styles.addMedicineButtonText}>+ Add Medicine</Text>
                </TouchableOpacity>
              </View>
            ) : error ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : filteredMedicines.length === 0 ? (
              <View style={styles.noResultsContainer}>
                <Text style={styles.noResultsText}>
                  {searchQuery
                    ? 'No medicines found matching your search'
                    : ''}
                </Text>
              </View>
            ) : (
              filteredMedicines.map((medicine) => (
                <TouchableOpacity
                  key={medicine.id}
                  style={styles.medicineCard}
                  onPress={() => handleMedicinePress(medicine)}
                >
                  <View style={styles.medicineContent}>
                    <View style={styles.medicineIconContainer}>
                      <Text style={styles.medicineIcon}>
                        {getReminderIcon(medicine.reminderType)}
                      </Text>
                    </View>

                    <View style={styles.medicineInfo}>
                      <Text style={styles.medicineName}>{medicine.medicineName}</Text>
                      <View style={styles.medicineDetailsRow}>
                        <Text style={styles.medicineDetails}>
                          📅 Added: {medicine.formatteduploaded}
                        </Text>
                      </View>
                      <View style={styles.medicineDetailsRow}>
                        <Text style={styles.medicineDetails}>
                          ⏰ Next: {medicine.formattedNextNotification}{' '}
                          {medicine.formattedNextNotificationTime}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.medicineActions}>
                      <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={() => handleDeletePress(medicine)}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      >
                        <View style={styles.deleteIcon}>
                          <View style={styles.deleteIconTop} />
                          <View style={styles.deleteIconBody}>
                            <View style={styles.deleteIconLine1} />
                            <View style={styles.deleteIconLine2} />
                            <View style={styles.deleteIconLine3} />
                          </View>
                        </View>
                      </TouchableOpacity>
                    </View>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>
        </ScrollView>

        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#7C3AED" />
            <Text style={styles.loadingText}>Loading medicines...</Text>
          </View>
        )}
      </View>


      {/* Footer Component */}
      <Footer />

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Delete Medicine</Text>
            <Text style={styles.modalMessage}>
              Are you sure you want to delete this medicine?
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleDeleteCancel}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={handleDeleteConfirm}
              >
                <Text style={styles.confirmButtonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Success Message Modal */}
      {showSuccessMessage && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.successMessage}>
              Medicine Deleted Successfully!
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
  searchContainer: {
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 8,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#374151',
  },
  filterContainer: {
    marginHorizontal: 20,
    marginBottom: 8,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  scrollContainer: {
    flex: 1,
    paddingTop: 10,
    marginTop: -30,
  },
  medicineList: {
    paddingHorizontal: 20,
    paddingTop: 30,
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },
  loadingText: {
    textAlign: 'center',
    color: '#7C3AED',
    fontSize: 16,
  },
  medicineCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderLeftWidth: 4,
    borderLeftColor: '#7C3AED',
  },
  medicineContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  medicineIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  medicineIcon: {
    fontSize: 24,
  },
  medicineInfo: {
    flex: 1,
  },
  medicineName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  medicineDetailsRow: {
    marginBottom: 4,
  },
  medicineDetails: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  medicineActions: {
    alignItems: 'flex-end',
  },
  deleteButton: {
    padding: 8,
    marginBottom: 12,
  },
  deleteIcon: {
    alignItems: 'center',
  },
  deleteIconTop: {
    width: 12,
    height: 2,
    backgroundColor: '#EF4444',
    marginBottom: 1,
    borderRadius: 1,
  },
  deleteIconBody: {
    width: 10,
    height: 12,
    backgroundColor: '#EF4444',
    borderRadius: 2,
    position: 'relative',
  },
  deleteIconLine1: {
    position: 'absolute',
    top: 2,
    left: 2,
    width: 1,
    height: 6,
    backgroundColor: 'white',
  },
  deleteIconLine2: {
    position: 'absolute',
    top: 2,
    left: 4.5,
    width: 1,
    height: 6,
    backgroundColor: 'white',
  },
  deleteIconLine3: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 1,
    height: 6,
    backgroundColor: 'white',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  noMedicinesContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  noMedicinesIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  noMedicinesEmoji: {
    fontSize: 48,
  },
  noMedicinesTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 12,
  },
  noMedicinesSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  addMedicineButton: {
    backgroundColor: '#7C3AED',
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  addMedicineButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },
  errorText: {
    textAlign: 'center',
    color: '#EF4444',
    fontSize: 16,
  },
  noResultsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },
  noResultsText: {
    textAlign: 'center',
    color: '#6B7280',
    fontSize: 16,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: 'white',
    padding: 24,
    borderRadius: 12,
    width: '85%',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#1F2937',
  },
  modalMessage: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    color: '#6B7280',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 16,
  },
  cancelButton: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  cancelButtonText: {
    color: '#374151',
    fontWeight: '500',
  },
  confirmButton: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  confirmButtonText: {
    color: 'white',
    fontWeight: '500',
  },
  successMessage: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#10B981',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255,255,255,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: '600',
    color: '#7C3AED',
  },

});

export default Medicines;