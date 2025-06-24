import { React, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import Footer from './FooterH';

const MedicalReceipts = ({ navigation }) => {
  const [selectedDate, setSelectedDate] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const receipts = [
    {
      id: 1,
      vendorName: 'Apollo Pharmacy',
      dateReceived: '15/06/2025',
      groupName: 'Medical',
      amount: '$24.50',
      icon: '💊',
      medicine: 'Paracetamol 500mg',
      expiryDate: '25/06/2025',
    },
    {
      id: 2,
      vendorName: 'MedPlus',
      dateReceived: '10/06/2025',
      groupName: 'Medical',
      amount: '$18.75',
      icon: '🏥',
      medicine: 'Amoxicillin 250mg',
      expiryDate: '12/12/2025',
    },
    {
      id: 3,
      vendorName: 'CVS Pharmacy',
      dateReceived: '08/06/2025',
      groupName: 'Medical',
      amount: '$32.90',
      icon: '💉',
      medicine: 'Insulin Glargine',
      expiryDate: '20/08/2025',
    },
    {
      id: 4,
      vendorName: 'Walgreens',
      dateReceived: '05/06/2025',
      groupName: 'Medical',
      amount: '$15.25',
      icon: '🩺',
      medicine: 'Ibuprofen 400mg',
      expiryDate: '30/09/2025',
    },
    {
      id: 5,
      vendorName: 'Local Clinic',
      dateReceived: '02/06/2025',
      groupName: 'Medical',
      amount: '$45.00',
      icon: '🏩',
      medicine: 'Blood Pressure Monitor',
      expiryDate: 'N/A',
    },
    {
      id: 6,
      vendorName: 'HealthMart',
      dateReceived: '28/05/2025',
      groupName: 'Medical',
      amount: '$12.80',
      icon: '💊',
      medicine: 'Vitamin D3 Tablets',
      expiryDate: '15/11/2025',
    },
  ];

  const handleBackPress = () => {
    navigation.goBack();
  };

  const handleReceiptPress = (receipt) => {
    navigation.navigate('ReceiptDetails', { receipt });
  };

  let filteredReceipts = receipts;
  if (selectedDate) {
    filteredReceipts = filteredReceipts.filter(r => r.date === selectedDate);
  }

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
                const formatted = `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
                setSelectedDate(formatted);
              }
            }}
          />
        )}

        {/* Clear Date Filter Button */}
        {selectedDate && !showDatePicker && (
          <TouchableOpacity
            style={{
              marginTop: 8,
              alignSelf: 'flex-end',
              backgroundColor: '#f3f4f6',
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 8,
            }}
            onPress={() => setSelectedDate(null)}
          >
            <Text style={{ color: '#7C3AED' }}>Clear Date Filter</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Receipt List */}
      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.receiptList}>
          {filteredReceipts.length === 0 ? (
            <Text style={{ textAlign: 'center', color: '#7C3AED', marginTop: 40 }}>
              No receipts are found for the date selected
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
                  <View style={styles.receiptInfo}>
                    <Text style={styles.storeName}>{receipt.vendorName}</Text>
                    <Text style={styles.receiptDate}>{receipt.dateReceived}</Text>
                    <Text style={styles.receiptCategory}>{receipt.groupName}</Text>
                    <Text style={{ fontSize: 12, color: '#666', fontWeight: 'bold' }}>{receipt.medicine}</Text>
                    <Text style={{ fontSize: 12, color: '#666' }}>Expiry: {receipt.expiryDate}</Text>
                  </View>

                  <View style={styles.receiptAmount}>
                    <Text style={styles.amountText}>{receipt.amount}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>

      {/* Footer Component */}
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
});

export default MedicalReceipts;