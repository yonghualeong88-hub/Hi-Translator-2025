import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Check } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useI18n } from '@/contexts/I18nContext';
import { LANGUAGE_DISPLAY_NAMES } from '@/config/languageMap';

interface AppLanguageSelectorProps {
  visible: boolean;
  onClose: () => void;
  currentLanguage: string;
  onSelectLanguage: (languageCode: string) => void;
}

export default function AppLanguageSelector({
  visible,
  onClose,
  currentLanguage,
  onSelectLanguage,
}: AppLanguageSelectorProps) {
  const { colors } = useTheme();
  const { t } = useI18n();

  const handleLanguageSelect = (languageCode: string) => {
    onSelectLanguage(languageCode);
    onClose();
  };

  const renderLanguageItem = (languageCode: string) => {
    const isSelected = languageCode === currentLanguage;
    const displayName = LANGUAGE_DISPLAY_NAMES[languageCode as keyof typeof LANGUAGE_DISPLAY_NAMES];
    
    return (
      <TouchableOpacity
        key={languageCode}
        style={[
          styles.languageItem,
          { 
            backgroundColor: colors.surface,
            borderBottomColor: colors.border,
          }
        ]}
        onPress={() => handleLanguageSelect(languageCode)}
      >
        <View style={styles.languageContent}>
          <Text style={[styles.languageText, { color: colors.text }]}>
            {displayName}
          </Text>
          {isSelected && (
            <Check size={20} color={colors.primary} />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
    >
      <SafeAreaView 
        style={[styles.container, { backgroundColor: colors.background }]}
        edges={['top', 'left', 'right', 'bottom']}
      >
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={onClose}
          >
            <ArrowLeft size={24} color={colors.primary} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>{t('settings.selectAppLanguage', '选择应用语言')}</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Language List */}
        <ScrollView 
          style={styles.languageList}
          showsVerticalScrollIndicator={false}
        >
          {Object.keys(LANGUAGE_DISPLAY_NAMES).map(renderLanguageItem)}
        </ScrollView>

        {/* Footer Info */}
        <View style={[styles.footer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
          <Text style={[styles.footerText, { color: colors.textSecondary }]}>
            {t('settings.selectAppInterfaceLanguage', '选择应用界面显示语言')}
          </Text>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
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
  },
  placeholder: {
    width: 40,
  },
  languageList: {
    flex: 1,
  },
  languageItem: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 0.5,
  },
  languageContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  languageText: {
    fontSize: 16,
    fontWeight: '500',
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderTopWidth: 0.5,
  },
  footerText: {
    fontSize: 14,
    textAlign: 'center',
  },
});
