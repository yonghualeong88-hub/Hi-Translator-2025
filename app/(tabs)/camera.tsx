import GoogleLensCamera from '@/components/GoogleLensCamera/GoogleLensCamera';
import LanguagePicker from '@/components/LanguagePicker';
import { useI18n } from '@/contexts/I18nContext';
import { SUPPORTED_LANGUAGES, type Language } from '@/constants/languages';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function CameraScreen() {
  const { t } = useI18n();
  const [targetLanguage, setTargetLanguage] = useState('zh-CN');
  const [showLanguagePicker, setShowLanguagePicker] = useState(false);
  const [isOfflineMode, setIsOfflineMode] = useState(false);

  // 监听翻译模式状态
  useEffect(() => {
    const checkTranslationMode = async () => {
      try {
        const { translationModeManager } = await import('@/services/translationModeManager');
        const state = translationModeManager.getCurrentState();
        setIsOfflineMode(state.actualMode === 'offline');
        
        // 监听状态变化
        const listener = (newState: any) => {
          setIsOfflineMode(newState.actualMode === 'offline');
        };
        
        translationModeManager.addListener(listener);
        
        // 清理监听器
        return () => {
          translationModeManager.removeListener(listener);
        };
      } catch (error) {
        console.warn('⚠️ 检查翻译模式失败:', error);
      }
    };

    checkTranslationMode();
  }, []);

  const getCurrentLanguageName = (code: string) => {
    const language = SUPPORTED_LANGUAGES.find(lang => lang.code === code);
    return language ? language.name : code;
  };


  return (
    <SafeAreaView style={styles.container}>
      {/* 离线模式提示 */}
      {isOfflineMode && (
        <View style={styles.offlineIndicator}>
          <Text style={styles.offlineText}>📱 {t('voice.offlineMode', '离线模式')}</Text>
        </View>
      )}
      
      {/* Google Lens 风格相机 */}
      <GoogleLensCamera targetLanguage={targetLanguage} />
      
      {/* 语言选择器 - 修复版本 */}
      <LanguagePicker
        visible={showLanguagePicker}
        onClose={() => setShowLanguagePicker(false)}
        onSelectLanguage={(language: Language) => {
          setTargetLanguage(language.code);
          setShowLanguagePicker(false);
        }}
        title={t('language.selectTarget', '选择翻译语言')}
        isOfflineMode={isOfflineMode} // ✅ 传入离线模式状态
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  offlineIndicator: {
    position: 'absolute',
    top: 60,
    left: 10,
    right: 10,
    backgroundColor: '#D97706', // 更柔和的琥珀色
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    zIndex: 1000,
    alignItems: 'center',
  },
  offlineText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
});