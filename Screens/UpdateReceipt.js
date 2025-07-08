import { React, useState } from 'react';
import { Modal, View, KeyboardAvoidingView, Platform, TouchableOpacity, Text, ScrollView, TextInput, StyleSheet } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';


const UpdateReceipt = ({
  visible,
  onClose,
  tempReceiptData,
  setTempReceiptData,
  handleSaveReceipt,
  receiptData
}) => {
  const [showReminderPicker, setShowReminderPicker] = useState(false);
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
              <Text style={styles.modalTitle}>Update Receipt</Text>
              <TouchableOpacity onPress={handleSaveReceipt}>
                <Text style={styles.saveButton}>Save</Text>
              </TouchableOpacity>
            </View>

            {/* Form Fields */}
            <ScrollView style={styles.formContainer} showsVerticalScrollIndicator={false}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Store Name</Text>
                <TextInput
                  style={styles.input}
                  value={tempReceiptData.vendorName}
                  onChangeText={(text) => setTempReceiptData({ ...tempReceiptData, store: text })}
                  placeholder="Enter store name"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Date Received</Text>
                <TextInput
                  style={styles.input}
                  value={tempReceiptData.dateReceived}
                  editable={false}
                  placeholder="Enter date (e.g., Dec 15, 2024)"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Transaction Category</Text>
                <TextInput
                  style={styles.input}
                  value={tempReceiptData.groupName}
                  onChangeText={(text) => setTempReceiptData({ ...tempReceiptData, category: text })}
                  placeholder="Enter category"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Amount</Text>
                <TextInput
                  style={styles.input}
                  value={tempReceiptData.amount}
                  onChangeText={(text) => setTempReceiptData({ ...tempReceiptData, amount: text })}
                  placeholder="Enter amount (e.g., $150.00)"
                  keyboardType="numeric"
                />
              </View>

              {receiptData.medicine && (
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Medicine</Text>
                  <TextInput
                    style={styles.input}
                    value={tempReceiptData.medicine || ''}
                    onChangeText={(text) => setTempReceiptData({ ...tempReceiptData, medicine: text })}
                    placeholder="Enter medicine name"
                  />
                </View>
              )}

              <View style={styles.formGroup}>
                <Text style={styles.label}>Reminder Date</Text>
                <TouchableOpacity
                  style={styles.input}
                  onPress={() => setShowReminderPicker(true)}
                  activeOpacity={0.7}
                >
                  <Text style={{ color: tempReceiptData.reminderDate ? '#1f2937' : '#aaa' }}>
                    {tempReceiptData.reminderDate ? tempReceiptData.reminderDate : 'Select reminder date'}
                  </Text>
                </TouchableOpacity>
                {showReminderPicker && (
                  <DateTimePicker
                    value={new Date()}
                    mode="date"
                    display="default"
                    onChange={(event, date) => {
                      setShowReminderPicker(false);
                      if (event.type === 'set' && date) {
                        const formatted = `${date.getDate().toString().padStart(2, '0')}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getFullYear()}`;
                        setTempReceiptData({ ...tempReceiptData, reminderDate: formatted });
                      }
                    }}
                  />
                )}
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Note</Text>
                <TextInput
                  style={[styles.input, { height: 80, marginBottom: 40 }]}
                  value={tempReceiptData.note}
                  onChangeText={text => setTempReceiptData({ ...tempReceiptData, note: text })}
                  placeholder="Add a note (optional)"
                  placeholderTextColor={'black'}
                  multiline
                />
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
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
});

export default UpdateReceipt;