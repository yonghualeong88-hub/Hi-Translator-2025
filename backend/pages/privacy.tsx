import React from 'react';
import Head from 'next/head';

export default function PrivacyPolicy() {
  return (
    <>
      <Head>
        <title>Privacy Policy - Speak to Translator</title>
        <meta name="description" content="Privacy Policy for Speak to Translator" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>
      <div style={styles.container}>
        <div style={styles.content}>
          <h1 style={styles.title}>Privacy Policy</h1>
          <p style={styles.subtitle}>Speak to Translator</p>
          <p style={styles.date}><strong>Effective Date:</strong> October 16, 2025</p>
          <p style={styles.date}><strong>Last Updated:</strong> October 16, 2025</p>

          <hr style={styles.divider} />

          <section style={styles.section}>
            <h2 style={styles.heading}>1. Introduction</h2>
            <p style={styles.paragraph}>
              Welcome to Speak to Translator! This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application. Please read this privacy policy carefully. If you do not agree with the terms of this privacy policy, please do not access the application.
            </p>
            <p style={styles.paragraph}>
              We respect your privacy and are committed to protecting your personal data. This policy applies to all information collected through our application and any related services, sales, marketing, or events.
            </p>
          </section>

          <section style={styles.section}>
            <h2 style={styles.heading}>2. Information We Collect</h2>
            
            <h3 style={styles.subheading}>2.1 Personal Information</h3>
            <p style={styles.paragraph}>
              We do not collect personal information such as names, email addresses, or phone numbers. Our application is designed to work without requiring user registration or personal data input.
            </p>

            <h3 style={styles.subheading}>2.2 Translation Data</h3>
            <p style={styles.paragraph}>
              When you use our translation services, the following data may be processed:
            </p>
            <ul style={styles.list}>
              <li><strong>Voice Input:</strong> Audio recordings are sent to third-party services (OpenAI Whisper API) for speech recognition</li>
              <li><strong>Text Input:</strong> Text content is sent to Google Translate API for translation</li>
              <li><strong>Image Data:</strong> Photos are processed by Google Cloud Vision API for text recognition</li>
            </ul>
            <p style={styles.paragraph}>
              <strong>Important:</strong> This data is processed in real-time and is not stored on our servers. We do not have access to or retain your translation content.
            </p>

            <h3 style={styles.subheading}>2.3 Device Information</h3>
            <p style={styles.paragraph}>
              We may collect anonymous device information to improve our services:
            </p>
            <ul style={styles.list}>
              <li>Device model and operating system version</li>
              <li>App version and usage statistics</li>
              <li>Language preferences</li>
              <li>Crash reports and performance data</li>
            </ul>
          </section>

          <section style={styles.section}>
            <h2 style={styles.heading}>3. How We Use Your Information</h2>
            <p style={styles.paragraph}>
              We use the information we collect to:
            </p>
            <ul style={styles.list}>
              <li>Provide translation services</li>
              <li>Improve app performance and user experience</li>
              <li>Debug technical issues</li>
              <li>Ensure app compatibility across different devices</li>
              <li>Analyze usage patterns to enhance features</li>
            </ul>
          </section>

          <section style={styles.section}>
            <h2 style={styles.heading}>4. Third-Party Services</h2>
            <p style={styles.paragraph}>
              Our application integrates with the following third-party services:
            </p>
            <ul style={styles.list}>
              <li><strong>Google Cloud Translation API:</strong> For text translation services</li>
              <li><strong>Google Cloud Vision API:</strong> For image text recognition</li>
              <li><strong>OpenAI Whisper API:</strong> For speech recognition</li>
              <li><strong>Google ML Kit:</strong> For on-device text recognition</li>
            </ul>
            <p style={styles.paragraph}>
              These services have their own privacy policies. We recommend reviewing their terms and conditions.
            </p>
          </section>

          <section style={styles.section}>
            <h2 style={styles.heading}>5. Data Storage and Security</h2>
            <p style={styles.paragraph}>
              We implement appropriate technical and organizational security measures to protect your information:
            </p>
            <ul style={styles.list}>
              <li>All data transmission is encrypted using industry-standard protocols</li>
              <li>We do not store personal data on our servers</li>
              <li>Translation data is processed in real-time and immediately discarded</li>
              <li>Regular security audits and updates</li>
            </ul>
          </section>

          <section style={styles.section}>
            <h2 style={styles.heading}>6. Data Sharing and Disclosure</h2>
            <p style={styles.paragraph}>
              We do not sell, trade, or otherwise transfer your information to third parties, except:
            </p>
            <ul style={styles.list}>
              <li>When required by law or legal process</li>
              <li>To protect our rights, property, or safety</li>
              <li>With your explicit consent</li>
              <li>In connection with a business transfer or acquisition</li>
            </ul>
          </section>

          <section style={styles.section}>
            <h2 style={styles.heading}>7. Your Rights</h2>
            <p style={styles.paragraph}>
              Depending on your location, you may have the following rights regarding your personal data:
            </p>
            <ul style={styles.list}>
              <li><strong>Access:</strong> Request information about the data we have about you</li>
              <li><strong>Correction:</strong> Request correction of inaccurate data</li>
              <li><strong>Deletion:</strong> Request deletion of your data</li>
              <li><strong>Portability:</strong> Request a copy of your data in a portable format</li>
              <li><strong>Objection:</strong> Object to certain types of data processing</li>
            </ul>
          </section>

          <section style={styles.section}>
            <h2 style={styles.heading}>8. Children's Privacy</h2>
            <p style={styles.paragraph}>
              Our application is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13. If you are a parent or guardian and believe your child has provided us with personal information, please contact us.
            </p>
          </section>

          <section style={styles.section}>
            <h2 style={styles.heading}>9. International Data Transfers</h2>
            <p style={styles.paragraph}>
              Your information may be transferred to and processed in countries other than your own. We ensure that such transfers comply with applicable data protection laws and implement appropriate safeguards.
            </p>
          </section>

          <section style={styles.section}>
            <h2 style={styles.heading}>10. Changes to This Policy</h2>
            <p style={styles.paragraph}>
              We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last Updated" date. You are advised to review this Privacy Policy periodically for any changes.
            </p>
          </section>

          <section style={styles.section}>
            <h2 style={styles.heading}>11. Contact Us</h2>
            <p style={styles.paragraph}>
              If you have any questions about this Privacy Policy or our privacy practices, please contact us:
            </p>
            <p style={styles.paragraph}>
              <strong>Email:</strong> hlappsinfo@gmail.com<br />
              <strong>Developer:</strong> HL Yong
            </p>
          </section>

          <hr style={styles.divider} />
          <p style={styles.footer}>
            This Privacy Policy is effective as of October 16, 2025.
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