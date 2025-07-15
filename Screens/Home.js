import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import Footer from './FooterH';
import { getReceipts, getMedicines } from '../Services/Services'; // Add getMedicines import
import AsyncStorage from '@react-native-async-storage/async-storage';
import { extractUserIdFromToken } from './ExtractUserId';

const { width } = Dimensions.get('window');

const HomeScreen = ({ navigation }) => {
  const [userName, setUserName] = useState('');
  const [totalReceiptsCount, setTotalReceiptsCount] = useState(0);
  const [currentMonthCount, setCurrentMonthCount] = useState(0);
  const [medicalCount, setMedicalCount] = useState(0);
  const [medicinesCount, setMedicinesCount] = useState(0); // Add new state for medicines count
  const [expiringSoonCount, setExpiringSoonCount] = useState(0);
  const [expiringSoonReceipts, setExpiringSoonReceipts] = useState([]);
  const [latestExpiringMedicalReceipt, setLatestExpiringMedicalReceipt] = useState(null);

  // Separate function to fetch medicines count
  const fetchMedicinesCount = async () => {
    try {
      const userToken = await AsyncStorage.getItem('userToken');

      if (!userToken) {
        console.error('Authentication required for medicines');
        return;
      }

      const response = await getMedicines(userToken);
      
      if (response.success && response.data && Array.isArray(response.data)) {
        setMedicinesCount(response.data.length);
      } else {
        setMedicinesCount(0);
      }
    } catch (err) {
      console.error('Error fetching medicines count:', err);
      setMedicinesCount(0);
    }
  };

  useEffect(() => {
    const fetchReceiptCounts = async () => {
      try {
        const userToken = await AsyncStorage.getItem('userToken');

        if (!userToken) {
          console.error('Authentication required');
          return;
        }

        const userId = extractUserIdFromToken(userToken);

        if (!userId) {
          console.error('Invalid authentication token');
          return;
        }

        const response = await getReceipts(userToken);

        setTotalReceiptsCount(0);
        setCurrentMonthCount(0);
        setMedicalCount(0);
        setExpiringSoonCount(0);
        setExpiringSoonReceipts([]);
        setLatestExpiringMedicalReceipt(null);

        if (response.success && response.data && Array.isArray(response.data) && response.data.length > 0) {
          const nonMedicalReceipts = response.data.filter(receipt =>
            !(receipt.category && receipt.category.toLowerCase() === 'medicine')
          );
          setTotalReceiptsCount(nonMedicalReceipts.length);

          const currentDate = new Date();
          const currentMonth = currentDate.getMonth();
          const currentYear = currentDate.getFullYear();

          const currentMonthReceipts = response.data.filter(receipt => {
            const receiptDate = new Date(receipt.purchaseDate);
            return receiptDate.getMonth() === currentMonth &&
              receiptDate.getFullYear() === currentYear;
          });
          setCurrentMonthCount(currentMonthReceipts.length);

          const medicalReceipts = response.data.filter(receipt =>
            receipt.category && receipt.category.toLowerCase() === 'medicine'
          );
          setMedicalCount(medicalReceipts.length);

          const receiptsWithValidUntil = response.data.filter(receipt => receipt.validUntil);

          if (receiptsWithValidUntil.length > 0) {
            const currentDate = new Date();
            const sevenDaysFromNow = new Date();
            sevenDaysFromNow.setDate(currentDate.getDate() + 15);

            const expiringSoonReceipts = receiptsWithValidUntil.filter(receipt => {
              const expiryDate = new Date(receipt.validUntil);
              return expiryDate >= currentDate && expiryDate <= sevenDaysFromNow;
            });

            if (expiringSoonReceipts.length > 0) {
              setExpiringSoonCount(expiringSoonReceipts.length);
              setExpiringSoonReceipts(expiringSoonReceipts);
            }
          }

          const medicalReceiptsWithExpiry = response.data.filter(receipt =>
            receipt.category &&
            receipt.category.toLowerCase() === 'medicine' &&
            receipt.validUntil
          );

          if (medicalReceiptsWithExpiry.length > 0) {
            const currentDate = new Date();
            const fifteenDaysFromNow = new Date();
            fifteenDaysFromNow.setDate(currentDate.getDate() + 15);

            const medicalExpiringSoon = medicalReceiptsWithExpiry.filter(receipt => {
              const expiryDate = new Date(receipt.validUntil);
              return expiryDate >= currentDate && expiryDate <= fifteenDaysFromNow;
            });

            if (medicalExpiringSoon.length > 0) {
              const soonestExpiringMedical = medicalExpiringSoon.reduce((earliest, current) => {
                const earliestDate = new Date(earliest.validUntil);
                const currentDate = new Date(current.validUntil);
                return currentDate < earliestDate ? current : earliest;
              });

              setLatestExpiringMedicalReceipt(soonestExpiringMedical);
            }
          }
        }
      } catch (err) {
        console.error('Error fetching receipt counts:', err);
        setTotalReceiptsCount(0);
        setCurrentMonthCount(0);
        setMedicalCount(0);
        setExpiringSoonCount(0);
        setExpiringSoonReceipts([]);
        setLatestExpiringMedicalReceipt(null);
      }
    };

    // Call both functions
    fetchReceiptCounts();
    fetchMedicinesCount(); // Add this call to fetch medicines count
  }, []);

  useEffect(() => {
    const fetchUserName = async () => {
      try {
        const storedName = await AsyncStorage.getItem('userName');
        console.log('Retrieved name from AsyncStorage:', storedName);
        setUserName(storedName || 'User');
      } catch (e) {
        console.error('Error fetching user name:', e);
        setUserName('User');
      }
    };
    fetchUserName();
  }, []);

  const handleAllReceipts = () => {
    navigation.navigate('ReceiptsList');
  }

  const handleMedicalReceipts = () => {
    navigation.navigate('MedicalReceipts');
  };

  const handleMedicines = () => {
    navigation.navigate('Medicines');
  };

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.headerWrapper}>
        <View style={styles.purpleHeader}>
          <Image
            source={require('../assets/Logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={styles.headerTitle}>Receiptor</Text>
          </View>
          <View style={{ width: 60 }} />
        </View>
        <View style={styles.invertedUBottom} />
      </View>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.headerContainer}>
          <View style={styles.userInfoContainer}>
            <View style={styles.welcomeSection}>
              <Text style={styles.greeting}>Hello!</Text>
              <Text style={styles.name}>{userName ? userName : '...'}</Text>
              <Text style={styles.subtitle}>Welcome back to your receipts</Text>
            </View>
          </View>
        </View>

        {/* Receipts Upload Status Card */}
        <View style={styles.uploadStatusCard}>
          <View style={styles.uploadStatusContent}>
            <View style={styles.uploadIconContainer}>
              <Text style={styles.uploadIcon}>📄</Text>
            </View>
            <View style={styles.uploadTextContainer}>
              <Text style={styles.uploadNumber}>{currentMonthCount}</Text>
              <Text style={styles.uploadText}>Receipts Uploaded</Text>
              <Text style={styles.uploadSubtext}>This month</Text>
            </View>
          </View>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <TouchableOpacity style={styles.statItem} onPress={() => navigation.navigate('ReceiptsList')} activeOpacity={0.7}>
            <Text style={styles.statNumber}>{totalReceiptsCount}</Text>
            <Text style={styles.statLabel}>All Receipts</Text>
          </TouchableOpacity>
          <View style={styles.statDivider} />
          <TouchableOpacity style={styles.statItem} onPress={() => navigation.navigate('MedicalReceipts')} activeOpacity={0.7}>
            <Text style={styles.statNumber}>{medicalCount}</Text>
            <Text style={styles.statLabel}>Medical Receipts</Text>
          </TouchableOpacity>
          <View style={styles.statDivider} />
          <TouchableOpacity style={styles.statItem} onPress={() => navigation.navigate('Medicines')} activeOpacity={0.7}>
            <Text style={styles.statNumber}>{medicinesCount}</Text>
            <Text style={styles.statLabel}>Medicines</Text>
          </TouchableOpacity>
          <View style={styles.statDivider} />
          <TouchableOpacity
            style={styles.statItem}
            // onPress={async () => {
            //   if (expiringSoonReceipts.length > 0) {
            //     const userToken = await AsyncStorage.getItem('userToken');
            //     const userId = extractUserIdFromToken(userToken);

            //     navigation.navigate('ReceiptDetails', {
            //       receipt: {
            //         id: expiringSoonReceipts[0].id,
            //         vendorName: expiringSoonReceipts[0].vendor,
            //         dateReceived: expiringSoonReceipts[0].purchaseDate,
            //         groupName: expiringSoonReceipts[0].category,
            //         amount: `₹${expiringSoonReceipts[0].amount}`,
            //         validupto: expiringSoonReceipts[0].validUntil
            //       },
            //       userId: userId
            //     });
            //   }
            // }}
            activeOpacity={0.7}
          >
            <Text style={[styles.statNumber, { color: 'red' }]}>{expiringSoonCount}</Text>
            <Text style={[styles.statLabel, { color: 'red' }]}>Expiring Soon</Text>
          </TouchableOpacity>
        </View>

        {/* Medicine Expiry Alert Card */}
        {latestExpiringMedicalReceipt && (
          <View style={styles.alertCard}>
            <View style={styles.alertHeader}>
              <View style={styles.alertIconContainer}>
                <Text style={styles.alertIcon}>⚠️</Text>
              </View>
              <Text style={styles.alertTitle}>Medicine Expiry Alert!</Text>
            </View>
            <View style={styles.alertContent}>
              <Text style={styles.medicineName}>{latestExpiringMedicalReceipt.vendor}</Text>
              <Text style={styles.expiryText}>
                This medicine is expiring soon - Check expiry date
              </Text>
              <Text style={styles.expiryDate}>
                Expires: {new Date(latestExpiringMedicalReceipt.validUntil).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.alertButton}
              onPress={async () => {
                const userToken = await AsyncStorage.getItem('userToken');
                const userId = extractUserIdFromToken(userToken);

                navigation.navigate('ReceiptDetails', {
                  receipt: {
                    id: latestExpiringMedicalReceipt.id,
                    vendorName: latestExpiringMedicalReceipt.vendor,
                    dateReceived: latestExpiringMedicalReceipt.purchaseDate,
                    groupName: latestExpiringMedicalReceipt.category,
                    amount: `₹${latestExpiringMedicalReceipt.amount}`,
                    validupto: latestExpiringMedicalReceipt.validUntil
                  },
                  userId: userId
                });
              }}
            >
              <Text style={styles.alertButtonText}>View Details</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Receipt Categories */}
        <Text style={styles.sectionTitle}>Receipt Categories</Text>
        <View style={styles.categoryContainer}>
          <TouchableOpacity
            style={[styles.categoryCard, styles.allReceiptsCard]}
            onPress={handleAllReceipts}
            activeOpacity={0.8}
          >
            <View style={styles.categoryIconContainer}>
              <Text style={styles.categoryIcon}>📋</Text>
            </View>
            <Text style={styles.categoryTitle}>All Receipts</Text>
            <Text style={styles.categorySubtitle}>View all your receipts</Text>
            <View style={styles.categoryArrow}>
              <Text style={styles.arrowText}>→</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.categoryCard, styles.medicalReceiptsCard]}
            onPress={handleMedicalReceipts}
            activeOpacity={0.8}
          >
            <View style={styles.categoryIconContainer}>
              <Text style={styles.categoryIcon}>🧾</Text>
            </View>
            <Text style={styles.categoryTitle}>Medical Receipts</Text>
            <Text style={styles.categorySubtitle}>View your Medical receipts</Text>
            <View style={styles.categoryArrow}>
              <Text style={styles.arrowText}>→</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.categoryCard, styles.medicinesCard]}
            onPress={handleMedicines}
            activeOpacity={0.8}
          >
            <View style={styles.categoryIconContainer}>
              <Text style={styles.categoryIcon}>💊</Text>
            </View>
            <Text style={styles.categoryTitle}>Medicines</Text>
            <Text style={styles.categorySubtitle}>Track medicine & health</Text>
            <View style={styles.categoryArrow}>
              <Text style={styles.arrowText}>→</Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
      <Footer />
    </View>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 20,
    paddingTop: 0,
  },
  headerWrapper: {
    backgroundColor: '#7C3AED',
    position: 'relative',
    marginTop: -22,
  },
  purpleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    paddingTop: 50,
    paddingBottom: 30,
  },
  logo: {
    width: 70,
    height: 70,
    marginRight: 12,
    alignSelf: 'center',
    marginTop: -16,
    marginBottom: -12,
  },
  headerTitle: {
    fontSize: 23,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginTop: 0
  },
  invertedUBottom: {
    height: 30,
    backgroundColor: '#f8f9fa',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginTop: -1,
  },
  headerContainer: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    marginBottom: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  userInfoContainer: {
    alignItems: 'center',
  },
  welcomeSection: {
    alignItems: 'center',
  },
  greeting: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 4,
    fontWeight: '500',
  },
  name: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1f2937',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: '#9ca3af',
    fontWeight: '400',
  },
  uploadStatusCard: {
    backgroundColor: '#7C3AED',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#4f46e5',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  uploadStatusContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  uploadIconContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  uploadIcon: {
    fontSize: 24,
  },
  uploadTextContainer: {
    flex: 1,
  },
  uploadNumber: {
    fontSize: 32,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 2,
  },
  uploadText: {
    fontSize: 16,
    color: '#e0e7ff',
    fontWeight: '600',
  },
  uploadSubtext: {
    fontSize: 12,
    color: '#c7d2fe',
  },
  uploadProgress: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: '#fff',
  },
  alertCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 25,
    borderLeftWidth: 4,
    borderLeftColor: '#F14343',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  alertIconContainer: {
    marginRight: 10,
  },
  alertIcon: {
    fontSize: 20,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#dc2626',
  },
  alertContent: {
    marginBottom: 15,
  },
  medicineName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  expiryText: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
    marginBottom: 8,
  },
  expiryDate: {
    fontSize: 14,
    fontWeight: '600',
    color: '#dc2626',
  },
  alertButton: {
    backgroundColor: '#fef3c7',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  alertButtonText: {
    color: '#d97706',
    fontWeight: '600',
    fontSize: 14,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 16,
  },
  categoryContainer: {
    marginBottom: 25,
  },
  categoryCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  allReceiptsCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#10b981',
  },
  medicalReceiptsCard: {
    borderLeftWidth: 4,
    borderLeftColor: 'orange',
  },
  medicinesCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#8b5cf6',
    marginBottom: 83,
  },
  categoryIconContainer: {
    backgroundColor: '#f3f4f6',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  categoryIcon: {
    fontSize: 24,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
    flex: 1,
    marginBottom: 4,
  },
  categorySubtitle: {
    fontSize: 13,
    color: '#6b7280',
    flex: 1,
  },
  categoryArrow: {
    backgroundColor: '#f3f4f6',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  arrowText: {
    fontSize: 26,
    color: '#6b7280',
    fontWeight: 'bold',
    marginTop: -10,
  },
  statsContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 23,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1f2937',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    height: 70,
    backgroundColor: '#e5e7eb',
  },
});