import { useTheme } from '@/contexts/ThemeContext';
import { ArrowUpDown, Copy, Send, Volume2 } from 'lucide-react-native';
import { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { translateText } from '../../services/translationService';

export default function TextTranslateScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [inputText, setInputText] = useState('');
  const [originalText, setOriginalText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [fromLanguage, setFromLanguage] = useState('zh-CN');
  const [toLanguage, setToLanguage] = useState('en');
  const [isSpeaking, setIsSpeaking] = useState(false);

  const performTranslation = async (text: string) => {
    if (!text.trim()) return;
    
    setIsTranslating(true);
    
    try {
      // 调用真实的翻译API
      const result = await translateText(text, fromLanguage, toLanguage);
      setTranslatedText(result.translatedText);
    } catch (error) {
      console.error('翻译失败:', error);
      
      // 显示错误信息
      const errorMessage = error instanceof Error ? error.message : '翻译失败，请检查网络连接';
      Alert.alert('翻译错误', errorMessage);
      
      setTranslatedText('翻译失败，请重试');
    } finally {
      setIsTranslating(false);
    }
  };

  const translateInputText = () => {
    if (!inputText.trim()) {
      Alert.alert('提示', '请输入要翻译的文本');
      return;
    }
    
    setOriginalText(inputText.trim());
    setTranslatedText(''); // Clear previous translation
    performTranslation(inputText.trim());
    setInputText(''); // Clear input after translation
  };

  const playTranslation = () => {
    if (!translatedText || isSpeaking) return;
    
    setIsSpeaking(true);
    const languageMap: Record<string, string> = {
      'zh-CN': 'zh-Hans',
      'en': 'en',
      'ja': 'ja',
      'ko': 'ko'
    };

    // 这里需要导入 expo-speech
    // Speech.speak(translatedText, {
    //   language: languageMap[toLanguage] || 'en',
    //   onDone: () => setIsSpeaking(false),
    //   onError: () => setIsSpeaking(false),
    // });
    
    // 临时模拟语音播放
    setTimeout(() => setIsSpeaking(false), 2000);
  };

  const swapLanguages = () => {
    const temp = fromLanguage;
    setFromLanguage(toLanguage);
    setToLanguage(temp);
    
    if (inputText) {
      setTranslatedText(inputText);
      setInputText(translatedText);
    }
  };

  const getLanguageName = (code: string) => {
    const names: Record<string, string> = {
      'zh-CN': '中文',
      'en': 'English',
      'ja': '日本語',
      'ko': '한국어'
    };
    return names[code] || code;
  };

  const copyToClipboard = (text: string) => {
    // 这里需要导入 Clipboard API
    Alert.alert('已复制', '文本已复制到剪贴板');
  };

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { backgroundColor: colors.background }]} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <ScrollView contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Platform.OS === 'android' ? 100 + insets.bottom : 20 }
        ]}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>文本翻译</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              输入文本进行快速翻译
            </Text>
          </View>

          {/* Language Selector */}
          <View style={styles.languageContainer}>
            <View style={[styles.languageBox, { backgroundColor: colors.card }]}>
              <Text style={[styles.languageLabel, { color: colors.textSecondary }]}>源语言</Text>
              <Text style={[styles.languageText, { color: colors.text }]}>{getLanguageName(fromLanguage)}</Text>
            </View>
            
            <TouchableOpacity 
              style={styles.swapButton}
              onPress={swapLanguages}
            >
              <ArrowUpDown size={24} color={colors.primary} />
            </TouchableOpacity>
            
            <View style={[styles.languageBox, { backgroundColor: colors.card }]}>
              <Text style={[styles.languageLabel, { color: colors.textSecondary }]}>目标语言</Text>
              <Text style={[styles.languageText, { color: colors.text }]}>{getLanguageName(toLanguage)}</Text>
            </View>
          </View>

          {/* Input Section */}
          <View style={styles.inputSection}>
            <View style={[styles.inputContainer, { backgroundColor: colors.card }]}>
              <TextInput
                style={[styles.textInput, { color: colors.text }]}
                placeholder="请输入要翻译的文本..."
                placeholderTextColor={colors.textSecondary}
                value={inputText}
                onChangeText={setInputText}
                multiline
                maxLength={1000}
                textAlignVertical="top"
              />
              <View style={styles.inputFooter}>
                <Text style={[styles.charCount, { color: colors.textSecondary }]}>
                  {inputText.length}/1000
                </Text>
                <TouchableOpacity
                  style={[
                    styles.translateButton,
                    { backgroundColor: colors.primary },
                    !inputText.trim() && { backgroundColor: colors.textSecondary }
                  ]}
                  onPress={translateInputText}
                  disabled={!inputText.trim() || isTranslating}
                >
                  {isTranslating ? (
                    <ActivityIndicator size="small" color={colors.primaryText} />
                  ) : (
                    <Send size={20} color={colors.primaryText} />
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Translation Results */}
          {translatedText && (
            <View style={styles.resultsContainer}>
              <View style={[styles.textCard, { backgroundColor: colors.card }]}>
                <View style={styles.cardHeader}>
                  <Text style={[styles.cardTitle, { color: colors.primary }]}>翻译结果</Text>
                  <View style={styles.cardActions}>
                    <TouchableOpacity 
                      style={styles.iconButton}
                      onPress={playTranslation}
                      disabled={isSpeaking}
                    >
                      {isSpeaking ? (
                        <ActivityIndicator size="small" color={colors.primary} />
                      ) : (
                        <Volume2 size={16} color={colors.textSecondary} />
                      )}
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.iconButton}
                      onPress={() => copyToClipboard(translatedText)}
                    >
                      <Copy size={16} color={colors.textSecondary} />
                    </TouchableOpacity>
                  </View>
                </View>
                {isTranslating ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color={colors.primary} />
                  </View>
                ) : (
                  <Text style={[styles.textContent, { color: colors.text }]}>{translatedText}</Text>
                )}
              </View>
            </View>
          )}

          {/* Quick Actions */}
          <View style={styles.quickActions}>
            <Text style={[styles.quickActionsTitle, { color: colors.text }]}>快捷操作</Text>
            <View style={styles.quickActionsGrid}>
              <TouchableOpacity 
                style={[styles.quickActionButton, { backgroundColor: colors.card }]}
                onPress={() => setInputText('你好，今天天气怎么样？')}
              >
                <Text style={[styles.quickActionText, { color: colors.primary }]}>问候语</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.quickActionButton, { backgroundColor: colors.card }]}
                onPress={() => setInputText('请问附近有餐厅吗？')}
              >
                <Text style={[styles.quickActionText, { color: colors.primary }]}>问路</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.quickActionButton, { backgroundColor: colors.card }]}
                onPress={() => setInputText('谢谢你的帮助')}
              >
                <Text style={[styles.quickActionText, { color: colors.primary }]}>感谢</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.quickActionButton, { backgroundColor: colors.card }]}
                onPress={() => setInputText('How much does this cost?')}
              >
                <Text style={[styles.quickActionText, { color: colors.primary }]}>询价</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
  },
  languageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  languageBox: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  languageLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  languageText: {
    fontSize: 16,
    fontWeight: '600',
  },
  swapButton: {
    padding: 12,
    marginHorizontal: 16,
  },
  inputSection: {
    marginBottom: 30,
  },
  inputContainer: {
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  textInput: {
    fontSize: 16,
    minHeight: 120,
    maxHeight: 200,
    textAlignVertical: 'top',
    marginBottom: 12,
    lineHeight: 24,
  },
  inputFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  charCount: {
    fontSize: 12,
  },
  translateButton: {
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 80,
  },
  resultsContainer: {
    marginBottom: 30,
  },
  textCard: {
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  cardActions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    padding: 8,
  },
  textContent: {
    fontSize: 16,
    lineHeight: 24,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    fontSize: 16,
  },
  quickActions: {
    marginTop: 20,
  },
  quickActionsTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickActionButton: {
    flex: 1,
    minWidth: '45%',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '500',
  },
});
