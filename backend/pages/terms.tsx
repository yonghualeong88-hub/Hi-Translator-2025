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
          <p style={styles.subtitle}>使用条款</p>
          <p style={styles.date}><strong>Effective Date | 生效日期:</strong> October 16, 2025</p>
          <p style={styles.date}><strong>Developer | 开发者:</strong> HL Yong</p>

          <hr style={styles.divider} />

          <section style={styles.section}>
            <h2 style={styles.heading}>一、接受条款 | Acceptance of Terms</h2>
            <p style={styles.paragraph}>
              欢迎使用 <strong>Speak to Translator</strong>（以下简称"本应用"）。
              通过下载、安装或使用本应用，您同意遵守本使用条款。
              如果您不同意这些条款，请不要使用本应用。
            </p>
            <p style={styles.paragraph}>
              <em>By accessing or using Speak to Translator, you agree to be bound by these Terms of Service.
              If you do not agree, please do not use the App.</em>
            </p>
          </section>

          <section style={styles.section}>
            <h2 style={styles.heading}>二、服务描述 | Service Description</h2>
            <p style={styles.paragraph}>本应用提供以下功能：</p>
            <ul style={styles.list}>
              <li><strong>语音翻译</strong>：支持 84 种语言的实时语音识别与翻译</li>
              <li><strong>文本翻译</strong>：输入文本即可翻译</li>
              <li><strong>常用短语</strong>：预设 100+ 常用短语，支持自定义</li>
              <li><strong>AI 短语扩展</strong>：基于 AI 生成相关短语建议</li>
              <li><strong>离线语言包</strong>：订阅用户可下载离线翻译包</li>
              <li><strong>翻译历史</strong>：本地保存翻译记录</li>
            </ul>
            <p style={styles.paragraph}>
              我们保留随时修改、暂停或终止服务的权利，恕不另行通知。
            </p>
          </section>

          <section style={styles.section}>
            <h2 style={styles.heading}>三、用户责任 | User Responsibilities</h2>
            <p style={styles.paragraph}>您同意：</p>
            <ul style={styles.list}>
              <li>仅将本应用用于合法目的；</li>
              <li>不利用本应用从事任何非法、有害或侵犯他人权利的活动；</li>
              <li>不尝试破解、反编译或干扰本应用的正常运行；</li>
              <li>不滥用翻译服务（如大量自动化请求）。</li>
            </ul>
            <p style={styles.paragraph}>
              违反上述规定可能导致您的访问权限被终止。
            </p>
          </section>

          <section style={styles.section}>
            <h2 style={styles.heading}>四、订阅与付费 | Subscription & Payment</h2>
            
            <h3 style={styles.subheading}>4.1 订阅模式</h3>
            <p style={styles.paragraph}>本应用提供以下订阅选项：</p>
            <ul style={styles.list}>
              <li><strong>免费版本</strong>：基础翻译功能（每日限额）</li>
              <li><strong>Premium 月度订阅</strong>：解锁所有高级功能</li>
              <li><strong>Premium 年度订阅</strong>：解锁所有高级功能，享受折扣优惠</li>
            </ul>

            <h3 style={styles.subheading}>4.2 定价</h3>
            <p style={styles.paragraph}>
              订阅价格因您所在的国家/地区而异，并以当地货币显示。
              实际价格可在应用内订阅页面查看。
            </p>
            <p style={styles.paragraph}>
              所有付款通过 <strong>Apple App Store</strong> 或 <strong>Google Play Store</strong> 处理，
              我们不直接处理或存储您的支付信息。
            </p>

            <h3 style={styles.subheading}>4.3 免费试用</h3>
            <p style={styles.paragraph}>
              新用户可享受 <strong>7 天免费试用</strong>（如适用）。
              试用期结束前可随时取消，不会产生费用。
              如未取消，试用结束后将自动转为付费订阅。
            </p>

            <h3 style={styles.subheading}>4.4 自动续订</h3>
            <p style={styles.paragraph}>
              订阅为自动续订模式。除非您在当前订阅期结束前至少 24 小时取消，
              否则订阅将自动续订并收取费用。
            </p>

            <h3 style={styles.subheading}>4.5 取消与退款</h3>
            <ul style={styles.list}>
              <li>您可以随时在 App Store 或 Google Play 设置中取消订阅；</li>
              <li>取消后，您可以继续使用至当前订阅期结束；</li>
              <li>退款政策由 Apple 或 Google 控制，请联系相应平台。</li>
            </ul>
          </section>

          <section style={styles.section}>
            <h2 style={styles.heading}>五、知识产权 | Intellectual Property</h2>
            <p style={styles.paragraph}>
              本应用的所有内容、功能、设计、代码及商标均属于 HL Yong 或其授权方所有。
              未经书面许可，您不得复制、修改、分发或商业使用本应用的任何部分。
            </p>
          </section>

          <section style={styles.section}>
            <h2 style={styles.heading}>六、免责声明 | Disclaimer</h2>
            <p style={styles.paragraph}>
              本应用按"现状"提供，不提供任何明示或暗示的保证，包括但不限于：
            </p>
            <ul style={styles.list}>
              <li>翻译结果的准确性、完整性或适用性；</li>
              <li>服务的持续可用性或无错误运行；</li>
              <li>第三方 API（OpenAI、Google）的服务质量。</li>
            </ul>
            <p style={styles.paragraph}>
              <strong>重要提示：</strong>本应用的翻译结果仅供参考，不应用于法律、医疗或其他关键场景。
              对于因使用翻译结果而产生的任何损失，我们不承担责任。
            </p>
          </section>

          <section style={styles.section}>
            <h2 style={styles.heading}>七、责任限制 | Limitation of Liability</h2>
            <p style={styles.paragraph}>
              在法律允许的最大范围内，HL Yong 及其关联方不对以下情况承担责任：
            </p>
            <ul style={styles.list}>
              <li>因使用或无法使用本应用而导致的任何直接、间接、偶然或后果性损失；</li>
              <li>因第三方服务中断或数据丢失造成的损失；</li>
              <li>因用户设备、网络或操作系统问题导致的服务中断。</li>
            </ul>
          </section>

          <section style={styles.section}>
            <h2 style={styles.heading}>八、修改与终止 | Modifications & Termination</h2>
            <p style={styles.paragraph}>
              我们保留随时修改或终止本应用（全部或部分功能）的权利，无需提前通知。
              我们也可以终止或暂停您的访问权限，如果我们认为您违反了本条款。
            </p>
          </section>

          <section style={styles.section}>
            <h2 style={styles.heading}>九、适用法律 | Governing Law</h2>
            <p style={styles.paragraph}>
              本条款受您所在国家/地区的法律管辖。
              任何争议应首先通过友好协商解决。
            </p>
          </section>

          <section style={styles.section}>
            <h2 style={styles.heading}>十、联系我们 | Contact Us</h2>
            <p style={styles.paragraph}>
              如果您对本使用条款有任何疑问，请通过以下方式联系我们：
            </p>
            <p style={styles.contact}>📧 <a href="mailto:hlappsinfo@gmail.com" style={styles.link}>hlappsinfo@gmail.com</a></p>
          </section>

          <footer style={styles.footer}>
            <p>© 2025 HL Yong. All rights reserved.</p>
            <p>These Terms of Service apply to all versions of Speak to Translator.</p>
            <p style={{ marginTop: '20px' }}>
              <a href="/privacy" style={styles.link}>Privacy Policy</a> | 
              <a href="/terms" style={styles.link}> Terms of Service</a>
            </p>
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
    borderLeft: '4px solid #2196F3',
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
    color: '#2196F3',
    textDecoration: 'none',
    borderBottom: '1px solid #2196F3',
    margin: '0 8px',
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

