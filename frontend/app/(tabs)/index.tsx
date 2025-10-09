import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
  ScrollView,
} from 'react-native';
import { Audio } from 'expo-av';
import { Mic, Square, ArrowUpDown, Volume2, Copy, Clock, Trash2 } from 'lucide-react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/contexts/ThemeContext';
import { translateText, TranslationError } from '../../services/translationService';

export default function DualVoiceScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const [fromLanguage, setFromLanguage] = useState('zh-CN');
  const [toLanguage, setToLanguage] = useState('en');
  const [isDualRecording, setIsDualRecording] = useState<'source' | 'target' | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [translationHistory, setTranslationHistory] = useState<Array<{
    id: string;
    source: string;
    target: string;
    fromLanguage: string;
    toLanguage: string;
    timestamp: Date;
    confidence: number;
    buttonColor: 'cyan' | 'pink';
    recordedLanguage: string; // 记录用户实际录音的语言
  }>>([]);

  useEffect(() => {
    return () => {
      if (recordingRef.current) {
        recordingRef.current.stopAndUnloadAsync().catch(console.error);
      }
    };
  }, []);


  const startDualRecording = async (type: 'source' | 'target') => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status !== 'granted') {
        Alert.alert('权限错误', '需要录音权限才能使用语音翻译功能');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(recording);
    recordingRef.current = recording;
      setIsDualRecording(type);
    } catch (err) {
      console.error('录音失败:', err);
      Alert.alert('错误', '录音启动失败');
    }
  };

  const stopDualRecording = async () => {
    if (!recording || !isDualRecording) return;

    try {
    await recording.stopAndUnloadAsync();
    } catch (error) {
      console.error('停止录音时出错:', error);
    }
    setRecording(null);
    recordingRef.current = null;

    // 模拟语音识别
    setTimeout(() => {
      const mockText = isDualRecording === 'source' 
        ? (fromLanguage === 'zh-CN' ? '你好，今天天气很好。' : 'Hello, the weather is nice today.')
        : (toLanguage === 'zh-CN' ? '你好，今天天气很好。' : 'Hello, the weather is nice today.');
      
      // 直接进行翻译，不需要等待两种语言都录制完成
      console.log('开始翻译:', mockText, '从', fromLanguage, '到', toLanguage);
      const currentLanguage = isDualRecording === 'source' ? fromLanguage : toLanguage;
      const buttonColor = currentLanguage === 'zh-CN' ? 'cyan' : 'pink';
      performTranslation(mockText, buttonColor, currentLanguage);
      setIsDualRecording(null);
    }, 1000);
  };

  const performTranslation = async (sourceText: string, buttonColor: 'cyan' | 'pink', recordedLanguage: string) => {
    setIsTranslating(true);
    
    try {
      // 根据录音语言确定翻译方向
      const isRecordedLanguageSource = recordedLanguage === fromLanguage;
      const actualFromLanguage = isRecordedLanguageSource ? fromLanguage : toLanguage;
      const actualToLanguage = isRecordedLanguageSource ? toLanguage : fromLanguage;
      
      console.log('开始翻译:', { source: sourceText, from: actualFromLanguage, to: actualToLanguage });
      
      // 调用真实的翻译API
      const result = await translateText(sourceText, actualFromLanguage, actualToLanguage);
      
      console.log('翻译完成:', result);
      
      // 显示顺序：录音语言作为原文在上，翻译结果在下
      const displaySource = sourceText; // 录音内容始终作为原文
      const displayTarget = result.translatedText; // 翻译结果
      const displayFromLanguage = actualFromLanguage; // 录音语言
      const displayToLanguage = actualToLanguage; // 翻译目标语言

      // 添加到翻译历史记录
      const newTranslation = {
        id: Date.now().toString(),
        source: displaySource,
        target: displayTarget,
        fromLanguage: displayFromLanguage,
        toLanguage: displayToLanguage,
        timestamp: new Date(),
        confidence: result.confidence,
        buttonColor,
        recordedLanguage
      };
      
      setTranslationHistory(prev => {
        const newHistory = [newTranslation, ...prev];
        // 只保留最新的30条记录
        return newHistory.slice(0, 30);
      });
      
    } catch (error) {
      console.error('翻译失败:', error);
      
      // 显示错误信息
      const errorMessage = error instanceof Error ? error.message : '翻译失败，请检查网络连接';
      Alert.alert('翻译错误', errorMessage);
      
      // 如果翻译失败，仍然添加一个错误记录到历史中
      const errorTranslation = {
        id: Date.now().toString(),
        source: sourceText,
        target: '翻译失败，请重试',
        fromLanguage: recordedLanguage,
        toLanguage: recordedLanguage === fromLanguage ? toLanguage : fromLanguage,
        timestamp: new Date(),
        confidence: 0,
        buttonColor,
        recordedLanguage
      };
      
      setTranslationHistory(prev => {
        const newHistory = [errorTranslation, ...prev];
        return newHistory.slice(0, 30);
      });
    } finally {
      setIsTranslating(false);
    }
  };


  const swapLanguages = () => {
    const temp = fromLanguage;
    setFromLanguage(toLanguage);
    setToLanguage(temp);
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

  const formatTime = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const diffMinutes = Math.floor(diff / (1000 * 60));
    const diffHours = Math.floor(diff / (1000 * 60 * 60));
    const diffDays = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (diffMinutes < 1) {
      return '刚刚';
    } else if (diffMinutes < 60) {
      return `${diffMinutes}分钟前`;
    } else if (diffHours < 24) {
      return `${diffHours}小时前`;
    } else if (diffDays < 7) {
      return `${diffDays}天前`;
    } else {
      return timestamp.toLocaleDateString();
    }
  };

  const getLanguageColor = (languageCode: string) => {
    // 中文使用深青绿色，其他语言使用热粉色
    return languageCode === 'zh-CN' ? '#00CED1' : '#FF69B4';
  };

  const deleteTranslation = (id: string) => {
    Alert.alert(
      '删除翻译',
      '确定要删除这条翻译记录吗？',
      [
        {
          text: '取消',
          style: 'cancel',
        },
        {
          text: '删除',
          style: 'destructive',
          onPress: () => {
            setTranslationHistory(prev => prev.filter(item => item.id !== id));
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>双语音翻译</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            分别录制两种语言进行对比翻译
          </Text>
        </View>

        {/* Text Results Area */}
        <View style={[
          styles.resultsArea,
          { paddingBottom: Platform.OS === 'android' ? 200 + insets.bottom : 220 }
        ]}>
          {/* Loading State */}

          {/* Translation History Cards */}
          {translationHistory.length > 0 ? (
            <ScrollView 
              style={styles.scrollContainer}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              {translationHistory.map((item) => {
                const fromLanguageColor = getLanguageColor(item.fromLanguage);
                const toLanguageColor = getLanguageColor(item.toLanguage);
                return (
                  <View key={item.id} style={[styles.translationCard, { backgroundColor: colors.card }]}>
                    <View style={styles.itemHeader}>
                      <View style={styles.languagePair}>
                        <Text style={[styles.languageText, { color: fromLanguageColor }]}>
                          {getLanguageName(item.fromLanguage)}
                        </Text>
                        <Text style={[styles.languageText, { color: colors.textSecondary }]}> → </Text>
                        <Text style={[styles.languageText, { color: toLanguageColor }]}>
                          {getLanguageName(item.toLanguage)}
                        </Text>
                      </View>
                      <View style={styles.timeContainer}>
                        <Clock size={12} color={colors.textSecondary} />
                        <Text style={[styles.timeText, { color: colors.textSecondary }]}>
                          {formatTime(item.timestamp)}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.textSection}>
                      <Text style={[styles.originalText, { color: fromLanguageColor }]}>
                        {item.source}
                      </Text>
                      <View style={[styles.divider, { backgroundColor: colors.border }]} />
                      <Text style={[styles.translatedText, { color: toLanguageColor }]}>
                        {item.target}
            </Text>
                    </View>

                    <View style={styles.actionBar}>
                      <TouchableOpacity style={styles.actionButton}>
                        <Volume2 size={16} color={colors.textSecondary} />
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.actionButton}>
                        <Copy size={16} color={colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => deleteTranslation(item.id)}
                      >
                        <Trash2 size={16} color={colors.error} />
                      </TouchableOpacity>
                    </View>
            </View>
                );
              })}
            </ScrollView>
          ) : (
            /* Empty State */
            !isTranslating && (
              <View style={styles.emptyState}>
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  点击底部按钮开始录音
                </Text>
                <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
                  分别录制两种语言进行对比翻译
            </Text>
              </View>
            )
          )}
        </View>

        {/* Bottom Section - Language Selector and Recording Buttons */}
        <View style={[
          styles.bottomSection,
          { 
            backgroundColor: colors.surface,
            borderTopColor: colors.border,
            paddingBottom: Platform.OS === 'android' ? 90 + insets.bottom : 110,
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
          }
        ]}>
        {/* Language Selector */}
        <View style={styles.languageContainer}>
            <View style={[styles.languageBox, { backgroundColor: colors.card }]}>
            <Text style={[styles.languageText, { color: colors.text }]}>{getLanguageName(fromLanguage)}</Text>
          </View>
          
          <TouchableOpacity 
            style={styles.swapButton}
            onPress={swapLanguages}
          >
            <ArrowUpDown size={24} color={colors.primary} />
          </TouchableOpacity>
          
            <View style={[styles.languageBox, { backgroundColor: colors.card }]}>
            <Text style={[styles.languageText, { color: colors.text }]}>{getLanguageName(toLanguage)}</Text>
          </View>
        </View>

            {/* Recording Buttons */}
            <View style={[styles.dualButtonContainer, { marginTop: 5 }]}>
                <TouchableOpacity
                  style={[
                    styles.dualRecordButton,
                  { backgroundColor: getLanguageColor(fromLanguage) },
                  isDualRecording === 'source' && { backgroundColor: '#FF6B6B' }
                  ]}
                  onPress={() => isDualRecording === 'source' ? stopDualRecording() : startDualRecording('source')}
                >
                  {isDualRecording === 'source' ? (
                  <Square size={32} color="#FFFFFF" />
                ) : (
                  <Mic size={32} color="#FFFFFF" />
                  )}
                </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.dualRecordButton,
                  { backgroundColor: getLanguageColor(toLanguage) },
                  isDualRecording === 'target' && { backgroundColor: '#FF6B6B' }
                ]}
                onPress={() => isDualRecording === 'target' ? stopDualRecording() : startDualRecording('target')}
              >
                {isDualRecording === 'target' ? (
                  <Square size={32} color="#FFFFFF" />
                ) : (
                  <Mic size={32} color="#FFFFFF" />
                )}
              </TouchableOpacity>
            </View>
          </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    padding: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
  languageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  languageBox: {
    width: '44%',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  swapButton: {
    padding: 12,
    position: 'absolute',
    left: '50%',
    top: '50%',
    marginLeft: -24,
    marginTop: -24,
    zIndex: 1,
    backgroundColor: 'transparent',
  },
  resultsArea: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 200,
    minHeight: 350,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  textCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  textContent: {
    fontSize: 16,
    lineHeight: 24,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  translationCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  languagePair: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  languageText: {
    fontSize: 12,
    fontWeight: '500',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeText: {
    fontSize: 12,
  },
  textSection: {
    marginBottom: 12,
  },
  originalText: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 8,
  },
  divider: {
    height: 1,
    marginVertical: 8,
  },
  translatedText: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '500',
  },
  actionBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  actionButton: {
    padding: 8,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '500',
  },
  bottomSection: {
    borderTopWidth: 1,
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  dualButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    gap: 20,
  },
  dualRecordButton: {
    width: 85,
    height: 85,
    borderRadius: 42.5,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
});