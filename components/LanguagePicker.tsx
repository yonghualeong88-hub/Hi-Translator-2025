import { useState, useEffect } from 'react';
import {
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    getAllLanguages,
    getLanguageFullDisplayName,
    getRecommendedLanguages,
    type Language,
} from '../constants/languages';
import { useTheme } from '../contexts/ThemeContext';
import { router } from 'expo-router';

interface LanguagePickerProps {
  visible: boolean;
  onClose: () => void;
  onSelectLanguage: (language: Language) => void;
  title?: string;
  showAutoDetect?: boolean;
  isOfflineMode?: boolean; // ✅ 新增：是否离线模式
}

function LanguagePicker({
  visible,
  onClose,
  onSelectLanguage,
  title = '选择您的语言',
  showAutoDetect = false,
  isOfflineMode = false, // ✅ 默认不是离线模式
}: LanguagePickerProps) {
  const { colors } = useTheme();
  const [showAllLanguages, setShowAllLanguages] = useState(false);
  const [downloadedPacks, setDownloadedPacks] = useState<string[]>([]);
  
  const recommendedLanguages = getRecommendedLanguages();
  const allLanguages = getAllLanguages();

  // ✅ 加载已下载的语言包状态
  useEffect(() => {
    if (visible && isOfflineMode) {
      loadDownloadedPacks();
    }
  }, [visible, isOfflineMode]);

  const loadDownloadedPacks = async () => {
    try {
      const { translationModeManager } = await import('../services/translationModeManager');
      const packs = translationModeManager.getDownloadedLanguagePacks();
      setDownloadedPacks(packs);
    } catch (error) {
      console.error('加载语言包状态失败:', error);
    }
  };

  // ✅ 检查语言包是否已下载
  const isLanguageDownloaded = (langCode: string): boolean => {
    if (!isOfflineMode) return true; // 在线模式下所有语言都可用
    if (langCode === 'auto') return false; // auto 不支持离线
    
    // 检查是否已下载（支持新旧格式）
    const { mapToMlKitLangCode } = require('../utils/mlKitLanguageMapper');
    const mlKitCode = mapToMlKitLangCode(langCode);
    
    return downloadedPacks.includes(mlKitCode) || downloadedPacks.includes(langCode);
  };

  const handleLanguageSelect = (language: Language) => {
    // ✅ 离线模式下检查语言包
    if (isOfflineMode && !isLanguageDownloaded(language.code) && language.code !== 'auto') {
      Alert.alert(
        '语言包未下载',
        `离线模式下无法使用 ${language.nativeName}。\n\n请在有网络时前往设置下载对应的语言包。`,
        [
          {
            text: '知道了',
            style: 'default',
          },
        ]
      );
      return;
    }
    
    onSelectLanguage(language);
    onClose();
  };

  const handleAutoDetectSelect = () => {
    const autoDetectLanguage: Language = {
      code: 'auto',
      name: 'Auto Detect',
      nativeName: 'Auto Detect',
      flag: '🌐'
    };
    onSelectLanguage(autoDetectLanguage);
    onClose();
  };

  const displayLanguages = showAllLanguages ? allLanguages : recommendedLanguages;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        {/* 头部 */}
        <View style={[styles.header, { borderBottomColor: colors.surface }]}>
          <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
          <TouchableOpacity
            style={[styles.closeButton, { backgroundColor: colors.surface }]}
            onPress={onClose}
          >
            <Text style={[styles.closeButtonText, { color: colors.text }]}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* 内容 */}
        <ScrollView style={styles.content}>
          {/* 自动检测选项 */}
          {showAutoDetect && (
            <View style={styles.section}>
              <TouchableOpacity
                style={[styles.autoDetectItem, { backgroundColor: colors.surface }]}
                onPress={handleAutoDetectSelect}
              >
                <View style={styles.autoDetectContent}>
                  <Text style={styles.autoDetectIcon}>🌐</Text>
                  <Text style={[styles.autoDetectText, { color: colors.text }]}>
                    Auto Detect
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          )}

          {/* 推荐语言 */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {showAllLanguages ? '所有语言' : '推荐语言'}
            </Text>
            {displayLanguages.map((language) => {
              const isDownloaded = isLanguageDownloaded(language.code);
              const showBadge = isOfflineMode && language.code !== 'auto';
              
              return (
                <TouchableOpacity
                  key={language.code}
                  style={[
                    styles.languageItem, 
                    { backgroundColor: colors.surface },
                    !isDownloaded && isOfflineMode && styles.languageItemDisabled,
                  ]}
                  onPress={() => handleLanguageSelect(language)}
                >
                  <View style={styles.languageItemContent}>
                    <Text 
                      style={[
                        styles.languageText, 
                        { color: isDownloaded || !isOfflineMode ? colors.text : colors.textSecondary }
                      ]} 
                      numberOfLines={1}
                    >
                      {getLanguageFullDisplayName(language.code)}
                    </Text>
                    {showBadge && (
                      <View style={[
                        styles.statusBadge,
                        { backgroundColor: isDownloaded ? '#10B981' : '#6B7280' }
                      ]}>
                        <Text style={styles.statusBadgeText}>
                          {isDownloaded ? '✓' : '⬇'}
                        </Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* 显示更多/更少按钮 */}
          {!showAllLanguages && allLanguages.length > recommendedLanguages.length && (
            <TouchableOpacity
              style={[styles.showAllButton, { borderBottomColor: colors.surface }]}
              onPress={() => setShowAllLanguages(true)}
            >
              <Text style={[styles.showAllButtonText, { color: colors.text }]}>
                显示所有语言
              </Text>
              <Text style={[styles.showAllButtonArrow, { color: colors.text }]}>›</Text>
            </TouchableOpacity>
          )}

          {showAllLanguages && (
            <TouchableOpacity
              style={[styles.backButton, { borderBottomColor: colors.surface }]}
              onPress={() => setShowAllLanguages(false)}
            >
              <Text style={[styles.backButtonText, { color: colors.text }]}>
                ← 返回推荐语言
              </Text>
            </TouchableOpacity>
          )}
        </ScrollView>
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
    paddingTop: 40,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  content: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  languageItem: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginBottom: 8,
  },
  languageItemDisabled: {
    opacity: 0.5,
  },
  languageItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  languageText: {
    fontSize: 16,
    flex: 1,
  },
  statusBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  statusBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  showAllButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginTop: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  showAllButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  showAllButtonArrow: {
    fontSize: 18,
    fontWeight: '300',
  },
  backButton: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  autoDetectItem: {
    // 背景色将在组件中动态设置
  },
  autoDetectContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  autoDetectIcon: {
    marginRight: 8,
  },
  autoDetectText: {
    fontWeight: '600',
  },
});

export default LanguagePicker;