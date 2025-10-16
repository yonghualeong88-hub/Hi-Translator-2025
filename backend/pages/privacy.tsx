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
          <h1 style={styles.title}>Privacy Policy for Speak to Translator</h1>
          <p style={styles.subtitle}>隐私政策</p>
          <p style={styles.date}><strong>Effective Date | 生效日期:</strong> October 16, 2025</p>
          <p style={styles.date}><strong>Developer | 开发者:</strong> HL Yong</p>

          <hr style={styles.divider} />

          <section style={styles.section}>
            <h2 style={styles.heading}>一、引言 | Introduction</h2>
            <p style={styles.paragraph}>
              感谢您使用 <strong>Speak to Translator</strong>（以下简称"本应用"）。
              本应用由个人开发者 HL Yong 提供，旨在为全球用户提供多语言语音与文本翻译服务。
            </p>
            <p style={styles.paragraph}>
              本隐私政策旨在说明我们如何处理您的数据。我们非常重视您的隐私，并严格遵守相关法律法规，
              包括《通用数据保护条例》（GDPR）、《加州消费者隐私法案》（CCPA）及《儿童在线隐私保护法》（COPPA）。
            </p>
            <p style={styles.paragraph}>
              <em>By using Speak to Translator, you agree to the terms described in this Privacy Policy.
              We do not collect or store any personal data on our own servers.</em>
            </p>
          </section>

          <section style={styles.section}>
            <h2 style={styles.heading}>二、我们收集的数据 | Data We Collect</h2>
            <p style={styles.paragraph}>
              本应用设计为匿名使用，无需创建账户或提供个人信息。
              我们仅在必要范围内收集以下类型的数据：
            </p>
            
            <h3 style={styles.subheading}>1. 语音与文本输入</h3>
            <p style={styles.paragraph}>
              当您使用语音或文本翻译时，您的输入内容会通过 <strong>OpenAI Whisper API</strong> 或 
              <strong>Google Translate API</strong> 进行处理。
            </p>
            <ul style={styles.list}>
              <li>数据仅用于即时识别与翻译，不会被存储或保留。</li>
            </ul>

            <h3 style={styles.subheading}>2. 设备信息（匿名）</h3>
            <ul style={styles.list}>
              <li>包括设备型号、系统版本、语言设置，用于提升应用性能与兼容性。</li>
            </ul>

            <h3 style={styles.subheading}>3. 使用统计与崩溃日志</h3>
            <ul style={styles.list}>
              <li>我们使用匿名分析工具（如 Expo 服务）收集基本使用数据，以改进稳定性与用户体验。</li>
            </ul>

            <p style={styles.paragraph}>
              <strong>We do not collect:</strong>
            </p>
            <ul style={styles.list}>
              <li>Personal identifiers (name, email, phone number)</li>
              <li>Location or IP address</li>
              <li>Advertising identifiers (IDFA, GAID)</li>
            </ul>
          </section>

          <section style={styles.section}>
            <h2 style={styles.heading}>三、数据的使用方式 | How We Use the Data</h2>
            <p style={styles.paragraph}>收集的数据仅用于以下目的：</p>
            <ul style={styles.list}>
              <li>提供即时翻译与语音识别服务；</li>
              <li>改善应用性能与兼容性；</li>
              <li>分析匿名统计数据，以改进功能与用户体验；</li>
              <li>处理订阅付款（通过 Google Play / App Store）。</li>
            </ul>
            <p style={styles.paragraph}>
              <em>All data is used only for operational purposes and never sold, shared, or analyzed for advertising.</em>
            </p>
          </section>

          <section style={styles.section}>
            <h2 style={styles.heading}>四、数据的存储与保留 | Data Storage & Retention</h2>
            <ul style={styles.list}>
              <li><strong>我们不在云端存储任何用户数据。</strong></li>
              <li>所有翻译历史与短语记录仅保存在您的设备本地（使用 AsyncStorage）。</li>
              <li>当您卸载应用时，这些本地数据将自动删除。</li>
              <li>我们不会保留、备份或同步任何用户数据至我们的服务器。</li>
            </ul>
            <p style={styles.paragraph}>
              <em>We only use temporary transmission to third-party APIs (OpenAI / Google) for translation.
              All transmissions are encrypted via HTTPS, and data is deleted immediately after processing.</em>
            </p>
          </section>

          <section style={styles.section}>
            <h2 style={styles.heading}>五、第三方服务 | Third-Party Services</h2>
            <p style={styles.paragraph}>本应用依赖以下第三方服务来实现部分功能：</p>
            <ul style={styles.list}>
              <li><strong>OpenAI Whisper API</strong>（语音识别）<br />
                <a href="https://openai.com/privacy" style={styles.link} target="_blank" rel="noopener noreferrer">
                  https://openai.com/privacy
                </a>
              </li>
              <li><strong>OpenAI GPT-4o-mini API</strong>（AI 翻译与短语扩展）<br />
                <a href="https://openai.com/privacy" style={styles.link} target="_blank" rel="noopener noreferrer">
                  https://openai.com/privacy
                </a>
              </li>
              <li><strong>Google Translate API</strong>（备用翻译服务）<br />
                <a href="https://policies.google.com/privacy" style={styles.link} target="_blank" rel="noopener noreferrer">
                  https://policies.google.com/privacy
                </a>
              </li>
              <li><strong>Expo Services</strong>（语音合成、设备功能）</li>
              <li><strong>React Native IAP</strong>（应用内购买）</li>
            </ul>
            <p style={styles.paragraph}>
              这些第三方可能会根据其隐私政策处理传输数据。
              我们不控制第三方的隐私行为，但仅在必要时使用其服务。
            </p>
          </section>

          <section style={styles.section}>
            <h2 style={styles.heading}>六、数据安全 | Data Security</h2>
            <p style={styles.paragraph}>我们通过以下方式保护您的信息安全：</p>
            <ul style={styles.list}>
              <li>所有网络传输均采用 <strong>HTTPS 加密</strong>；</li>
              <li>无服务器存储，避免集中泄露风险；</li>
              <li>第三方服务均为符合国际安全标准的供应商（OpenAI、Google 等）。</li>
            </ul>
            <p style={styles.paragraph}>
              <em>However, no system is completely secure.
              By using the App, you understand that no online transmission can be guaranteed to be 100% secure.</em>
            </p>
          </section>

          <section style={styles.section}>
            <h2 style={styles.heading}>七、您的权利 | Your Rights (GDPR / CCPA)</h2>
            <p style={styles.paragraph}>如果您居住在欧盟或加州，根据法律您拥有以下权利：</p>
            <ul style={styles.list}>
              <li>访问、纠正或删除您的个人数据；</li>
              <li>要求限制或反对数据处理；</li>
              <li>撤回同意（在适用情况下）。</li>
            </ul>
            <p style={styles.paragraph}>
              由于本应用不收集可识别的个人数据，以上权利通常不适用。
              若您有任何隐私相关请求，可通过电子邮件联系我们：
            </p>
            <p style={styles.contact}>📩 <a href="mailto:hlappsinfo@gmail.com" style={styles.link}>hlappsinfo@gmail.com</a></p>
          </section>

          <section style={styles.section}>
            <h2 style={styles.heading}>八、儿童隐私保护 | Children's Privacy (COPPA)</h2>
            <p style={styles.paragraph}>
              本应用面向所有年龄段用户（4+）。
              我们不会主动收集儿童的任何个人信息。
              如果家长或监护人发现孩子向我们提供了信息，请立即联系我们以删除相关内容。
            </p>
          </section>

          <section style={styles.section}>
            <h2 style={styles.heading}>九、数据删除与保留期限 | Data Deletion & Retention</h2>
            <ul style={styles.list}>
              <li>所有用户数据（翻译记录、短语等）仅存储在设备本地；</li>
              <li>卸载应用即自动删除所有数据；</li>
              <li>我们不提供额外的账户或云端删除机制，因为我们不保存任何云端数据。</li>
            </ul>
            <p style={styles.paragraph}>
              <em>All third-party API data is automatically deleted after processing by the API provider.</em>
            </p>
          </section>

          <section style={styles.section}>
            <h2 style={styles.heading}>十、国际数据传输 | International Data Transfer</h2>
            <p style={styles.paragraph}>
              由于使用 OpenAI 与 Google API，数据可能在不同国家服务器间传输。
              所有传输均通过安全加密通道进行。
              我们仅在必要范围内进行此类国际传输。
            </p>
          </section>

          <section style={styles.section}>
            <h2 style={styles.heading}>十一、本政策的更新 | Updates to This Policy</h2>
            <p style={styles.paragraph}>
              我们可能不时更新本隐私政策，以反映服务变更或法律要求。
              任何修改将发布在应用内"隐私政策"页面，并立即生效。
            </p>
            <p style={styles.paragraph}>
              <em>We recommend reviewing this page periodically.</em>
            </p>
          </section>

          <section style={styles.section}>
            <h2 style={styles.heading}>十二、联系方式 | Contact Us</h2>
            <p style={styles.paragraph}>如果您对隐私政策有任何问题、意见或投诉，请联系我们：</p>
            <p style={styles.contact}>📧 <a href="mailto:hlappsinfo@gmail.com" style={styles.link}>hlappsinfo@gmail.com</a></p>
          </section>

          <section style={styles.section}>
            <h3 style={styles.subheading}>总结：</h3>
            <p style={styles.paragraph}>
              本应用注重隐私保护，不存储、不出售、不追踪任何用户数据。
              您的语音与文字仅用于即时翻译，处理完毕即被删除。
            </p>
          </section>

          <footer style={styles.footer}>
            <p>© 2025 HL Yong. All rights reserved.</p>
            <p>This Privacy Policy applies to all versions of Speak to Translator.</p>
          </footer>
        </div>
      </div>
    </>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f5f5f5',
    padding: '20px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },
  content: {
    maxWidth: '800px',
    margin: '0 auto',
    backgroundColor: 'white',
    padding: '40px',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  },
  title: {
    fontSize: '32px',
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: '8px',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: '24px',
    color: '#666',
    marginBottom: '20px',
    textAlign: 'center',
  },
  date: {
    fontSize: '14px',
    color: '#666',
    marginBottom: '10px',
    textAlign: 'center',
  },
  divider: {
    border: 'none',
    borderTop: '2px solid #e0e0e0',
    margin: '30px 0',
  },
  section: {
    marginBottom: '30px',
  },
  heading: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: '16px',
    borderLeft: '4px solid #4CAF50',
    paddingLeft: '12px',
  },
  subheading: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#333',
    marginTop: '20px',
    marginBottom: '12px',
  },
  paragraph: {
    fontSize: '16px',
    lineHeight: '1.6',
    color: '#333',
    marginBottom: '12px',
  },
  list: {
    fontSize: '16px',
    lineHeight: '1.8',
    color: '#333',
    marginLeft: '20px',
    marginBottom: '12px',
  },
  link: {
    color: '#4CAF50',
    textDecoration: 'none',
    borderBottom: '1px solid #4CAF50',
  },
  contact: {
    fontSize: '18px',
    fontWeight: '500',
    color: '#1a1a1a',
    textAlign: 'center',
    marginTop: '20px',
  },
  footer: {
    marginTop: '50px',
    paddingTop: '20px',
    borderTop: '1px solid #e0e0e0',
    textAlign: 'center',
    fontSize: '14px',
    color: '#999',
  },
};

