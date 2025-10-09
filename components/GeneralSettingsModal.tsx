import AppLanguageSelector from '@/components/AppLanguageSelector';
import { getLanguageFullDisplayName } from '@/constants/languages';
import { useTheme } from '@/contexts/ThemeContext';
import { useI18n } from '@/contexts/I18nContext';
import {
  ArrowLeft,
  ChevronRight,
  Languages,
  Monitor,
  Moon,
  Settings as SettingsIcon,
  Sun,
  Volume2
} from 'lucide-react-native';
import React, { useState } from 'react';
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AutoPlaySettingsModal from './AutoPlaySettingsModal';

interface GeneralSettingsModalProps {
  visible: boolean;
  onClose: () => void;
  autoPlayVoiceTranslation: boolean;
  setAutoPlayVoiceTranslation: (value: boolean) => void;
  autoPlayTextTranslation: boolean;
  setAutoPlayTextTranslation: (value: boolean) => void;
}

const GeneralSettingsModal: React.FC<GeneralSettingsModalProps> = ({
  visible,
  onClose,
  autoPlayVoiceTranslation,
  setAutoPlayVoiceTranslation,
  autoPlayTextTranslation,
  setAutoPlayTextTranslation,
}) => {
  const { 
    theme, 
    setTheme, 
    colors,
  } = useTheme();
  const { t, currentLanguage, changeLanguage } = useI18n();
  const insets = useSafeAreaInsets();
  const [showAppLanguageSelector, setShowAppLanguageSelector] = useState(false);
  const [showAutoPlaySettings, setShowAutoPlaySettings] = useState(false);

  const showThemeSelector = () => {
    Alert.alert(
      t('settings.theme'),
      t('settings.selectTheme', '请选择您偏好的主题模式'),
      [
        {
          text: '🌞 ' + t('settings.lightMode', '浅色模式'),
          onPress: () => setTheme('light'),
        },
        {
          text: '🌙 ' + t('settings.darkMode', '深色模式'),
          onPress: () => setTheme('dark'),
        },
        {
          text: '⚙️ ' + t('settings.followSystem', '跟随系统'),
          onPress: () => setTheme('auto'),
        },
        {
          text: t('common.cancel'),
          style: 'cancel',
        },
      ]
    );
  };

  const getThemeIcon = () => {
    switch (theme) {
      case 'light':
        return <Sun size={20} color={colors.primary} />;
      case 'dark':
        return <Moon size={20} color={colors.primary} />;
      default:
        return <Monitor size={20} color={colors.primary} />;
    }
  };

  const getThemeText = () => {
    switch (theme) {
      case 'light':
        return t('settings.lightMode', '浅色模式');
      case 'dark':
        return t('settings.darkMode', '深色模式');
      default:
        return t('settings.followSystem', '跟随系统');
    }
  };

  const handleAppLanguageSelect = async (languageCode: string) => {
    await changeLanguage(languageCode as any);
    Alert.alert(
      t('settings.languageChanged', '语言已更改'), 
      `${t('settings.appLanguageSetTo', '应用语言已设置为')}：${getLanguageFullDisplayName(languageCode)}`
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

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border, paddingTop: insets.top + 16 }]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <ArrowLeft size={24} color={colors.primary} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <View style={[styles.headerIcon, { backgroundColor: colors.primary + '15' }]}>
              <SettingsIcon size={20} color={colors.primary} />
            </View>
            <Text style={[styles.headerTitle, { color: colors.text }]}>{t('settings.generalSettings', '通用设置')}</Text>
          </View>
          <View style={styles.headerPlaceholder} />
        </View>

        {/* Content */}
        <ScrollView 
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.settingCard, { backgroundColor: colors.surface }]}>
            <SettingItem
              icon={getThemeIcon()}
              title={t('settings.theme', '主题模式')}
              subtitle={`${t('settings.current', '当前')}: ${getThemeText()}`}
              onPress={showThemeSelector}
            />
            <SettingItem
              icon={<Languages />}
              title={t('settings.language', '应用语言')}
              subtitle={getLanguageFullDisplayName(currentLanguage)}
              onPress={() => setShowAppLanguageSelector(true)}
            />
            <SettingItem
              icon={<Volume2 />}
              title={t('settings.playbackSettings', '播放设置')}
              subtitle={
                // 如果两个都是默认状态（语音开启，文本关闭），显示"语音翻译"
                autoPlayVoiceTranslation && !autoPlayTextTranslation
                  ? t('settings.voiceTranslation', '语音翻译')
                  // 如果两个都关闭，显示"已关闭"
                  : !autoPlayVoiceTranslation && !autoPlayTextTranslation
                  ? t('settings.disabled', '已关闭')
                  // 其他情况显示具体状态
                  : autoPlayVoiceTranslation && autoPlayTextTranslation 
                  ? t('settings.voiceAndTextTranslation', '语音翻译 + 文本翻译')
                  : autoPlayVoiceTranslation 
                  ? t('settings.voiceTranslation', '语音翻译')
                  : t('settings.textTranslation', '文本翻译')
              }
              onPress={() => setShowAutoPlaySettings(true)}
              isLast={true}
            />
          </View>
        </ScrollView>

        {/* App Language Selector Modal */}
        <AppLanguageSelector
          visible={showAppLanguageSelector}
          onClose={() => setShowAppLanguageSelector(false)}
          currentLanguage={currentLanguage}
          onSelectLanguage={handleAppLanguageSelect}
        />

        {/* Auto Play Settings Modal */}
        <AutoPlaySettingsModal
          visible={showAutoPlaySettings}
          onClose={() => setShowAutoPlaySettings(false)}
          autoPlayVoiceTranslation={autoPlayVoiceTranslation}
          setAutoPlayVoiceTranslation={setAutoPlayVoiceTranslation}
          autoPlayTextTranslation={autoPlayTextTranslation}
          setAutoPlayTextTranslation={setAutoPlayTextTranslation}
        />
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 0.5,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  headerPlaceholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
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
});

export default GeneralSettingsModal;
