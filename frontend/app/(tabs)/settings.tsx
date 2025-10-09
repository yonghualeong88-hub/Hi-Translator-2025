import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { 
  Languages, 
  Volume2, 
  Globe, 
  Smartphone,
  Trash2,
  Info,
  ChevronRight,
  Settings as SettingsIcon,
  Sun,
  Moon,
  Monitor
} from 'lucide-react-native';
import { useTheme, Theme } from '@/contexts/ThemeContext';

export default function SettingsScreen() {
  const { theme, setTheme, colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [autoPlay, setAutoPlay] = useState(true);
  const [saveHistory, setSaveHistory] = useState(true);
  const [hapticFeedback, setHapticFeedback] = useState(true);
  const [highQualityAudio, setHighQualityAudio] = useState(false);

  const showThemeSelector = () => {
    Alert.alert(
      '选择主题',
      '请选择您偏好的主题模式',
      [
        {
          text: '浅色模式',
          onPress: () => setTheme('light'),
        },
        {
          text: '深色模式',
          onPress: () => setTheme('dark'),
        },
        {
          text: '跟随系统',
          onPress: () => setTheme('auto'),
        },
        {
          text: '取消',
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
        return '浅色模式';
      case 'dark':
        return '深色模式';
      default:
        return '跟随系统';
    }
  };

  const clearHistory = () => {
    Alert.alert(
      '清除历史记录',
      '确定要删除所有翻译历史记录吗？此操作无法撤销。',
      [
        {
          text: '取消',
          style: 'cancel',
        },
        {
          text: '删除',
          style: 'destructive',
          onPress: () => {
            // 这里实现清除历史记录的逻辑
            Alert.alert('已清除', '翻译历史记录已成功删除');
          },
        },
      ]
    );
  };

  const showAbout = () => {
    Alert.alert(
      '关于应用',
      '语音翻译 v1.0.0\n\n一个简单易用的多语言语音翻译应用，支持中文、英文、日文和韩文之间的实时翻译。\n\n© 2025 Voice Translator',
      [{ text: '确定', style: 'default' }]
    );
  };

  const SettingItem = ({ 
    icon, 
    title, 
    subtitle, 
    onPress, 
    rightComponent,
    showChevron = true 
  }: {
    icon: React.ReactNode;
    title: string;
    subtitle?: string;
    onPress?: () => void;
    rightComponent?: React.ReactNode;
    showChevron?: boolean;
  }) => (
    <TouchableOpacity 
      style={styles.settingItem} 
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.settingLeft}>
        <View style={styles.iconContainer}>
          {icon}
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.settingTitle}>{title}</Text>
          {subtitle && (
            <Text style={styles.settingSubtitle}>{subtitle}</Text>
          )}
        </View>
      </View>
      <View style={styles.settingRight}>
        {rightComponent}
        {showChevron && onPress && (
          <ChevronRight size={16} color="#C7C7CC" />
        )}
      </View>
    </TouchableOpacity>
  );

  const SectionHeader = ({ title }: { title: string }) => (
    <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>{title}</Text>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={[
        styles.scrollContent,
        { paddingBottom: Platform.OS === 'android' ? 100 + insets.bottom : 40 }
      ]}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.surface }]}>
          <View style={[styles.headerIcon, { backgroundColor: colors.primary + '20' }]}>
            <SettingsIcon size={32} color={colors.primary} />
          </View>
          <Text style={[styles.title, { color: colors.text }]}>设置</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>个性化您的翻译体验</Text>
        </View>

        {/* Appearance Settings */}
        <View style={styles.section}>
          <SectionHeader title="外观设置" />
          <View style={[styles.settingsGroup, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <SettingItem
              icon={getThemeIcon()}
              title="主题模式"
              subtitle={`当前: ${getThemeText()}`}
              onPress={showThemeSelector}
            />
          </View>
        </View>

        {/* Translation Settings */}
        <View style={styles.section}>
          <SectionHeader title="翻译设置" />
          <View style={[styles.settingsGroup, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <SettingItem
              icon={<Languages size={20} color={colors.primary} />}
              title="默认语言"
              subtitle="设置常用的源语言和目标语言"
              onPress={() => {
                Alert.alert('功能开发中', '语言设置功能即将推出');
              }}
            />
            <SettingItem
              icon={<Volume2 size={20} color={colors.primary} />}
              title="自动播放翻译"
              subtitle="翻译完成后自动朗读结果"
              rightComponent={
                <Switch
                  value={autoPlay}
                  onValueChange={setAutoPlay}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor={colors.surface}
                />
              }
              showChevron={false}
            />
            <SettingItem
              icon={<Globe size={20} color={colors.primary} />}
              title="翻译引擎"
              subtitle="选择翻译服务提供商"
              onPress={() => {
                Alert.alert('功能开发中', '翻译引擎选择功能即将推出');
              }}
            />
          </View>
        </View>

        {/* Audio Settings */}
        <View style={styles.section}>
          <SectionHeader title="音频设置" />
          <View style={[styles.settingsGroup, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <SettingItem
              icon={<Smartphone size={20} color={colors.primary} />}
              title="触觉反馈"
              subtitle="录音时提供震动反馈"
              rightComponent={
                <Switch
                  value={hapticFeedback}
                  onValueChange={setHapticFeedback}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor={colors.surface}
                />
              }
              showChevron={false}
            />
            <SettingItem
              icon={<Volume2 size={20} color={colors.primary} />}
              title="高质量音频"
              subtitle="启用更高质量的录音（耗电量增加）"
              rightComponent={
                <Switch
                  value={highQualityAudio}
                  onValueChange={setHighQualityAudio}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor={colors.surface}
                />
              }
              showChevron={false}
            />
          </View>
        </View>

        {/* Privacy & Data */}
        <View style={styles.section}>
          <SectionHeader title="隐私与数据" />
          <View style={[styles.settingsGroup, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <SettingItem
              icon={<Globe size={20} color={colors.primary} />}
              title="保存翻译历史"
              subtitle="在设备上保存翻译记录"
              rightComponent={
                <Switch
                  value={saveHistory}
                  onValueChange={setSaveHistory}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor={colors.surface}
                />
              }
              showChevron={false}
            />
            <SettingItem
              icon={<Trash2 size={20} color={colors.error} />}
              title="清除历史记录"
              subtitle="删除所有保存的翻译记录"
              onPress={clearHistory}
            />
          </View>
        </View>

        {/* About */}
        <View style={styles.section}>
          <SectionHeader title="关于" />
          <View style={[styles.settingsGroup, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <SettingItem
              icon={<Info size={20} color={colors.primary} />}
              title="关于应用"
              subtitle="版本信息和开发团队"
              onPress={showAbout}
            />
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.textSecondary }]}>语音翻译 v1.0.0</Text>
          <Text style={[styles.footerSubtext, { color: colors.textSecondary }]}>让沟通无界限</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 30,
    paddingHorizontal: 20,
  },
  headerIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
  },
  section: {
    marginTop: 32,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginLeft: 20,
  },
  settingsGroup: {
    borderTopWidth: 0.5,
    borderBottomWidth: 0.5,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 0.5,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '400',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 12,
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  footerText: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  footerSubtext: {
    fontSize: 12,
  },
});