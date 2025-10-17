import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  Linking,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/contexts/ThemeContext';
import { useI18n } from '@/contexts/I18nContext';
import { ArrowLeft, ExternalLink, Heart, Mail, Globe } from 'lucide-react-native';
import { TouchableOpacity } from 'react-native';
import { router } from 'expo-router';

export default function AboutScreen() {
  const { colors } = useTheme();
  const { t } = useI18n();

  const openLink = async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert(t('common.error', '错误'), t('about.cannotOpenLink', '无法打开链接'));
      }
    } catch (error) {
      Alert.alert(t('common.error', '错误'), t('about.linkError', '打开链接时出错'));
    }
  };

  const openEmail = () => {
    const email = 'hlappsinfo@gmail.com';
    const subject = encodeURIComponent(t('about.emailSubject', '关于 Speak to Translator 应用'));
    const body = encodeURIComponent(t('about.emailBody', '您好，\n\n我想了解关于 Speak to Translator 应用的更多信息。\n\n谢谢！'));
    const url = `mailto:${email}?subject=${subject}&body=${body}`;
    openLink(url);
  };


  const openPrivacyPolicy = () => {
    openLink('https://speak-to-translator.vercel.app/privacy');
  };

  const openTermsOfService = () => {
    openLink('https://speak-to-translator.vercel.app/terms');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          {t('about.title', '关于应用')}
        </Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* App Info */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <View style={styles.appInfo}>
            <View style={styles.appIcon}>
              <Image 
                source={require('@/assets/images/app_logo.png')} 
                style={styles.appLogo}
                resizeMode="contain"
              />
            </View>
            <View style={styles.appDetails}>
              <Text style={[styles.appName, { color: colors.text }]}>
                {t('about.appName', 'Speak to Translator')}
              </Text>
              <Text style={[styles.appVersion, { color: colors.textSecondary }]}>
                {t('about.version', '版本 1.0.0')}
              </Text>
              <Text style={[styles.appSlogan, { color: colors.textSecondary }]}>
                {t('about.slogan', '让沟通无界限')}
              </Text>
            </View>
          </View>
        </View>

        {/* Description */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {t('about.description', '应用介绍')}
          </Text>
          <Text style={[styles.description, { color: colors.textSecondary }]}>
            {t('about.descriptionText', 'Speak to Translator 是一款强大的多语言翻译应用，支持语音翻译、文本翻译、拍照翻译等功能。支持84种语言，让您轻松跨越语言障碍，实现无障碍沟通。')}
          </Text>
        </View>

        {/* Features */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {t('about.features', '主要功能')}
          </Text>
          <View style={styles.featuresList}>
            <Text style={[styles.featureItem, { color: colors.textSecondary }]}>
              • {t('about.feature1', '语音翻译 - 说话即可翻译')}
            </Text>
            <Text style={[styles.featureItem, { color: colors.textSecondary }]}>
              • {t('about.feature2', '文本翻译 - 快速准确的文字翻译')}
            </Text>
            <Text style={[styles.featureItem, { color: colors.textSecondary }]}>
              • {t('about.feature3', '拍照翻译 - OCR识别图片中的文字')}
            </Text>
            <Text style={[styles.featureItem, { color: colors.textSecondary }]}>
              • {t('about.feature4', '离线翻译 - 下载语言包离线使用')}
            </Text>
            <Text style={[styles.featureItem, { color: colors.textSecondary }]}>
              • {t('about.feature5', '多语言支持 - 支持84种语言')}
            </Text>
            <Text style={[styles.featureItem, { color: colors.textSecondary }]}>
              • {t('about.feature6', 'AI短语扩展 - 智能生成相关表达')}
            </Text>
          </View>
        </View>

        {/* Contact */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {t('about.contact', '联系我们')}
          </Text>
          
          <TouchableOpacity style={styles.contactItem} onPress={openEmail}>
            <Mail size={20} color={colors.primary} />
            <Text style={[styles.contactText, { color: colors.text }]}>
              hlappsinfo@gmail.com
            </Text>
            <ExternalLink size={16} color={colors.textSecondary} />
          </TouchableOpacity>

        </View>

        {/* Legal */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {t('about.legal', '法律信息')}
          </Text>
          
          <TouchableOpacity style={styles.legalItem} onPress={openPrivacyPolicy}>
            <Text style={[styles.legalText, { color: colors.primary }]}>
              {t('about.privacyPolicy', '隐私政策')}
            </Text>
            <ExternalLink size={16} color={colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.legalItem} onPress={openTermsOfService}>
            <Text style={[styles.legalText, { color: colors.primary }]}>
              {t('about.termsOfService', '服务条款')}
            </Text>
            <ExternalLink size={16} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Copyright */}
        <View style={styles.copyright}>
          <Text style={[styles.copyrightText, { color: colors.textSecondary }]}>
            © 2025 Speak to Translator
          </Text>
          <Text style={[styles.copyrightText, { color: colors.textSecondary }]}>
            {t('about.allRightsReserved', '保留所有权利')}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  appInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  appIcon: {
    width: 80,
    height: 80,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    backgroundColor: '#f0f0f0',
  },
  appLogo: {
    width: 60,
    height: 60,
  },
  appDetails: {
    flex: 1,
  },
  appName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  appVersion: {
    fontSize: 16,
    marginBottom: 4,
  },
  appSlogan: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
  },
  featuresList: {
    gap: 8,
  },
  featureItem: {
    fontSize: 16,
    lineHeight: 22,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  contactText: {
    flex: 1,
    fontSize: 16,
  },
  legalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  legalText: {
    fontSize: 16,
  },
  copyright: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 4,
  },
  copyrightText: {
    fontSize: 14,
  },
});
