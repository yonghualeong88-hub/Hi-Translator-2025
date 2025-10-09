import { useTheme } from '@/contexts/ThemeContext';
import { useI18n } from '@/contexts/I18nContext';
import { router } from 'expo-router';
import {
    ArrowLeft,
    ChevronRight,
    Download,
    Heart,
    Info,
    Settings as SettingsIcon,
    Share2,
    Star,
    Zap
} from 'lucide-react-native';
import React, { useState } from 'react';
import {
    Alert,
    Dimensions,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import GeneralSettingsModal from '../components/GeneralSettingsModal';

const { width } = Dimensions.get('window');

export default function SettingsScreen() {
  const { 
    colors,
    autoPlayVoiceTranslation,
    setAutoPlayVoiceTranslation,
    autoPlayTextTranslation,
    setAutoPlayTextTranslation,
  } = useTheme();
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  const [showGeneralSettings, setShowGeneralSettings] = useState(false);


  const showAbout = () => {
    Alert.alert(
      t('settings.aboutApp', '关于应用'),
      t('settings.aboutDescription', '语音翻译 v1.0.0\n\n一个简单易用的多语言语音翻译应用，支持中文、英文、日文和韩文之间的实时翻译。\n\n© 2025 Voice Translator'),
      [{ text: t('common.confirm', '确定'), style: 'default' }]
    );
  };

  const SettingItem = ({ 
    icon, 
    title, 
    subtitle, 
    onPress, 
    rightComponent,
    showChevron = true,
    iconColor = colors.primary,
    isLast = false
  }: {
    icon: React.ReactNode;
    title: string;
    subtitle?: string;
    onPress?: () => void;
    rightComponent?: React.ReactNode;
    showChevron?: boolean;
    iconColor?: string;
    isLast?: boolean;
  }) => (
    <TouchableOpacity 
      style={[
        styles.settingItem,
        isLast && styles.lastSettingItem
      ]} 
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={0.7}
    >
      <View style={styles.settingLeft}>
        <View style={[styles.iconContainer, { backgroundColor: iconColor + '15' }]}>
          {React.cloneElement(icon as React.ReactElement, { color: iconColor, size: 20 } as any)}
        </View>
        <View style={styles.textContainer}>
          <Text style={[styles.settingTitle, { color: colors.text }]}>{title}</Text>
          {subtitle && (
            <Text style={[styles.settingSubtitle, { color: colors.textSecondary }]}>{subtitle}</Text>
          )}
        </View>
      </View>
      <View style={styles.settingRight}>
        {rightComponent}
        {showChevron && onPress && (
          <ChevronRight size={18} color={colors.textSecondary} />
        )}
      </View>
    </TouchableOpacity>
  );

  const SettingCard = ({ 
    children, 
    title,
    icon,
    gradient = false 
  }: { 
    children: React.ReactNode;
    title?: string;
    icon?: React.ReactNode;
    gradient?: boolean;
  }) => (
    <View style={[styles.settingCard, { backgroundColor: colors.surface }]}>
      {(title || icon) && (
        <View style={styles.cardHeader}>
          {icon && (
            <View style={[styles.cardIcon, { backgroundColor: colors.primary + '15' }]}>
              {icon}
            </View>
          )}
          {title && (
            <Text style={[styles.cardTitle, { color: colors.text }]}>{title}</Text>
          )}
        </View>
      )}
      {children}
    </View>
  );

  const QuickAction = ({ 
    icon, 
    title, 
    onPress,
    color = colors.primary 
  }: { 
    icon: React.ReactNode;
    title: string;
    onPress: () => void;
    color?: string;
  }) => (
    <TouchableOpacity 
      style={[styles.quickAction, { backgroundColor: color + '10' }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.quickActionIcon, { backgroundColor: color + '20' }]}>
        {React.cloneElement(icon as React.ReactElement, { color, size: 24 } as any)}
      </View>
      <Text style={[styles.quickActionText, { color }]}>{title}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView 
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Platform.OS === 'android' ? 100 + insets.bottom : 40 }
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Simple Header */}
        <View style={[styles.header, { backgroundColor: colors.surface }]}>
          <View style={styles.headerRow}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <ArrowLeft size={24} color={colors.textSecondary} />
            </TouchableOpacity>
            <Text style={[styles.title, { color: colors.text }]}>{t('settings.title', '设置')}</Text>
            <View style={styles.placeholder} />
          </View>
        </View>


        {/* General Settings */}
        <View style={styles.section}>
          <SettingCard>
            <SettingItem
              icon={<SettingsIcon />}
              title={t('settings.generalSettings', '通用设置')}
              subtitle={t('settings.generalSettingsSubtitle', '主题、语言、播放等设置')}
              onPress={() => setShowGeneralSettings(true)}
            />
            <SettingItem
              icon={<Download />}
              title={t('settings.languagePacks', '语言包管理')}
              subtitle={t('settings.languagePacksSubtitle', '下载和管理离线翻译语言包')}
              onPress={() => router.push('/language-packs')}
              isLast={true}
            />
          </SettingCard>
        </View>


        {/* About & Support */}
        <View style={styles.section}>
          <SettingCard icon={<Info size={20} color={colors.primary} />} title={t('settings.aboutSupport', '关于与支持')}>
            <SettingItem
              icon={<Info />}
              title={t('settings.aboutApp', '关于应用')}
              subtitle={t('settings.aboutAppSubtitle', '版本信息和开发团队')}
              onPress={showAbout}
            />
            <SettingItem
              icon={<Star />}
              title={t('settings.rateApp', '评价应用')}
              subtitle={t('settings.rateAppSubtitle', '在应用商店为我们评分')}
              onPress={() => Alert.alert(t('settings.thankYou', '感谢支持'), t('settings.rateAppMessage', '请到应用商店为我们评分！'))}
            />
            <SettingItem
              icon={<Share2 />}
              title={t('settings.shareApp', '分享应用')}
              subtitle={t('settings.shareAppSubtitle', '将应用推荐给朋友')}
              onPress={() => Alert.alert(t('settings.share', '分享'), t('settings.shareMessage', '将应用分享给朋友'))}
            />
            <SettingItem
              icon={<Heart />}
              title={t('settings.supportUs', '支持我们')}
              subtitle={t('settings.supportUsSubtitle', '您的支持是我们前进的动力')}
              onPress={() => Alert.alert(t('settings.thankYou', '感谢'), t('settings.supportMessage', '您的支持是我们前进的动力！'))}
            />
            <SettingItem
              icon={<Zap />}
              title={t('settings.performance', '性能优化')}
              subtitle={t('settings.performanceSubtitle', '清理缓存和优化性能')}
              onPress={() => Alert.alert(t('settings.optimizationComplete', '优化完成'), t('settings.optimizationMessage', '缓存已清理，性能已优化'))}
              isLast={true}
            />
          </SettingCard>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.footerContent}>
            <Text style={[styles.footerText, { color: colors.textSecondary }]}>{t('settings.appVersion', '语音翻译 v1.0.0')}</Text>
            <Text style={[styles.footerSubtext, { color: colors.textSecondary }]}>{t('settings.appSlogan', '让沟通无界限')}</Text>
          </View>
        </View>
      </ScrollView>

      {/* General Settings Modal */}
        <GeneralSettingsModal
          visible={showGeneralSettings}
          onClose={() => setShowGeneralSettings(false)}
          autoPlayVoiceTranslation={autoPlayVoiceTranslation}
          setAutoPlayVoiceTranslation={setAutoPlayVoiceTranslation}
          autoPlayTextTranslation={autoPlayTextTranslation}
          setAutoPlayTextTranslation={setAutoPlayTextTranslation}
        />

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 150,
  },
  header: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  placeholder: {
    width: 40, // 占位符，保持标题居中
  },
  quickActionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    paddingVertical: 20,
    marginTop: -10,
  },
  quickAction: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    marginHorizontal: 4,
  },
  quickActionIcon: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  settingCard: {
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  cardIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  lastSettingItem: {
    borderBottomWidth: 0,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 13,
    lineHeight: 18,
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  footerContent: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 30,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
  },
  footerText: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  footerSubtext: {
    fontSize: 12,
    fontStyle: 'italic',
  },
});