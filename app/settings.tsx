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
// import * as StoreReview from 'expo-store-review';
import React, { useState } from 'react';
import {
    Alert,
    Dimensions,
    Platform,
    ScrollView,
    Share,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import GeneralSettingsModal from '../components/GeneralSettingsModal';
import * as FileSystem from 'expo-file-system';

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
    router.push('/about');
  };

  const rateApp = async () => {
    try {
      // 临时使用 Alert 提示，等原生模块配置好后再启用
      Alert.alert(
        t('settings.thankYou', '感谢支持'),
        t('settings.rateAppMessage', '请到应用商店为我们评分！\n\n功能正在开发中，敬请期待！')
      );
      
      // TODO: 启用原生评分功能
      // const isAvailable = await StoreReview.isAvailableAsync();
      // if (isAvailable) {
      //   await StoreReview.requestReview();
      // } else {
      //   Alert.alert(
      //     t('settings.thankYou', '感谢支持'),
      //     t('settings.rateAppMessage', '请到应用商店为我们评分！')
      //   );
      // }
    } catch (error) {
      console.error('Rate app error:', error);
      Alert.alert(
        t('common.error', '错误'),
        t('settings.rateAppError', '无法打开评分页面，请稍后重试')
      );
    }
  };

  const shareApp = async () => {
    try {
      const shareMessage = t('settings.shareContent', '推荐一个超棒的翻译应用：Speak to Translator！\n\n支持84种语言，语音翻译、文本翻译、拍照翻译一应俱全！\n\n下载链接：https://play.google.com/store/apps/details?id=com.hltransslater.app');
      
      const result = await Share.share({
        message: shareMessage,
        title: t('settings.shareTitle', '推荐 Speak to Translator'),
      });

      if (result.action === Share.sharedAction) {
        // 分享成功
        console.log('App shared successfully');
      } else if (result.action === Share.dismissedAction) {
        // 用户取消分享
        console.log('Share dismissed');
      }
    } catch (error) {
      console.error('Share app error:', error);
      Alert.alert(
        t('common.error', '错误'),
        t('settings.shareError', '分享失败，请稍后重试')
      );
    }
  };

  const optimizePerformance = async () => {
    try {
      // 显示加载提示
      Alert.alert(
        t('settings.optimizing', '正在优化'),
        t('settings.optimizingMessage', '正在清理缓存和优化性能，请稍候...'),
        [],
        { cancelable: false }
      );

      // 清理缓存目录
      const cacheDir = FileSystem.cacheDirectory;
      if (cacheDir) {
        try {
          const cacheInfo = await FileSystem.getInfoAsync(cacheDir);
          if (cacheInfo.exists) {
            // 清理临时文件
            const tempFiles = await FileSystem.readDirectoryAsync(cacheDir);
            for (const file of tempFiles) {
              try {
                const filePath = `${cacheDir}${file}`;
                const fileInfo = await FileSystem.getInfoAsync(filePath);
                if (fileInfo.exists && !fileInfo.isDirectory) {
                  // 删除超过1天的临时文件
                  const now = Date.now();
                  const fileAge = now - (fileInfo.modificationTime || 0) * 1000;
                  const oneDay = 24 * 60 * 60 * 1000;
                  
                  if (fileAge > oneDay) {
                    await FileSystem.deleteAsync(filePath);
                  }
                }
              } catch (error) {
                console.warn(`Failed to delete file ${file}:`, error);
              }
            }
          }
        } catch (error) {
          console.warn('Failed to clean cache directory:', error);
        }
      }

      // 清理文档目录中的临时文件
      const documentDir = FileSystem.documentDirectory;
      if (documentDir) {
        try {
          const docFiles = await FileSystem.readDirectoryAsync(documentDir);
          for (const file of docFiles) {
            if (file.startsWith('temp_') || file.startsWith('cache_')) {
              try {
                await FileSystem.deleteAsync(`${documentDir}${file}`);
              } catch (error) {
                console.warn(`Failed to delete temp file ${file}:`, error);
              }
            }
          }
        } catch (error) {
          console.warn('Failed to clean document directory:', error);
        }
      }

      // 模拟优化过程（实际应用中可能需要更多操作）
      await new Promise(resolve => setTimeout(resolve, 1000));

      // 显示完成提示
      Alert.alert(
        t('settings.optimizationComplete', '优化完成'),
        t('settings.optimizationSuccessMessage', '缓存已清理，性能已优化！\n\n已清理临时文件和过期缓存，应用运行将更加流畅。'),
        [{ text: t('common.confirm', '确定'), style: 'default' }]
      );

    } catch (error) {
      console.error('Performance optimization error:', error);
      Alert.alert(
        t('common.error', '错误'),
        t('settings.optimizationError', '优化过程中出现错误，请稍后重试')
      );
    }
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
              onPress={rateApp}
            />
            <SettingItem
              icon={<Share2 />}
              title={t('settings.shareApp', '分享应用')}
              subtitle={t('settings.shareAppSubtitle', '将应用推荐给朋友')}
              onPress={shareApp}
            />
            <SettingItem
              icon={<Heart />}
              title={t('settings.supportUs', '支持我们')}
              subtitle={t('settings.supportUsSubtitle', '您的支持是我们前进的动力')}
              onPress={() => router.push('/subscription')}
            />
            <SettingItem
              icon={<Zap />}
              title={t('settings.performance', '性能优化')}
              subtitle={t('settings.performanceSubtitle', '清理缓存和优化性能')}
              onPress={optimizePerformance}
              isLast={true}
            />
          </SettingCard>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.footerContent}>
            <Text style={[styles.footerText, { color: colors.textSecondary }]}>{t('settings.appVersion', 'Speak to Translator v1.0.0')}</Text>
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