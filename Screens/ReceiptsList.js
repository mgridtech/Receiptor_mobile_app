import { React, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import Icon from 'react-native-vector-icons/Ionicons';
import Footer from './FooterH';

const ReceiptsList = ({ navigation }) => {
  const receipts = [
  {
    id: 1,
    groupName: 'Groceries',
    vendorName: 'Target',
    dateReceived: '12/08/2024',
    amount: '$41.95',
    validupto: '12/08/2025',
    note: 'Weekly grocery shopping',
  },
  {
    id: 2,
    groupName: 'Electronics',
    vendorName: 'Best Buy',
    dateReceived: '12/07/2024',
    amount: '$42.95',
    validupto: '12/07/2025',
    note: 'Bought headphones',
  },
  {
    id: 3,
    groupName: 'Groceries',
    vendorName: 'Costco',
    dateReceived: '12/06/2024',
    amount: '$43.95',
    validupto: '12/06/2025',
    note: 'Bulk purchase',
  },
  {
    id: 4,
    groupName: 'Groceries',
    vendorName: 'Target',
    dateReceived: '12/05/2024',
    amount: '$25.50',
    validupto: '12/05/2025',
    note: 'Snacks and drinks',
  },
  {
    id: 5,
    groupName: 'Electronics',
    vendorName: 'Walmart',
    dateReceived: '12/04/2024',
    amount: '$99.99',
    validupto: '12/04/2025',
    note: 'Bluetooth speaker',
  },
  {
    id: 6,
    groupName: 'Groceries',
    vendorName: 'Costco',
    dateReceived: '12/03/2024',
    amount: '$60.00',
    validupto: '12/03/2025',
    note: 'Monthly supplies',
  },
  {
    id: 7,
    groupName: 'Electronics',
    vendorName: 'Best Buy',
    dateReceived: '12/02/2024',
    amount: '$120.00',
    validupto: '12/02/2025',
    note: 'Smartwatch',
  },
  {
    id: 8,
    groupName: 'Clothing',
    vendorName: 'Target',
    dateReceived: '12/01/2024',
    amount: '$35.00',
    validupto: '12/01/2025',
    note: 'T-shirts',
  },
  {
    id: 9,
    groupName: 'Groceries',
    vendorName: 'Walmart',
    dateReceived: '11/30/2024',
    amount: '$55.25',
    validupto: '11/30/2025',
    note: 'Vegetables and fruits',
  },
  {
    id: 10,
    groupName: 'Groceries',
    vendorName: 'Costco',
    dateReceived: '11/29/2024',
    amount: '$80.00',
    validupto: '11/29/2025',
    note: 'Party supplies',
  },
];
  const [selectedStore, setSelectedStore] = useState('');

  const handleBackPress = () => {
    navigation.goBack();
  };

  const handleReceiptPress = (receipt) => {
    navigation.navigate('ReceiptDetails', { receipt });
  };

  const filteredReceipts = selectedStore
    ? receipts.filter(r => r.groupName === selectedStore)
    : receipts;

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
          <Text style={styles.headerTitle}>All Receipts List</Text>
        </View>
        {/* Inverted U Shape Bottom */}
        <View style={styles.invertedUBottom} />
      </View>

      <View style={{ marginHorizontal: 20, marginTop: 16, marginBottom: 8, backgroundColor: '#fff', borderRadius: 8, borderWidth: 1, borderColor: '#E5E7EB' }}>
        <Picker
          selectedValue={selectedStore}
          onValueChange={setSelectedStore}
          style={{ color: '#7C3AED' }}
          dropdownIconColor="#7C3AED"
        >
          <Picker.Item label="All Groups" value="" />
          <Picker.Item label="Groceries" value="Groceries" />
          <Picker.Item label="Electronics" value="Electronics" />
          <Picker.Item label="Clothing" value="Clothing" />
        </Picker>
      </View>

      {/* Receipt List */}
      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.receiptList}>
          {filteredReceipts.map((receipt) => (
            <TouchableOpacity
              key={receipt.id}
              style={styles.receiptCard}
              onPress={() => handleReceiptPress(receipt)}
            >
              <View style={styles.receiptContent}>
                <View style={styles.receiptInfo}>
                  <Text style={styles.storeName}>{receipt.vendorName}</Text>
                  <Text style={styles.receiptDate}>{receipt.dateReceived}</Text>
                  <Text style={styles.receiptCategory}>{receipt.groupName}</Text>
                  <Text style={styles.receiptCategory}>{receipt.note}</Text>
                </View>
                <View style={styles.receiptAmount}>
                  <Text style={styles.amountText}>{receipt.amount}</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
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
    paddingBottom: 100, // Space for footer
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

export default ReceiptsList;