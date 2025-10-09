import { useTheme } from '@/contexts/ThemeContext';
import { useI18n } from '@/contexts/I18nContext';
import { getAvailableVoices } from '@/services/ttsService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Speech from 'expo-speech';
import { User, UserCheck } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { Alert, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// 使用Expo Speech的Voice类型
type Voice = Speech.Voice;

interface VoiceSelectorProps {
  visible: boolean;
  onClose: () => void;
  onVoiceSelected?: (voice: Voice | null) => void;
}

const VoiceSelector: React.FC<VoiceSelectorProps> = ({
  visible,
  onClose,
  onVoiceSelected
}) => {
  const { colors } = useTheme();
  const { t } = useI18n();
  const [voices, setVoices] = useState<Voice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<Voice | null>(null);
  const [selectedGender, setSelectedGender] = useState<'male' | 'female' | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      loadVoices();
    }
  }, [visible]);

  useEffect(() => {
    loadSavedVoice();
  }, []);

  const loadVoices = async () => {
    setLoading(true);
    try {
      const allVoices = await getAvailableVoices();
      
      if (allVoices && allVoices.length > 0) {
        const installedVoices = allVoices.filter(voice => {
          return voice.identifier && voice.name;
        });
        
        // 扩展语音选择范围，支持更多中文语音
        const chineseVoices = installedVoices.filter(voice => {
          const identifier = voice.identifier?.toLowerCase() || '';
          const language = voice.language?.toLowerCase() || '';
          return (
            identifier.includes('zh-cn') || 
            identifier.includes('zh-tw') || 
            identifier.includes('chinese') ||
            identifier.includes('mandarin') ||
            identifier.includes('cmn') ||
            language.includes('zh') ||
            language.includes('chinese')
          );
        });
        
        console.log('🔍 找到的中文语音:', chineseVoices);
        setVoices(chineseVoices);
        
        // 根据保存的语音确定当前选择的性别
        const savedVoiceId = await AsyncStorage.getItem('selectedVoiceId');
        if (savedVoiceId) {
          const savedVoice = chineseVoices.find(voice => voice.identifier === savedVoiceId);
          if (savedVoice) {
            setSelectedVoice(savedVoice);
            // 根据语音名称或标识符确定性别
            const identifier = savedVoiceId.toLowerCase();
            const name = savedVoice.name?.toLowerCase() || '';
            if (identifier.includes('male') || name.includes('male') || 
                identifier.includes('man') || name.includes('man') ||
                identifier.includes('zh-cn-language')) {
              setSelectedGender('male');
            } else if (identifier.includes('female') || name.includes('female') || 
                       identifier.includes('woman') || name.includes('woman') ||
                       identifier.includes('cmn-tw-x-ctc-local')) {
              setSelectedGender('female');
            }
          }
        }
      } else {
        setVoices([]);
      }
    } catch (error) {
      console.error('❌ 加载语音列表失败:', error);
      setVoices([]);
    } finally {
      setLoading(false);
    }
  };

  const loadSavedVoice = async () => {
    try {
      const savedVoiceId = await AsyncStorage.getItem('selectedVoiceId');
      if (savedVoiceId) {
        const allVoices = await getAvailableVoices();
        const savedVoice = allVoices.find(voice => voice.identifier === savedVoiceId);
        if (savedVoice) {
          setSelectedVoice(savedVoice);
        }
      }
    } catch (error) {
      console.error('❌ 加载保存的语音失败:', error);
    }
  };

  const handleGenderSelect = async (gender: 'male' | 'female') => {
    try {
      setSelectedGender(gender);
      
      // 根据性别智能选择对应的语音
      const targetVoice = voices.find(voice => {
        const identifier = voice.identifier?.toLowerCase() || '';
        const name = voice.name?.toLowerCase() || '';
        
        if (gender === 'male') {
          // 优先选择明确标识为男声的语音
          return (
            identifier.includes('male') || 
            name.includes('male') ||
            identifier.includes('man') || 
            name.includes('man') ||
            identifier.includes('zh-cn-language') ||
            // 如果没有明确的男声标识，选择第一个可用的中文语音
            (voices.length === 1 && identifier.includes('zh'))
          );
        } else {
          // 优先选择明确标识为女声的语音
          return (
            identifier.includes('female') || 
            name.includes('female') ||
            identifier.includes('woman') || 
            name.includes('woman') ||
            identifier.includes('cmn-tw-x-ctc-local') ||
            // 如果没有明确的女声标识，选择第二个可用的中文语音
            (voices.length > 1 && !identifier.includes('male') && !name.includes('male'))
          );
        }
      });
      
      if (targetVoice) {
        setSelectedVoice(targetVoice);
        await AsyncStorage.setItem('selectedVoiceId', targetVoice.identifier);
        onVoiceSelected?.(targetVoice);
        Alert.alert('语音已选择', `已选择${gender === 'male' ? '男声' : '女声'}语音`);
      } else {
        // 如果没有找到合适的语音，选择第一个可用的
        if (voices.length > 0) {
          const fallbackVoice = voices[0];
          setSelectedVoice(fallbackVoice);
          await AsyncStorage.setItem('selectedVoiceId', fallbackVoice.identifier);
          onVoiceSelected?.(fallbackVoice);
          Alert.alert('语音已选择', `已选择可用语音: ${fallbackVoice.name || fallbackVoice.identifier}`);
        } else {
          Alert.alert('错误', '未找到可用的语音');
        }
      }
    } catch (error) {
      console.error('❌ 保存语音选择失败:', error);
      Alert.alert('错误', '保存语音选择失败，请重试');
    }
  };

  const handleTestVoice = async (voice: Voice) => {
    try {
      console.log('🎵 测试语音:', voice.identifier);
      
      // 根据语音语言选择不同的测试文本
      const getTestText = (language: string) => {
        const lang = language?.toLowerCase() || '';
        if (lang.includes('zh') || lang.includes('chinese')) {
          return '你好，这是语音测试。欢迎使用语音翻译应用！';
        } else if (lang.includes('en')) {
          return 'Hello, this is a voice test. Welcome to the voice translation app!';
        } else if (lang.includes('ja')) {
          return 'こんにちは、これは音声テストです。音声翻訳アプリへようこそ！';
        } else if (lang.includes('ko')) {
          return '안녕하세요, 이것은 음성 테스트입니다. 음성 번역 앱에 오신 것을 환영합니다!';
        } else {
          return 'Hello, this is a voice test.';
        }
      };
      
      const testText = getTestText(voice.language || '');
      
      const speechOptions: any = {
        language: voice.language,
        voice: voice.identifier,
        rate: 0.8,
        pitch: 1.0,
        volume: 1.0,
        onDone: () => {
          console.log('✅ 语音测试完成');
        },
        onError: (error: any) => {
          console.error('❌ 语音测试失败:', error);
          Alert.alert('测试失败', '无法播放测试语音，请检查语音设置');
        }
      };
      
      // 停止当前播放的语音
      Speech.stop();
      
      // 播放测试语音
      Speech.speak(testText, speechOptions);
      
      // 显示测试提示
      Alert.alert('语音测试', `正在播放测试语音：${voice.name || voice.identifier}`, [
        { text: '停止', onPress: () => Speech.stop() }
      ]);
      
    } catch (error) {
      console.error('❌ 测试语音失败:', error);
      Alert.alert('错误', '无法播放测试语音');
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <Text style={[styles.title, { color: colors.text }]}>选择语音</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Text style={[styles.closeButtonText, { color: colors.textSecondary }]}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {loading ? (
              <View style={styles.loadingContainer}>
                <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                  正在加载语音列表...
                </Text>
              </View>
            ) : (
              <>
                {selectedVoice && (
                  <View style={[styles.currentSelection, { backgroundColor: colors.primary + '10' }]}>
                    <Text style={[styles.currentSelectionTitle, { color: colors.primary }]}>
                      当前选择
                    </Text>
                    <Text style={[styles.currentSelectionVoice, { color: colors.text }]}>
                      {selectedVoice.identifier}
                    </Text>
                  </View>
                )}

                <View style={styles.voiceList}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>
                    选择翻译语音
                  </Text>
                  
                  {voices.length > 0 ? (
                    <>
                      {/* Male Option */}
                      <TouchableOpacity
                        style={[
                          styles.genderOption,
                          { backgroundColor: colors.surface },
                          selectedGender === 'male' && {
                            backgroundColor: colors.primary + '10',
                            borderColor: colors.primary,
                            borderWidth: 1,
                          }
                        ]}
                        onPress={() => handleGenderSelect('male')}
                        activeOpacity={0.7}
                      >
                        <View style={styles.genderOptionLeft}>
                          <View style={[styles.genderIcon, { backgroundColor: colors.primary + '15' }]}>
                            <User size={24} color={colors.primary} />
                          </View>
                          <View style={styles.genderTextContainer}>
                            <Text style={[styles.genderLabel, { color: colors.text }]}>男声</Text>
                            <Text style={[styles.genderSubtitle, { color: colors.textSecondary }]}>
                              适合男性用户或偏好男声的用户
                            </Text>
                          </View>
                        </View>
                        <View style={[
                          styles.radioButton,
                          { borderColor: colors.primary },
                          selectedGender === 'male' && { backgroundColor: colors.primary }
                        ]}>
                          {selectedGender === 'male' && (
                            <View style={[styles.radioButtonInner, { backgroundColor: 'white' }]} />
                          )}
                        </View>
                      </TouchableOpacity>

                      {/* Female Option */}
                      <TouchableOpacity
                        style={[
                          styles.genderOption,
                          { backgroundColor: colors.surface },
                          selectedGender === 'female' && {
                            backgroundColor: colors.primary + '10',
                            borderColor: colors.primary,
                            borderWidth: 1,
                          }
                        ]}
                        onPress={() => handleGenderSelect('female')}
                        activeOpacity={0.7}
                      >
                        <View style={styles.genderOptionLeft}>
                          <View style={[styles.genderIcon, { backgroundColor: colors.primary + '15' }]}>
                            <UserCheck size={24} color={colors.primary} />
                          </View>
                          <View style={styles.genderTextContainer}>
                            <Text style={[styles.genderLabel, { color: colors.text }]}>女声</Text>
                            <Text style={[styles.genderSubtitle, { color: colors.textSecondary }]}>
                              适合女性用户或偏好女声的用户
                            </Text>
                          </View>
                        </View>
                        <View style={[
                          styles.radioButton,
                          { borderColor: colors.primary },
                          selectedGender === 'female' && { backgroundColor: colors.primary }
                        ]}>
                          {selectedGender === 'female' && (
                            <View style={[styles.radioButtonInner, { backgroundColor: 'white' }]} />
                          )}
                        </View>
                      </TouchableOpacity>

                      {/* Test Voice Button */}
                      {selectedVoice && (
                        <TouchableOpacity
                          style={[styles.testButton, { backgroundColor: colors.primary + '15' }]}
                          onPress={() => handleTestVoice(selectedVoice)}
                          activeOpacity={0.7}
                        >
                          <Text style={[styles.testButtonText, { color: colors.primary }]}>
                            🎵 测试当前语音
                          </Text>
                        </TouchableOpacity>
                      )}

                      {/* Available Voices List */}
                      {voices.length > 2 && (
                        <View style={styles.availableVoicesContainer}>
                          <Text style={[styles.availableVoicesTitle, { color: colors.text }]}>
                            可用语音列表 ({voices.length})
                          </Text>
                          {voices.slice(0, 3).map((voice, index) => (
                            <View key={voice.identifier} style={[styles.voiceItem, { backgroundColor: colors.surface }]}>
                              <View style={styles.voiceItemLeft}>
                                <Text style={[styles.voiceName, { color: colors.text }]}>
                                  {voice.name || voice.identifier}
                                </Text>
                                <Text style={[styles.voiceLanguage, { color: colors.textSecondary }]}>
                                  {voice.language}
                                </Text>
                              </View>
                              <TouchableOpacity
                                style={[styles.testVoiceButton, { backgroundColor: colors.primary + '20' }]}
                                onPress={() => handleTestVoice(voice)}
                                activeOpacity={0.7}
                              >
                                <Text style={[styles.testVoiceButtonText, { color: colors.primary }]}>
                                  {t('voice.test', '测试')}
                                </Text>
                              </TouchableOpacity>
                            </View>
                          ))}
                        </View>
                      )}
                    </>
                  ) : (
                    <View style={styles.emptyContainer}>
                      <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                        {t('voice.noSystemVoice', '未检测到系统语音')}
                      </Text>
                      <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
                        {t('voice.installVoicePack', '请确保设备已安装中文语音包')}
                      </Text>
                    </View>
                  )}
                </View>
              </>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    maxHeight: '80%',
    minHeight: '60%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 18,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
  },
  currentSelection: {
    marginVertical: 16,
    padding: 16,
    borderRadius: 12,
  },
  currentSelectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  currentSelectionVoice: {
    fontSize: 16,
    fontWeight: '500',
  },
  voiceList: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  genderOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    minHeight: 60,
  },
  genderOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  genderIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  genderTextContainer: {
    flex: 1,
  },
  genderLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  genderSubtitle: {
    fontSize: 12,
    lineHeight: 16,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButtonInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.7,
  },
  testButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 20,
  },
  testButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  availableVoicesContainer: {
    marginTop: 20,
  },
  availableVoicesTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  voiceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    marginBottom: 8,
    borderRadius: 8,
  },
  voiceItemLeft: {
    flex: 1,
  },
  voiceName: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 2,
  },
  voiceLanguage: {
    fontSize: 12,
  },
  testVoiceButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  testVoiceButtonText: {
    fontSize: 12,
    fontWeight: '500',
  },
});

export default VoiceSelector;
