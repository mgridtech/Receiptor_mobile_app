import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Modal,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { resetPassword } from '../Services/Services';
import Toast from 'react-native-toast-message';

console.log('=== IMPORT DEBUG ===');
console.log('resetPassword imported:', resetPassword);
console.log('typeof resetPassword:', typeof resetPassword);

const ForgotPasswordScreen = ({ visible, onClose }) => {
    const [email, setEmail] = useState('');
    const [showSendLink, setShowSendLink] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);


    const handleEmailChange = (text) => {
        setEmail(text);
        setShowSendLink(!!text.trim());
        setShowSuccess(false);
    };

    const handleSendLink = async () => {
        console.log('=== HANDLE SEND LINK DEBUG START ===');
        console.log('Email value:', email);
        console.log('Setting isLoading to true');

        setIsLoading(true);

        try {
            console.log('About to call resetPassword with email:', email);

            const result = await resetPassword(email);

            console.log('=== RESET PASSWORD RESULT ===');
            console.log('Result type:', typeof result);
            console.log('Result:', JSON.stringify(result, null, 2));
            console.log('Result.success:', result.success);
            console.log('Result.error:', result.error);
            console.log('Result.data:', result.data);

            if (result.success) {
                console.log('Success path - setting showSuccess to true');
                setShowSuccess(true);
                setShowSendLink(false);
            } else {
                console.log('Error path - showing alert with error:', result.error);
                Toast.show({
                    type: 'error',
                    text1: 'Error',
                    text2: result.error || 'Failed to send reset link. Please try again.',
                    position: 'top',
                    topOffset: 130,
                    visibilityTime: 3000,
                });
            }

        } catch (error) {
            console.error('=== CATCH BLOCK ERROR ===');
            console.error('Error type:', error.constructor.name);
            console.error('Error message:', error.message);
            console.error('Error stack:', error.stack);
            console.error('Full error object:', error);

            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Network error occurred. Please try again.',
                position: 'top',
                topOffset: 130,
                visibilityTime: 3000,
            });
        } finally {
            console.log('=== FINALLY BLOCK ===');
            console.log('Setting isLoading to false');
            setIsLoading(false);
        }

        console.log('=== HANDLE SEND LINK DEBUG END ===');
    };

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
            onRequestClose={onClose}
        >
            <KeyboardAvoidingView
                style={styles.modalOverlay}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <View style={styles.modalContent}>
                    {!showSuccess ? (
                        <>
                            <Text style={styles.modalTitle}>Forgot Password</Text>
                            <TextInput
                                placeholder="Enter your email"
                                value={email}
                                onChangeText={handleEmailChange}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                style={styles.input}
                                placeholderTextColor="#888"
                            />
                            {showSendLink && (
                                <TouchableOpacity
                                    style={styles.sendButton}
                                    onPress={handleSendLink}
                                >
                                    <Text style={styles.sendButtonText}>Send Reset Link</Text>
                                </TouchableOpacity>
                            )}
                        </>
                    ) : (
                        <Text style={styles.successText}>
                            A link to reset your password has been sent to your email.
                        </Text>
                    )}
                    <TouchableOpacity
                        style={styles.closeButton}
                        onPress={onClose}
                    >
                        <Text style={styles.closeButtonText}>Close</Text>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
};

export default ForgotPasswordScreen;

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        width: '85%',
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 24,
        alignItems: 'center',
        elevation: 5,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#7C3AED',
        marginBottom: 24,
        marginTop: 8,
    },
    input: {
        width: '100%',
        borderWidth: 1,
        borderColor: '#7C3AED',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        marginBottom: 20,
        color: 'black',
    },
    sendButton: {
        width: '100%',
        padding: 14,
        borderRadius: 8,
        alignItems: 'center',
        backgroundColor: '#7C3AED',
        marginBottom: 16,
    },
    sendButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    closeButton: {
        width: 120,
        paddingVertical: 12,
        borderRadius: 30,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#ef4444',
        backgroundColor: '#fff',
        marginTop: 16,
        alignSelf: 'center',
    },
    closeButtonText: {
        color: '#ef4444',
        fontSize: 16,
        fontWeight: 'bold',
    }, successText: {
        fontSize: 16,
        color: '#16a34a',
        textAlign: 'center',
        marginTop: 30,
        marginBottom: 10,
        fontWeight: '600',
    },
});