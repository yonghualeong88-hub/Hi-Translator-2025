import { useTheme } from '@/contexts/ThemeContext';
import { useI18n } from '@/contexts/I18nContext';
import { ArrowLeft, Info, Languages, Volume2 } from 'lucide-react-native';
import React from 'react';
import {
  Alert,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface AutoPlaySettingsModalProps {
  visible: boolean;
  onClose: () => void;
  autoPlayVoiceTranslation: boolean;
  setAutoPlayVoiceTranslation: (enabled: boolean) => void;
  autoPlayTextTranslation: boolean;
  setAutoPlayTextTranslation: (enabled: boolean) => void;
}

export default function AutoPlaySettingsModal({
  visible,
  onClose,
  autoPlayVoiceTranslation,
  setAutoPlayVoiceTranslation,
  autoPlayTextTranslation,
  setAutoPlayTextTranslation,
}: AutoPlaySettingsModalProps) {
  const { colors } = useTheme();
  const { t } = useI18n();

  const showInfo = () => {
    Alert.alert(
      t('autoPlay.infoTitle', '自动播放说明'),
      t('autoPlay.infoMessage', '• 自动播放语音翻译：语音翻译完成后自动播放翻译结果\n• 自动播放文本翻译：文本翻译完成后自动朗读翻译结果\n• 两个功能可以独立开启或关闭'),
      [{ text: t('common.gotIt', '知道了'), style: 'default' }]
    );
  };

  // Custom Switch Component
  const CustomSwitch = ({ value, onValueChange, title, description, icon }: {
    value: boolean;
    onValueChange: (newValue: boolean) => void;
    title: string;
    description: string;
    icon: React.ReactNode;
  }) => (
    <View style={[styles.settingCard, { backgroundColor: colors.surface }]}>
      <View style={styles.settingHeader}>
        <View style={[styles.iconContainer, { backgroundColor: colors.primary + '15' }]}>
          {React.cloneElement(icon as React.ReactElement, { color: colors.primary, size: 24 } as any)}
        </View>
        <View style={styles.settingInfo}>
          <Text style={[styles.settingTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
            {description}
          </Text>
        </View>
        <TouchableOpacity
          style={[
            styles.toggleButton,
            { 
              backgroundColor: value ? colors.primary : colors.border,
            }
          ]}
          onPress={() => onValueChange(!value)}
          activeOpacity={0.7}
        >
          <View style={[
            styles.toggleThumb,
            { 
              backgroundColor: colors.surface,
              transform: [{ translateX: value ? 20 : 2 }]
            }
          ]} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
      statusBarTranslucent={false}
    >
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'left', 'right', 'bottom']}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={onClose} style={styles.backButton}>
            <ArrowLeft size={24} color={colors.primary} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>{t('autoPlay.title', '自动播放设置')}</Text>
          <TouchableOpacity onPress={showInfo} style={styles.infoButton}>
            <Info size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View style={styles.content}>
          <CustomSwitch
            title={t('autoPlay.voiceTitle', '自动播放语音翻译')}
            description={t('autoPlay.voiceDescription', '语音翻译完成后自动播放翻译结果')}
            icon={<Volume2 />}
            value={autoPlayVoiceTranslation}
            onValueChange={setAutoPlayVoiceTranslation}
          />

          <CustomSwitch
            title={t('autoPlay.textTitle', '自动播放文本翻译')}
            description={t('autoPlay.textDescription', '文本翻译完成后自动朗读翻译结果')}
            icon={<Languages />}
            value={autoPlayTextTranslation}
            onValueChange={setAutoPlayTextTranslation}
          />


          {/* Status Info */}
          <View style={[styles.statusCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.statusTitle, { color: colors.text }]}>{t('autoPlay.currentStatus', '当前状态')}</Text>
            <Text style={[styles.statusText, { color: colors.textSecondary }]}>
              {autoPlayVoiceTranslation && autoPlayTextTranslation 
                ? t('autoPlay.statusBoth', '将播放语音翻译和文本翻译结果')
                : autoPlayVoiceTranslation 
                ? t('autoPlay.statusVoiceOnly', '将播放语音翻译结果')
                : autoPlayTextTranslation 
                ? t('autoPlay.statusTextOnly', '将朗读文本翻译结果')
                : t('autoPlay.statusOff', '自动播放已关闭')
              }
            </Text>
          </View>
        </View>
      </SafeAreaView>

    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: Platform.OS === 'android' ? 40 : 16,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginHorizontal: 8,
  },
  infoButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  settingCard: {
    borderRadius: 12,
    marginBottom: 15,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  settingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  settingInfo: {
    flex: 1,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  textContainer: {
    flex: 1,
    marginLeft: 12,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
  },
  settingDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
  toggleButton: {
    width: 50,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleThumb: {
    width: 26,
    height: 26,
    borderRadius: 13,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
    elevation: 1,
  },
  statusCard: {
    borderRadius: 12,
    padding: 15,
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
  },
  statusText: {
    fontSize: 14,
    lineHeight: 20,
  },
});
