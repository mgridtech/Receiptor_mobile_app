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

const ForgotPasswordScreen = ({ visible, onClose }) => {
    const [email, setEmail] = useState('');
    const [showSendLink, setShowSendLink] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    

    const handleEmailChange = (text) => {
        setEmail(text);
        setShowSendLink(!!text.trim());
        setShowSuccess(false);
    };

    const handleSendLink = () => {
        setShowSuccess(true);
        setShowSendLink(false);
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
},    successText: {
        fontSize: 16,
        color: '#16a34a',
        textAlign: 'center',
        marginTop: 30,
        marginBottom: 10,
        fontWeight: '600',
    },
});