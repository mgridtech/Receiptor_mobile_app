import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import Footer from './FooterH';

const Settings = ({ navigation }) => {
  const [expandedSection, setExpandedSection] = useState(null);

  const handleBackPress = () => {
    navigation.goBack();
  };

  const toggleSection = (section) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const privacyPolicyContent = `
Last updated: December 2024

At Receiptor, we are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, and safeguard your data when you use our receipt management application.

Information We Collect:
• Receipt images and data you choose to upload
• Purchase information extracted from receipts
• Account information (email, username)
• Device information for app functionality
• Usage analytics to improve our services

How We Use Your Information:
• To provide receipt scanning and organization services
• To categorize and analyze your spending patterns
• To sync your data across devices
• To improve our app functionality and user experience
• To provide customer support when needed

Data Security:
• All receipt data is encrypted during transmission and storage
• We use industry-standard security measures
• Your personal financial information is never shared with third parties
• Receipt images are processed securely and can be deleted at any time

Your Rights:
• Access and download your data
• Delete your account and all associated data
• Control data sharing preferences
• Request data corrections

Contact us at privacy@receiptor.com for any privacy-related questions.
  `;

  const termsConditionsContent = `
Last updated: December 2024

Welcome to Receiptor! These Terms and Conditions govern your use of our receipt management application and services.

Acceptance of Terms:
By downloading, installing, or using Receiptor, you agree to be bound by these Terms and Conditions. If you do not agree, please do not use our services.

Service Description:
Receiptor is a mobile application that allows users to:
• Scan and digitize paper receipts
• Organize and categorize purchases
• Track spending patterns
• Store receipt data securely in the cloud
• Generate spending reports and analytics

User Responsibilities:
• Provide accurate information when creating your account
• Keep your login credentials secure
• Use the app only for lawful purposes
• Respect intellectual property rights
• Not attempt to reverse engineer or hack the application

Data Accuracy:
While we strive for accuracy in receipt scanning and data extraction, users are responsible for verifying the accuracy of scanned information. Receiptor is not liable for errors in automated data extraction.

Subscription and Payments:
• Premium features may require a subscription
• Subscription fees are non-refundable except as required by law
• Subscriptions automatically renew unless canceled
• Free tier limitations may apply

Limitation of Liability:
Receiptor is provided "as is" without warranties. We are not liable for any damages arising from the use or inability to use our services.

Termination:
We reserve the right to terminate accounts that violate these terms. Users may cancel their accounts at any time through the app settings.

Changes to Terms:
We may update these Terms and Conditions periodically. Continued use of the app constitutes acceptance of updated terms.

Contact us at support@receiptor.com for questions about these terms.
  `;

  const aboutUsContent = `
Welcome to Receiptor - Your Smart Receipt Management Solution!

Our Story:
Receiptor was born from a simple frustration - losing paper receipts and struggling to track expenses. Founded in 2024, we set out to create the most intuitive and powerful receipt management app that helps people take control of their financial records.

What We Do:
Receiptor transforms the way you manage receipts and track expenses. Our cutting-edge OCR technology instantly digitizes your paper receipts, automatically extracting key information like merchant names, dates, amounts, and categories. No more lost receipts or manual data entry!

Key Features:
• Advanced OCR scanning with 99% accuracy
• Automatic categorization and expense tracking
• Cloud sync across all your devices
• Detailed spending analytics and reports
• Secure data encryption and backup
• Export capabilities for tax season
• Multi-currency support for travelers

Our Mission:
To simplify financial record-keeping for everyone, making expense tracking effortless and accessible. We believe that managing your receipts shouldn't be a chore - it should be quick, easy, and even enjoyable.

Why Choose Receiptor:
✨ Lightning-fast scanning technology
📱 Beautiful, intuitive interface
🔒 Bank-level security and privacy
📊 Powerful analytics and insights
☁️ Seamless cloud synchronization
🌍 Works in 50+ countries worldwide

Our Team:
We're a passionate team of developers, designers, and financial experts who understand the challenges of modern expense management. Based in Silicon Valley with team members worldwide, we're committed to continuous innovation and user satisfaction.

Recognition:
• Featured in "Top 10 Finance Apps 2024" by TechCrunch
• Winner of "Best User Experience" at Mobile App Awards
• 4.8/5 stars with over 100,000 downloads
• Trusted by small businesses and Fortune 500 companies

Future Vision:
We're constantly evolving Receiptor with new features like AI-powered expense predictions, integration with popular accounting software, and advanced business reporting tools. Our goal is to become the world's most trusted receipt management platform.

Contact Us:
Have questions or feedback? We'd love to hear from you!
📧 Email: hello@receiptor.com
🌐 Website: www.receiptor.com
📱 Follow us: @ReceiptorApp on all social platforms

Thank you for choosing Receiptor. Let's make receipt management simple together!

Version 2.1.0 • December 2024
  `;

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
          <Text style={styles.headerTitle}>Settings</Text>
        </View>
        {/* Inverted U Shape Bottom */}
        <View style={styles.invertedUBottom} />
      </View>

      {/* Settings Content */}
      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.settingsList}>

          {/* Privacy Policy Section */}
          <TouchableOpacity
            style={styles.settingsCard}
            onPress={() => toggleSection('privacy')}
          >
            <View style={styles.settingsHeader}>
              <View style={styles.settingsIcon}>
                <Text style={styles.iconText}>🔒</Text>
              </View>
              <Text style={styles.settingsTitle}>Privacy Policy</Text>
              <Text style={styles.expandIcon}>
                {expandedSection === 'privacy' ? '▼' : '▶'}
              </Text>
            </View>
          </TouchableOpacity>

          {/* Privacy Policy Content */}
          {expandedSection === 'privacy' && (
            <View style={styles.contentCard}>
              <Text style={styles.contentText}>{privacyPolicyContent}</Text>
            </View>
          )}

          {/* Terms and Conditions Section */}
          <TouchableOpacity
            style={styles.settingsCard}
            onPress={() => toggleSection('terms')}
          >
            <View style={styles.settingsHeader}>
              <View style={styles.settingsIcon}>
                <Text style={styles.iconText}>📋</Text>
              </View>
              <Text style={styles.settingsTitle}>Terms and Conditions</Text>
              <Text style={styles.expandIcon}>
                {expandedSection === 'terms' ? '▼' : '▶'}
              </Text>
            </View>
          </TouchableOpacity>

          {/* Terms and Conditions Content */}
          {expandedSection === 'terms' && (
            <View style={styles.contentCard}>
              <Text style={styles.contentText}>{termsConditionsContent}</Text>
            </View>
          )}

          {/* About Us Section */}
          <TouchableOpacity
            style={styles.settingsCard}
            onPress={() => toggleSection('about')}
          >
            <View style={styles.settingsHeader}>
              <View style={styles.settingsIcon}>
                <Text style={styles.iconText}>ℹ️</Text>
              </View>
              <Text style={styles.settingsTitle}>About Us</Text>
              <Text style={styles.expandIcon}>
                {expandedSection === 'about' ? '▼' : '▶'}
              </Text>
            </View>
          </TouchableOpacity>

          {/* About Us Content */}
          {expandedSection === 'about' && (
            <View style={styles.contentCard}>
              <Text style={styles.contentText}>{aboutUsContent}</Text>
            </View>
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
  settingsList: {
    paddingHorizontal: 20,
    paddingTop: 30,
    paddingBottom: 107,
  },
  settingsCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  settingsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingsIcon: {
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
  settingsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  expandIcon: {
    fontSize: 16,
    color: '#7C3AED',
    fontWeight: 'bold',
  },
  contentCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    marginTop: 6,
    elevation: 4,
    shadowColor: '#4B5563',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  contentText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    textAlign: 'justify',
  },
});

export default Settings;