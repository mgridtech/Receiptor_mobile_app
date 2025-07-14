import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    SafeAreaView,
    Alert,
} from 'react-native';
import MedicalAddForm from './MedicalAddForm';
import Footer from './FooterH';

const AddMedicine = ({ navigation }) => {
    const [showAddForm, setShowAddForm] = useState(false);

    const handleBackPress = () => {
        navigation.goBack();
    };

    const handleAddMedicine = () => {
        setShowAddForm(true);
    };

    const handleSave = (medicineData) => {
        console.log('Medicine data saved:', medicineData);
        // Here you would typically save to your backend/database
        setShowAddForm(false);
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
                    <Text style={styles.headerTitle}>Add Medicine</Text>
                </View>
                {/* Inverted U Shape Bottom */}
                <View style={styles.invertedUBottom} />
            </View>

            {/* Form Content */}
            <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
                <View style={styles.formContainer}>
                    {showAddForm ? (
                        <></>
                    ) : (
                        <MedicalAddForm
                            navigation={navigation}
                            onSave={handleSave}
                        />
                    )}
                </View>
            </ScrollView>

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
        marginTop: -15,
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
    formContainer: {
        paddingHorizontal: 20,
        paddingTop: 30,
        paddingBottom: 100,
    },
    formSection: {
        marginBottom: 24,
    },
    sectionLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 12,
    },
    infoCard: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 20,
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
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    infoIcon: {
        fontSize: 24,
        marginRight: 16,
    },
    infoText: {
        fontSize: 14,
        color: '#666',
        flex: 1,
        lineHeight: 20,
    },
    addMedicineButton: {
        backgroundColor: '#7C3AED',
        borderRadius: 12,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 32,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    addMedicineButtonIcon: {
        fontSize: 20,
        color: 'white',
        fontWeight: 'bold',
        marginRight: 8,
    },
    addMedicineButtonText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: 'white',
    },
});

export default AddMedicine;