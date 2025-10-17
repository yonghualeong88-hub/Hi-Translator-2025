import React from 'react';
import Head from 'next/head';

export default function TermsOfService() {
  return (
    <>
      <Head>
        <title>Terms of Service - Speak to Translator</title>
        <meta name="description" content="Terms of Service for Speak to Translator" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>
      <div style={styles.container}>
        <div style={styles.content}>
          <h1 style={styles.title}>Terms of Service</h1>
          <p style={styles.subtitle}>Speak to Translator</p>
          <p style={styles.date}><strong>Effective Date:</strong> October 16, 2025</p>
          <p style={styles.date}><strong>Last Updated:</strong> October 16, 2025</p>

          <hr style={styles.divider} />

          <section style={styles.section}>
            <h2 style={styles.heading}>1. Acceptance of Terms</h2>
            <p style={styles.paragraph}>
              By downloading, installing, accessing, or using the Speak to Translator mobile application ("App"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, please do not use the App.
            </p>
            <p style={styles.paragraph}>
              These Terms constitute a legally binding agreement between you and the developer, HL Yong ("we," "us," or "our"). Your use of the App constitutes acceptance of these Terms.
            </p>
          </section>

          <section style={styles.section}>
            <h2 style={styles.heading}>2. Description of Service</h2>
            <p style={styles.paragraph}>
              Speak to Translator is a multilingual translation application that provides the following services:
            </p>
            <ul style={styles.list}>
              <li><strong>Voice Translation:</strong> Real-time speech-to-text translation using advanced AI technology</li>
              <li><strong>Text Translation:</strong> Instant text translation between multiple languages</li>
              <li><strong>Camera Translation:</strong> Optical Character Recognition (OCR) and translation of text in images</li>
              <li><strong>Offline Translation:</strong> Downloadable language packs for offline use</li>
              <li><strong>AI Phrase Expansion:</strong> Intelligent generation of related phrases and expressions</li>
            </ul>
            <p style={styles.paragraph}>
              The App supports over 80 languages and is designed to facilitate communication across language barriers.
            </p>
          </section>

          <section style={styles.section}>
            <h2 style={styles.heading}>3. User Eligibility</h2>
            <p style={styles.paragraph}>
              You must be at least 13 years old to use this App. If you are under 18, you must have parental or guardian consent to use the App. By using the App, you represent and warrant that you meet these age requirements.
            </p>
          </section>

          <section style={styles.section}>
            <h2 style={styles.heading}>4. User Responsibilities</h2>
            <p style={styles.paragraph}>
              You agree to use the App responsibly and in accordance with applicable laws and regulations. You will not:
            </p>
            <ul style={styles.list}>
              <li>Use the App for any illegal, unauthorized, or prohibited purpose</li>
              <li>Attempt to reverse engineer, decompile, disassemble, or hack the App</li>
              <li>Use the App to transmit harmful, malicious, or inappropriate content</li>
              <li>Violate any applicable laws, regulations, or third-party rights</li>
              <li>Interfere with or disrupt the App's functionality or security</li>
              <li>Create multiple accounts to circumvent usage limitations</li>
              <li>Use automated systems or bots to access the App</li>
            </ul>
          </section>

          <section style={styles.section}>
            <h2 style={styles.heading}>5. Subscription and Payment Terms</h2>
            
            <h3 style={styles.subheading}>5.1 Free Version</h3>
            <p style={styles.paragraph}>
              The App offers a free version with limited features:
            </p>
            <ul style={styles.list}>
              <li>Limited number of translations per day</li>
              <li>Display of advertisements</li>
              <li>Basic translation features</li>
            </ul>

            <h3 style={styles.subheading}>5.2 Premium Subscription</h3>
            <p style={styles.paragraph}>
              Premium subscription provides enhanced features:
            </p>
            <ul style={styles.list}>
              <li>Unlimited translations</li>
              <li>Ad-free experience</li>
              <li>Access to all premium features</li>
              <li>Priority customer support</li>
            </ul>

            <h3 style={styles.subheading}>5.3 Trial Period</h3>
            <p style={styles.paragraph}>
              New users receive a 3-day free trial of premium features. After the trial period, you will be charged the subscription fee unless you cancel before the trial ends.
            </p>

            <h3 style={styles.subheading}>5.4 Payment and Billing</h3>
            <p style={styles.paragraph}>
              Subscription fees are charged through your app store account (Google Play Store or Apple App Store). All sales are final unless required by applicable law. Subscription fees are non-refundable except as required by law.
            </p>
          </section>

          <section style={styles.section}>
            <h2 style={styles.heading}>6. Privacy and Data Protection</h2>
            <p style={styles.paragraph}>
              Your privacy is important to us. Our collection and use of personal information is governed by our Privacy Policy, which is incorporated into these Terms by reference. Please review our Privacy Policy to understand our data practices.
            </p>
          </section>

          <section style={styles.section}>
            <h2 style={styles.heading}>7. Third-Party Services</h2>
            <p style={styles.paragraph}>
              The App integrates with third-party services to provide translation functionality:
            </p>
            <ul style={styles.list}>
              <li><strong>Google Cloud Translation API:</strong> For text translation services</li>
              <li><strong>Google Cloud Vision API:</strong> For image text recognition</li>
              <li><strong>OpenAI Whisper API:</strong> For speech recognition</li>
              <li><strong>Google ML Kit:</strong> For on-device text recognition</li>
            </ul>
            <p style={styles.paragraph}>
              These third-party services are subject to their own terms of service and privacy policies. We are not responsible for the availability, accuracy, or content of these third-party services.
            </p>
          </section>

          <section style={styles.section}>
            <h2 style={styles.heading}>8. Intellectual Property Rights</h2>
            <p style={styles.paragraph}>
              The App and its original content, features, and functionality are owned by HL Yong and are protected by international copyright, trademark, patent, trade secret, and other intellectual property laws.
            </p>
            <p style={styles.paragraph}>
              You may not copy, modify, distribute, sell, or lease any part of our services or included software, nor may you reverse engineer or attempt to extract the source code of that software.
            </p>
          </section>

          <section style={styles.section}>
            <h2 style={styles.heading}>9. Disclaimers and Limitations</h2>
            
            <h3 style={styles.subheading}>9.1 Service Availability</h3>
            <p style={styles.paragraph}>
              We strive to provide continuous service availability, but we do not guarantee that the App will be available at all times. The App may be temporarily unavailable due to maintenance, updates, or technical issues.
            </p>

            <h3 style={styles.subheading}>9.2 Translation Accuracy</h3>
            <p style={styles.paragraph}>
              While we strive to provide accurate translations, we cannot guarantee the accuracy, completeness, or reliability of any translation. Translations are provided for informational purposes only and should not be relied upon for critical decisions.
            </p>

            <h3 style={styles.subheading}>9.3 Warranty Disclaimer</h3>
            <p style={styles.paragraph}>
              THE APP IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
            </p>
          </section>

          <section style={styles.section}>
            <h2 style={styles.heading}>10. Limitation of Liability</h2>
            <p style={styles.paragraph}>
              TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT SHALL HL YONG BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING WITHOUT LIMITATION, LOSS OF PROFITS, DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES, RESULTING FROM YOUR USE OF THE APP.
            </p>
            <p style={styles.paragraph}>
              Our total liability to you for any damages arising from or related to these Terms or the App shall not exceed the amount you paid us for the App in the 12 months preceding the claim.
            </p>
          </section>

          <section style={styles.section}>
            <h2 style={styles.heading}>11. Indemnification</h2>
            <p style={styles.paragraph}>
              You agree to defend, indemnify, and hold harmless HL Yong from and against any claims, damages, obligations, losses, liabilities, costs, or debt, and expenses (including attorney's fees) resulting from or arising out of your use of the App or violation of these Terms.
            </p>
          </section>

          <section style={styles.section}>
            <h2 style={styles.heading}>12. Termination</h2>
            <p style={styles.paragraph}>
              We may terminate or suspend your access to the App immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.
            </p>
            <p style={styles.paragraph}>
              Upon termination, your right to use the App will cease immediately. All provisions of the Terms which by their nature should survive termination shall survive termination.
            </p>
          </section>

          <section style={styles.section}>
            <h2 style={styles.heading}>13. Governing Law and Dispute Resolution</h2>
            <p style={styles.paragraph}>
              These Terms shall be interpreted and governed by the laws of the jurisdiction where the developer resides, without regard to its conflict of law provisions.
            </p>
            <p style={styles.paragraph}>
              Any disputes arising from these Terms or your use of the App shall be resolved through binding arbitration in accordance with the rules of the relevant arbitration association.
            </p>
          </section>

          <section style={styles.section}>
            <h2 style={styles.heading}>14. Changes to Terms</h2>
            <p style={styles.paragraph}>
              We reserve the right to modify or replace these Terms at any time. If a revision is material, we will try to provide at least 30 days notice prior to any new terms taking effect.
            </p>
            <p style={styles.paragraph}>
              Your continued use of the App after any changes to these Terms constitutes acceptance of those changes.
            </p>
          </section>

          <section style={styles.section}>
            <h2 style={styles.heading}>15. Severability</h2>
            <p style={styles.paragraph}>
              If any provision of these Terms is held to be invalid or unenforceable by a court, the remaining provisions of these Terms will remain in effect.
            </p>
          </section>

          <section style={styles.section}>
            <h2 style={styles.heading}>16. Contact Information</h2>
            <p style={styles.paragraph}>
              If you have any questions about these Terms of Service, please contact us:
            </p>
            <p style={styles.paragraph}>
              <strong>Email:</strong> hlappsinfo@gmail.com<br />
              <strong>Developer:</strong> HL Yong
            </p>
          </section>

          <hr style={styles.divider} />
          <p style={styles.footer}>
            These Terms of Service are effective as of October 16, 2025.
          </p>
        </div>
      </div>
    </>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f8f9fa',
    padding: '20px',
    fontFamily: 'system-ui, -apple-system, sans-serif',
  },
  content: {
    maxWidth: '800px',
    margin: '0 auto',
    backgroundColor: 'white',
    padding: '40px',
    borderRadius: '12px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
  },
  title: {
    fontSize: '36px',
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: '8px',
    textAlign: 'center' as const,
  },
  subtitle: {
    fontSize: '18px',
    color: '#666',
    marginBottom: '20px',
    textAlign: 'center' as const,
    fontWeight: '500',
  },
  date: {
    fontSize: '14px',
    color: '#888',
    marginBottom: '4px',
    textAlign: 'center' as const,
  },
  divider: {
    border: 'none',
    borderTop: '2px solid #e9ecef',
    margin: '40px 0',
  },
  section: {
    marginBottom: '32px',
  },
  heading: {
    fontSize: '24px',
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: '16px',
    borderBottom: '2px solid #007AFF',
    paddingBottom: '8px',
  },
  subheading: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#333',
    marginTop: '24px',
    marginBottom: '12px',
  },
  paragraph: {
    fontSize: '16px',
    lineHeight: '1.7',
    color: '#444',
    marginBottom: '16px',
  },
  list: {
    fontSize: '16px',
    lineHeight: '1.7',
    color: '#444',
    marginLeft: '24px',
    marginBottom: '16px',
  },
  footer: {
    fontSize: '14px',
    color: '#888',
    textAlign: 'center' as const,
    marginTop: '32px',
    fontStyle: 'italic',
  },
};