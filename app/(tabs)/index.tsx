import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
    Alert,
    Animated,
    AppState,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { API_CONFIG } from '../../config/environment';
// TODO: 迁移到 expo-audio (expo-av 将在 SDK 54 后弃用)
// 当前 Expo SDK: ~54.0.10, expo-audio: ~1.0.13 已安装
// 迁移优先级: 中等 (当前功能正常，但需要为未来做准备)
import { Audio } from 'expo-av';
import * as Speech from 'expo-speech';
import { ArrowUpDown, Clock, Copy, Menu, Mic, Trash2 } from 'lucide-react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
// 使用 Expo 兼容的剪贴板方案
import { useTheme } from '@/contexts/ThemeContext';
import { useI18n } from '@/contexts/I18nContext';
import { AutoPlayService } from '@/services/autoPlayService';
import { useIsFocused } from '@react-navigation/native';
import * as Clipboard from 'expo-clipboard';
import { router } from 'expo-router';
import SpeakButton from '../../components/SpeakButton';
import { getLanguageDisplayName, SUPPORTED_LANGUAGES } from '../../constants/languages';
import { translateText } from '../../services/translationService';
import { playTTS } from '../../services/ttsService';

export default function DualVoiceScreen() {
  const { colors, autoPlayVoiceTranslation } = useTheme();
  const { t, currentLanguage } = useI18n();
  const insets = useSafeAreaInsets();
  const isFocused = useIsFocused();
  const [sourceRecording, setSourceRecording] = useState<Audio.Recording | null>(null);
  const [targetRecording, setTargetRecording] = useState<Audio.Recording | null>(null);
  const [fromLanguage, setFromLanguage] = useState('en');
  const [toLanguage, setToLanguage] = useState('zh-CN');
  const [isRecording, setIsRecording] = useState<'source' | 'target' | null>(null);
  
  // 🎯 离线模式状态
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  
  // 🎯 语言选择状态
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [selectingLanguageType, setSelectingLanguageType] = useState<'source' | 'target'>('source');
  const [isTranslating, setIsTranslating] = useState(false);
  const [isRecordingInProgress, setIsRecordingInProgress] = useState(false); // 防止重复调用
  const [isPressing, setIsPressing] = useState<'source' | 'target' | null>(null); // 按钮按压状态
  const pressingRef = useRef<'source' | 'target' | null>(null); // 按压状态引用
  
  // 录音动画效果 - 粒子效果
  const sourcePulseAnim = useRef(new Animated.Value(1)).current;
  const targetPulseAnim = useRef(new Animated.Value(1)).current;
  
  // 粒子效果动画值 - 8个小光点
  const sourceParticles = Array.from({ length: 8 }, () => useRef(new Animated.Value(0)).current);
  const targetParticles = Array.from({ length: 8 }, () => useRef(new Animated.Value(0)).current);
  
  // 动画实例引用 - 用于正确停止动画
  const sourcePulseAnimationRef = useRef<Animated.CompositeAnimation | null>(null);
  const targetPulseAnimationRef = useRef<Animated.CompositeAnimation | null>(null);
  const sourceParticleAnimationsRef = useRef<Animated.CompositeAnimation[]>([]);
  const targetParticleAnimationsRef = useRef<Animated.CompositeAnimation[]>([]);
  
  // 清理状态标记 - 防止重复清理
  const isCleaning = useRef(false);

  // 🎯 监听翻译模式状态
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

  // 停止录音函数 - 只停止录音，不清理资源
  const stopRecording = useCallback(async (reason: string = 'unknown') => {
    console.log(`🛑 停止录音 (${reason})`);
    
    // 停止语音播报
    Speech.stop();
    
    // 重置播放状态
    setPlayingItemId(null);
    setIsPaused(false);
    
    // 停止当前录音
    if (isRecording) {
      const currentType = isRecording;
      let currentRecording: Audio.Recording | null = null;
      
      if (currentType === 'source' && sourceRecording) {
        currentRecording = sourceRecording;
      } else if (currentType === 'target' && targetRecording) {
        currentRecording = targetRecording;
      }
      
      if (currentRecording) {
        try {
          const status = await currentRecording.getStatusAsync();
          if (status.isRecording) {
            await currentRecording.stopAndUnloadAsync();
          }
        } catch (error) {
          console.warn('停止录音时出错:', error);
        }
      }
      
      // 停止动画
      stopRecordingAnimation(currentType);
      
      // 重置录音状态
      if (currentType === 'source') {
        setSourceRecording(null);
      } else {
        setTargetRecording(null);
      }
      setIsRecording(null);
      setIsRecordingInProgress(false);
    }
  }, []); // 移除依赖，避免频繁重新创建

  // 清理录音资源函数 - 确保资源完全释放
  const cleanupRecording = useCallback(async (reason: string = 'unknown') => {
    if (isCleaning.current) {
      console.log(`⚠️ 清理已在进行中，跳过重复清理 (${reason})`);
      return;
    }
    
    isCleaning.current = true;
    console.log(`🧹 开始清理录音资源 (${reason})`);
    
    try {
      // 停止语音播报
      Speech.stop();
      
      // 重置播放状态
      setPlayingItemId(null);
      setIsPaused(false);
      
      // 清理所有录音状态
      const cleanupRecordingInstance = async (recording: Audio.Recording | null, type: string) => {
        if (recording) {
          try {
            const status = await recording.getStatusAsync();
            if (status.isRecording) {
              console.log(`🛑 停止录音 (${type})`);
              await recording.stopAndUnloadAsync();
            }
          } catch (error) {
            // 忽略 "Recorder does not exist" 错误，这是正常的
            if (!(error instanceof Error && error.message?.includes('Recorder does not exist'))) {
              console.warn(`清理录音资源时出错 (${type}):`, error);
            }
          }
        }
      };
      
      // 并行清理两个录音
      await Promise.all([
        cleanupRecordingInstance(sourceRecording, 'source'),
        cleanupRecordingInstance(targetRecording, 'target')
      ]);
      
      // 停止动画
      stopRecordingAnimation('source');
      stopRecordingAnimation('target');
      
      // 重置状态
      setSourceRecording(null);
      setTargetRecording(null);
      setIsRecording(null);
      setIsRecordingInProgress(false);
      
      // 重置音频模式
      await Audio.setAudioModeAsync({ 
        allowsRecordingIOS: false,
        playsInSilentModeIOS: false 
      });
      
      console.log(`✅ 录音资源清理完成 (${reason})`);
    } catch (error) {
      console.error('清理录音资源时出错:', error);
    } finally {
      isCleaning.current = false;
    }
  }, []); // 移除依赖，避免频繁重新创建

  // 🎯 语言选择处理
  const handleSelectLanguage = useCallback((languageCode: string) => {
    if (selectingLanguageType === 'source') {
      setFromLanguage(languageCode);
      // 保存语言选择
      saveLanguageSelection(languageCode, toLanguage);
    } else {
      setToLanguage(languageCode);
      // 保存语言选择
      saveLanguageSelection(fromLanguage, languageCode);
    }
    setShowLanguageModal(false);
  }, [selectingLanguageType, fromLanguage, toLanguage]);

  const openSourceLanguageModal = useCallback(() => {
    setSelectingLanguageType('source');
    setShowLanguageModal(true);
  }, []);

  const openTargetLanguageModal = useCallback(() => {
    setSelectingLanguageType('target');
    setShowLanguageModal(true);
  }, []);

  // 开始录音动画 - 粒子效果
  const startRecordingAnimation = (type: 'source' | 'target') => {
    const pulseAnim = type === 'source' ? sourcePulseAnim : targetPulseAnim;
    const particles = type === 'source' ? sourceParticles : targetParticles;
    const pulseAnimationRef = type === 'source' ? sourcePulseAnimationRef : targetPulseAnimationRef;
    const particleAnimationsRef = type === 'source' ? sourceParticleAnimationsRef : targetParticleAnimationsRef;
    
    // 先停止之前的动画（如果有的话）
    if (pulseAnimationRef.current) {
      pulseAnimationRef.current.stop();
    }
    particleAnimationsRef.current.forEach(animation => {
      if (animation) animation.stop();
    });
    particleAnimationsRef.current = [];
    
    // 脉冲动画
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    pulseAnimationRef.current = pulseAnimation;
    pulseAnimation.start();
    
    // 粒子动画 - 每个粒子延迟启动
    particles.forEach((particle, index) => {
      const delay = index * 200; // 每个粒子延迟200ms
      
      setTimeout(() => {
        const particleAnimation = Animated.loop(
          Animated.sequence([
            Animated.timing(particle, {
              toValue: 1,
              duration: 800,
              useNativeDriver: true,
            }),
            Animated.timing(particle, {
              toValue: 0,
              duration: 400,
              useNativeDriver: true,
            }),
          ])
        );
        particleAnimationsRef.current[index] = particleAnimation;
        particleAnimation.start();
      }, delay);
    });
  };

  // 停止录音动画
  const stopRecordingAnimation = (type: 'source' | 'target') => {
    console.log(`停止录音动画 - ${type}`);
    
    const pulseAnim = type === 'source' ? sourcePulseAnim : targetPulseAnim;
    const particles = type === 'source' ? sourceParticles : targetParticles;
    const pulseAnimationRef = type === 'source' ? sourcePulseAnimationRef : targetPulseAnimationRef;
    const particleAnimationsRef = type === 'source' ? sourceParticleAnimationsRef : targetParticleAnimationsRef;
    
    // 正确停止所有动画实例
    if (pulseAnimationRef.current) {
      console.log(`停止脉冲动画 - ${type}`);
      pulseAnimationRef.current.stop();
      pulseAnimationRef.current = null;
    }
    
    // 停止所有粒子动画
    particleAnimationsRef.current.forEach((animation, index) => {
      if (animation) {
        console.log(`停止粒子动画 ${index} - ${type}`);
        animation.stop();
      }
    });
    particleAnimationsRef.current = [];
    
    // 停止 Animated.Value 的当前动画
    pulseAnim.stopAnimation();
    particles.forEach(particle => particle.stopAnimation());
    
    // 使用快速动画重置到初始状态，避免卡住
    const resetAnimations = [
      Animated.timing(pulseAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
      ...particles.map(particle => 
        Animated.timing(particle, {
          toValue: 0,
          duration: 100,
          useNativeDriver: true,
        })
      )
    ];
    
    Animated.parallel(resetAnimations).start();
    
    console.log(`录音动画已停止 - ${type}`);
  };

  // AppState 监听器 - 处理app后台状态
  useEffect(() => {
    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === 'background' || nextAppState === 'inactive') {
        console.log('🛑 App进入后台，停止所有播报');
        Speech.stop();
        setPlayingItemId(null);
        setIsPaused(false);
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    return () => {
      subscription?.remove();
    };
  }, []);

  // 页面失去焦点时停止录音和播报 - 使用更精确的焦点检测
  useEffect(() => {
    if (!isFocused) {
      // 添加延迟，避免快速切换时的误触发
      const timer = setTimeout(() => {
        console.log('🛑 页面失去焦点，停止录音和播报');
        // 停止当前录音
        if (isRecording) {
          stopCurrentRecording();
        }
        // 停止当前播报
        Speech.stop();
        setPlayingItemId(null);
        setIsPaused(false);
      }, 200);
      
      return () => clearTimeout(timer);
    }
  }, [isFocused, isRecording]);

  // 组件卸载时清理所有资源
  useEffect(() => {
    return () => {
      // 只在组件真正卸载时清理
      cleanupRecording('组件卸载');
    };
  }, []); // 空依赖数组，只在组件卸载时执行
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
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
  const [playingItemId, setPlayingItemId] = useState<string | null>(null);
  const [isPaused, setIsPaused] = useState(false);

  // 保存翻译历史记录到本地存储
  const saveTranslationHistory = async (history: typeof translationHistory) => {
    try {
      await AsyncStorage.setItem('translationHistory', JSON.stringify(history));
    } catch (error) {
      console.error('保存翻译历史失败:', error);
    }
  };

  // 从本地存储加载翻译历史记录
  const loadTranslationHistory = async () => {
    try {
      const savedHistory = await AsyncStorage.getItem('translationHistory');
      if (savedHistory) {
        const parsedHistory = JSON.parse(savedHistory);
        // 将时间戳字符串转换回Date对象
        const historyWithDates = parsedHistory.map((item: any) => ({
          ...item,
          timestamp: new Date(item.timestamp)
        }));
        setTranslationHistory(historyWithDates);
      }
    } catch (error) {
      console.error('加载翻译历史失败:', error);
    }
  };

  // 保存语言选择到 AsyncStorage
  const saveLanguageSelection = async (fromLang: string, toLang: string) => {
    try {
      await AsyncStorage.setItem('voiceTranslationLanguages', JSON.stringify({
        fromLanguage: fromLang,
        toLanguage: toLang
      }));
    } catch (error) {
      console.error('保存语言选择失败:', error);
    }
  };

  // 从 AsyncStorage 加载语言选择
  const loadLanguageSelection = async () => {
    try {
      const savedLanguages = await AsyncStorage.getItem('voiceTranslationLanguages');
      if (savedLanguages) {
        const { fromLanguage: savedFrom, toLanguage: savedTo } = JSON.parse(savedLanguages);
        setFromLanguage(savedFrom || 'en');
        setToLanguage(savedTo || 'zh-CN');
      }
    } catch (error) {
      console.error('加载语言选择失败:', error);
    }
  };

  // 组件加载时加载翻译历史记录和语言选择
  useEffect(() => {
    loadTranslationHistory();
    loadLanguageSelection();
  }, []);


  // 注意：录音状态变化的清理逻辑已整合到 cleanupAllRecordings 函数中
  // 不再需要单独的 useEffect 来监听录音状态变化



  const handleRecordingPress = async (type: 'source' | 'target') => {
    console.log(`录音按钮按下 - ${type}, 当前录音状态: ${isRecording}, 按压状态: ${isPressing}`);
    
    // 如果正在录音这个按钮，则停止录音
    if (isRecording === type) {
      console.log(`停止录音 - ${type}`);
      await stopCurrentRecording();
      setIsPressing(null);
      pressingRef.current = null;
      return;
    }
    
    // 如果正在按压其他按钮，先停止
    if (pressingRef.current && pressingRef.current !== type) {
      console.log(`停止按压其他按钮 ${pressingRef.current}，开始按压 ${type}`);
      pressingRef.current = null;
    }
    
    // 设置按压状态
    setIsPressing(type);
    pressingRef.current = type;
    
    // 延迟300ms后开始录音
    setTimeout(async () => {
      // 使用 ref 检查按压状态
      if (pressingRef.current === type) {
        console.log(`按压时间足够，开始录音 - ${type}`);
        await startRecording(type);
      } else {
        console.log(`按压状态已改变，不开始录音 - ${type}, 当前按压状态: ${pressingRef.current}`);
      }
    }, 300);
  };

  const handleRecordingRelease = async (type: 'source' | 'target') => {
    console.log(`录音按钮松开 - ${type}, 当前录音状态: ${isRecording}, 按压状态: ${isPressing}`);
    
    // 清除按压状态
    setIsPressing(null);
    pressingRef.current = null;
    
    // 如果正在录音这个按钮，则停止录音
    if (isRecording === type) {
      console.log(`停止录音 - ${type}`);
      await stopCurrentRecording();
    }
  };

  const startRecording = async (type: 'source' | 'target') => {
    console.log(`开始录音 - ${type}, 当前录音状态: ${isRecording}, 录音进行中: ${isRecordingInProgress}`);
    
    if (isRecordingInProgress) {
      console.log('录音正在进行中，忽略重复调用');
      return;
    }

    const permission = await Audio.requestPermissionsAsync();
    if (!permission.granted) {
      alert("请开启麦克风权限");
      return;
    }

    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
    });

    const { recording } = await Audio.Recording.createAsync({
      android: {
        extension: '.m4a',
        outputFormat: Audio.AndroidOutputFormat.MPEG_4,
        audioEncoder: Audio.AndroidAudioEncoder.AAC,
        sampleRate: 16000,
        numberOfChannels: 1,
        bitRate: 128000,
      },
      ios: {
        extension: '.m4a',
        outputFormat: Audio.IOSOutputFormat.MPEG4AAC,
        audioQuality: Audio.IOSAudioQuality.MEDIUM,
        sampleRate: 16000,
        numberOfChannels: 1,
        bitRate: 128000,
      },
      web: {
        mimeType: 'audio/webm',
        bitsPerSecond: 128000,
      },
      isMeteringEnabled: true,
    });

    if (type === 'source') setSourceRecording(recording);
    else setTargetRecording(recording);

    setIsRecording(type);
    setIsRecordingInProgress(true);

    startRecordingAnimation(type);
  };

  const stopCurrentRecording = async () => {
    console.log(`停止录音 - 当前录音状态: ${isRecording}`);
    
    if (!isRecording) {
      console.log('没有正在录音，跳过停止操作');
      return;
    }

    const currentType = isRecording;
    const currentRecording = currentType === 'source' ? sourceRecording : targetRecording;
    
    // 立即清理UI状态，不要有loading感觉
    setIsRecording(null);
    setIsRecordingInProgress(false);
    stopRecordingAnimation(currentType);
    
    if (!currentRecording) {
      return;
    }
    
    try {
      const status = await currentRecording.getStatusAsync();
      if (!status.isRecording) {
        return;
      }

      await currentRecording.stopAndUnloadAsync();

      const duration = status.durationMillis || 0;
      if (duration < 300) {
        setToastMessage("录音太短，请按住按钮说话");
        setShowToast(true);
        // 3秒后自动关闭提示
        setTimeout(() => setShowToast(false), 3000);
      } else if (status.metering !== undefined && status.metering < -30) {
        setToastMessage(t('voice.noVoiceDetected', '无法检测到语音，请稍微大声一点说话或靠近手机一些'));
        setShowToast(true);
        // 4秒后自动关闭提示
        setTimeout(() => setShowToast(false), 4000);
      } else {
        // 异步处理翻译，不阻塞UI
        handleRecordingTranslation(currentRecording, currentType);
      }
    } catch (err) {
      console.warn("stopCurrentRecording 出错:", err);
    } finally {
      // 清理录音实例
      if (currentType === 'source') {
        setSourceRecording(null);
      } else {
        setTargetRecording(null);
      }
    }
  };

  const handleRecordingTranslation = async (currentRecording: Audio.Recording, type: 'source' | 'target') => {
    const currentLanguage = type === 'source' ? fromLanguage : toLanguage;
    const buttonColor = type === 'source' ? 'pink' : 'cyan';
    
    // 异步添加处理状态到翻译历史记录，不阻塞UI
    setTimeout(() => {
      const processingTranslation = {
        id: `processing-${Date.now()}`,
        source: 'reading...',
        target: 'translating...',
        fromLanguage: type === 'source' ? fromLanguage : toLanguage,
        toLanguage: type === 'source' ? toLanguage : fromLanguage,
        timestamp: new Date(),
        confidence: 0,
        buttonColor: buttonColor as 'cyan' | 'pink',
        recordedLanguage: currentLanguage
      };
      
      setTranslationHistory(prev => [processingTranslation, ...prev]);
    }, 0);

    try {
      const uri = currentRecording.getURI();
      if (!uri) {
        throw new Error('录音文件URI无效');
      }

      const sourceLanguage = type === 'source' ? fromLanguage : toLanguage;
      const targetLanguage = type === 'source' ? toLanguage : fromLanguage;

      // 检查当前翻译模式
      const { translationModeManager } = await import('@/services/translationModeManager');
      const modeState = translationModeManager.getCurrentState();
      
      if (modeState.actualMode === 'offline') {
        // 离线模式：语音识别不可用
        console.log('⚠️ 离线模式：语音识别不可用');
        
        // 清除 "reading..." 状态
        setTimeout(() => {
          setTranslationHistory(prev => {
            const newHistory = [...prev];
            const processingIndex = newHistory.findIndex(item => item.source === 'reading...');
            if (processingIndex !== -1) {
              // 直接移除这条记录，因为用户已经在顶部看到提示了
              newHistory.splice(processingIndex, 1);
            }
            return newHistory;
          });
        }, 0);
        return;
      } else {
        // 在线模式：使用原有的云服务
        console.log('🌐 在线模式：使用云语音翻译服务');
        await handleOnlineVoiceTranslation(uri, sourceLanguage, targetLanguage, buttonColor, currentLanguage);
      }
    } catch (error) {
      console.error('语音翻译失败:', error);
      
      // 更新翻译历史记录显示错误
      setTimeout(() => {
        setTranslationHistory(prev => {
          const newHistory = [...prev];
          const processingIndex = newHistory.findIndex(item => item.source === 'reading...');
          if (processingIndex !== -1) {
            newHistory[processingIndex] = {
              ...newHistory[processingIndex],
              source: '翻译失败',
              target: '请重试',
            };
          }
          return newHistory;
        });
      }, 0);
    }
  };

  // 在线语音翻译处理函数
  const handleOnlineVoiceTranslation = async (
    uri: string, 
    sourceLanguage: string, 
    targetLanguage: string, 
    buttonColor: string, 
    currentLanguage: string
  ) => {
    const formData = new FormData();
    formData.append('file', {
      uri: uri,
      name: 'audio.m4a',
      type: 'audio/m4a',
    } as any);
    formData.append('sourceLang', sourceLanguage);
    formData.append('targetLang', targetLanguage);
    formData.append('useHighQualityTTS', 'false');
    
    console.log('[Voice Translation] Audio file info:', {
      uri: uri,
      name: 'audio.m4a',
      type: 'audio/m4a'
    });

    console.log('[Voice Translation] Sending request to:', `${API_CONFIG.BASE_URL}/api/voice-translate`);
    console.log('[Voice Translation] Form data:', {
      sourceLang: sourceLanguage,
      targetLang: targetLanguage,
      audioUri: uri
    });

    const response = await fetch(`${API_CONFIG.BASE_URL}/api/voice-translate`, {
      method: 'POST',
      body: formData,
      headers: {
        // 不设置Content-Type，让浏览器自动设置multipart/form-data边界
      },
    });

    console.log('[Voice Translation] Response status:', response.status);
    console.log('[Voice Translation] Response headers:', response.headers);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Voice Translation] Error response:', errorText);
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }

    const data = await response.json();
    console.log('[Voice Translation] Response data:', data);

    if (data.success && data.data) {
      const { sourceText, translatedText } = data.data;
      console.log('[Voice Translation] 使用系统TTS');
      await performTranslationWithAudio(sourceText, translatedText, buttonColor as 'cyan' | 'pink', currentLanguage);
    } else {
      throw new Error(data.error?.message || '语音翻译失败');
    }
  };

  // 离线语音翻译结果处理函数
  const performOfflineTranslationWithAudio = async (
    sourceText: string, 
    translatedText: string, 
    buttonColor: string, 
    currentLanguage: string, 
    targetLanguage: string
  ) => {
    // 更新翻译历史记录
    setTimeout(() => {
      setTranslationHistory(prev => {
        const newHistory = [...prev];
        const processingIndex = newHistory.findIndex(item => item.source === 'reading...');
        if (processingIndex !== -1) {
          newHistory[processingIndex] = {
            ...newHistory[processingIndex],
            source: sourceText,
            target: translatedText,
            confidence: 0.8, // 离线翻译的置信度
          };
        }
        return newHistory;
      });
    }, 0);

    // 使用离线TTS播放翻译结果
    try {
      const { offlineVoiceService } = await import('@/services/offlineVoiceService');
      await offlineVoiceService.textToSpeech(translatedText, targetLanguage);
      console.log('✅ 离线TTS播放完成');
    } catch (ttsError) {
      console.warn('⚠️ 离线TTS播放失败:', ttsError);
    }

    // 自动播放（如果启用）
    if (autoPlayVoiceTranslation) {
      console.log('🔊 自动播放离线翻译结果');
      // 这里可以添加自动播放逻辑
    }
  };


  // 播报翻译结果的函数 - 改进的时间估算
  const speakTranslation = async (text: string, language: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      let isResolved = false;
      let timeoutId: ReturnType<typeof setTimeout> | null = null;
      
      // 统一的完成处理函数
      const handleComplete = (reason: string) => {
        if (isResolved) return;
        isResolved = true;
        
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        
        console.log(`✅ 语音播报完成 (${reason})`);
        resolve();
      };
      
      // 改进的时间估算算法
      const calculateEstimatedDuration = (text: string): number => {
        // 基础时间：每个字符的播报时间
        const baseTimePerChar = 80; // 毫秒/字符
        
        // 语言调整系数
        const languageMultiplier = language === 'zh-CN' ? 1.2 : 1.0; // 中文稍慢
        
        // 文本长度调整
        const textLength = text.length;
        let estimatedTime = textLength * baseTimePerChar * languageMultiplier;
        
        // 长文本调整（避免过长估算）
        if (textLength > 100) {
          estimatedTime = Math.min(estimatedTime, textLength * 60); // 长文本更保守
        }
        
        // 设置最小和最大时间
        return Math.max(Math.min(estimatedTime, 30000), 1000); // 1-30秒
      };
      
      // 设置超时保护
      const fallbackTimeout = calculateEstimatedDuration(text);
      timeoutId = setTimeout(() => {
        handleComplete('超时保护');
      }, fallbackTimeout);
      
      try {
        // 停止当前播放
        Speech.stop();
        
        console.log('开始TTS播报翻译结果:', text, '语言:', language, '预估时间:', fallbackTimeout + 'ms');
        
        // 使用新的TTS服务，传递语言参数和声音设置
        playTTS(text, language, 
          // onDone 回调
          () => {
            console.log('TTS播报完成');
            handleComplete('TTS完成');
          },
          // onError 回调
          (error) => {
            console.error('TTS播报失败:', error);
            // 如果TTS失败，回退到系统语音
            try {
              const speechOptions = {
                language: language === 'zh-CN' ? 'zh-CN' : 'en-US',
                pitch: 1.0, // 默认音调
                rate: 0.9,  // 语速适中
                volume: 1.0,
                voice: undefined, // 使用默认声音
                onDone: () => {
                  console.log('系统语音播报完成');
                  handleComplete('系统语音完成');
                },
                onError: (error: any) => {
                  console.error('系统语音播报失败:', error);
                  if (!isResolved) {
                    isResolved = true;
                    if (timeoutId) clearTimeout(timeoutId);
                    reject(error);
                  }
                }
              };
              
              Speech.speak(text, speechOptions);
              console.log('系统语音播报开始');
              
            } catch (fallbackError) {
              console.error('系统语音播报也失败:', fallbackError);
              if (!isResolved) {
                isResolved = true;
                if (timeoutId) clearTimeout(timeoutId);
                reject(fallbackError);
              }
            }
          }
        );
      } catch (error) {
        console.error('播报失败:', error);
        if (!isResolved) {
          isResolved = true;
          if (timeoutId) clearTimeout(timeoutId);
          reject(error);
        }
      }
    });
  };

  const performTranslationWithAudio = async (sourceText: string, translatedText: string, buttonColor: 'cyan' | 'pink', recordedLanguage: string) => {
    setIsTranslating(true);
    
    try {
      // 根据录音语言确定翻译方向
      const isRecordedLanguageSource = recordedLanguage === fromLanguage;
      const actualFromLanguage = isRecordedLanguageSource ? fromLanguage : toLanguage;
      const actualToLanguage = isRecordedLanguageSource ? toLanguage : fromLanguage;
      
      console.log('处理翻译结果:', { source: sourceText, translated: translatedText, from: actualFromLanguage, to: actualToLanguage });
      
      // 显示顺序：录音语言作为原文在上，翻译结果在下
      const displaySource = sourceText; // 录音内容始终作为原文
      const displayTarget = translatedText; // 翻译结果
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
        confidence: 0.95,
        buttonColor,
        recordedLanguage,
      };
      
      setTranslationHistory(prev => {
        // 移除处理状态（以"processing-"开头的记录）
        const filteredHistory = prev.filter(item => !item.id.startsWith('processing-'));
        const newHistory = [newTranslation, ...filteredHistory];
        // 只保留最新的30条记录
        const updatedHistory = newHistory.slice(0, 30);
        // 保存到本地存储
        saveTranslationHistory(updatedHistory);
        return updatedHistory;
      });

      // 自动播放语音翻译结果
      if (autoPlayVoiceTranslation) {
        // 使用系统TTS播放
        console.log('🔊 使用系统TTS播放');
        AutoPlayService.playTranslationByType(
          translatedText,
          actualToLanguage,
          'voice',
          {
            autoPlayVoiceTranslation,
            autoPlayTextTranslation: false,
          }
        );
      }
      
    } catch (error) {
      console.error('处理翻译结果失败:', error);
      
      // 显示错误信息
      const errorMessage = error instanceof Error ? error.message : t('errors.translationError', '处理翻译结果失败');
      Alert.alert(t('errors.translationError', '翻译错误'), errorMessage);
      
      // 如果处理失败，仍然添加一个错误记录到历史中
      const errorTranslation = {
        id: Date.now().toString(),
        source: sourceText,
        target: t('voice.translationFailed', '翻译失败'),
        fromLanguage: recordedLanguage,
        toLanguage: recordedLanguage === fromLanguage ? toLanguage : fromLanguage,
        timestamp: new Date(),
        confidence: 0,
        buttonColor,
        recordedLanguage
      };
      
      setTranslationHistory(prev => {
        // 移除处理状态（以"processing-"开头的记录）
        const filteredHistory = prev.filter(item => !item.id.startsWith('processing-'));
        const newHistory = [errorTranslation, ...filteredHistory];
        const updatedHistory = newHistory.slice(0, 30);
        saveTranslationHistory(updatedHistory);
        return updatedHistory;
      });
    } finally {
      setIsTranslating(false);
    }
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
        const updatedHistory = newHistory.slice(0, 30);
        // 保存到本地存储
        saveTranslationHistory(updatedHistory);
        return updatedHistory;
      });

      // 自动播放语音翻译结果
      if (autoPlayVoiceTranslation) {
        AutoPlayService.playTranslationByType(
          result.translatedText,
          actualToLanguage,
          'voice',
          {
            autoPlayVoiceTranslation,
            autoPlayTextTranslation: false,
          }
        );
      }
      
    } catch (error) {
      console.error('翻译失败:', error);
      
      // 显示错误信息
      const errorMessage = error instanceof Error ? error.message : t('errors.translationError', '翻译失败，请检查网络连接');
      Alert.alert(t('errors.translationError', '翻译错误'), errorMessage);
      
      // 如果翻译失败，仍然添加一个错误记录到历史中
      const errorTranslation = {
        id: Date.now().toString(),
        source: sourceText,
        target: t('voice.translationFailed', '翻译失败，请重试'),
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
    console.log('🔄 语言切换前:', { fromLanguage, toLanguage });
    setFromLanguage(toLanguage);
    setToLanguage(temp);
    console.log('🔄 语言切换后:', { fromLanguage: toLanguage, toLanguage: temp });
  };

  const getLanguageName = (code: string) => {
    return getLanguageDisplayName(code);
  };

  const formatTime = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const diffMinutes = Math.floor(diff / (1000 * 60));
    const diffHours = Math.floor(diff / (1000 * 60 * 60));
    const diffDays = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (diffMinutes < 1) {
      return t('history.justNow', '刚刚');
    } else if (diffMinutes < 60) {
      return t('history.minutesAgo', { count: diffMinutes, defaultValue: `${diffMinutes}分钟前` });
    } else if (diffHours < 24) {
      return t('history.hoursAgo', { count: diffHours, defaultValue: `${diffHours}小时前` });
    } else if (diffDays < 7) {
      return t('history.daysAgo', { count: diffDays, defaultValue: `${diffDays}天前` });
    } else {
      return timestamp.toLocaleDateString();
    }
  };


  const copyToClipboard = async (text: string) => {
    try {
      await Clipboard.setStringAsync(text);
      setToastMessage(t('common.copied', '已复制到剪贴板'));
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2000);
    } catch (error) {
      console.error('复制失败:', error);
      Alert.alert(t('common.copyFailed', '复制失败'), t('voice.copyPermissionError', '无法复制文本，请检查权限设置'));
    }
  };

  const deleteTranslation = (id: string) => {
    Alert.alert(
      t('voice.deleteTranslation', '删除翻译'),
      t('voice.confirmDelete', '确定要删除这条翻译记录吗？'),
      [
        {
          text: t('common.cancel', '取消'),
          style: 'cancel',
        },
        {
          text: t('common.delete', '删除'),
          style: 'destructive',
          onPress: () => {
            setTranslationHistory(prev => {
              const updatedHistory = prev.filter(item => item.id !== id);
              // 保存到本地存储
              saveTranslationHistory(updatedHistory);
              return updatedHistory;
            });
          },
        },
      ]
    );
  };

  const playTranslation = async (text: string, language: string, itemId: string) => {
    try {
      // 如果正在播放同一个项目，则停止播放
      if (playingItemId === itemId) {
        console.log('⏹️ 停止播放');
        Speech.stop();
        setPlayingItemId(null);
        setIsPaused(false);
        return;
      }

      console.log('🎵 开始播放翻译:', { text, language, itemId });
      
      // 停止当前播放
      if (playingItemId) {
        Speech.stop();
      }
      
      // 设置播放状态
      setPlayingItemId(itemId);
      setIsPaused(false);
      
      // 使用系统TTS播放
      console.log('🔊 手动播放：使用系统TTS');
      await speakTranslation(text, language);
      console.log('✅ 语音播放完成');
      
    } catch (error) {
      console.error('❌ 播放失败:', error);
    } finally {
      console.log('🛑 停止播放');
      setPlayingItemId(null);
      setIsPaused(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <TouchableOpacity
              style={styles.menuButton}
              onPress={() => router.push('/settings')}
            >
              <Menu size={24} color={colors.textSecondary} />
            </TouchableOpacity>
            <Text style={[styles.title, { color: colors.text }]}>{t('voice.title', '语音翻译')}</Text>
            <View style={styles.placeholder} />
          </View>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {t('voice.subtitle', '分别录制两种语言进行对比翻译')}
          </Text>
          
          {/* 离线模式提示 */}
          {isOfflineMode && (
            <View style={styles.offlineIndicator}>
              <Text style={styles.offlineText}>
                📱 {t('voice.offlineMode', '离线模式')}
              </Text>
              <Text style={styles.offlineSubtext}>
                {t('voice.offlineVoiceNotSupported', '语音识别需要网络连接，请切换到在线模式')}
              </Text>
            </View>
          )}
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
                // 原文使用第一个语音按钮颜色，翻译结果使用第二个语音按钮颜色
                const originalColor = item.buttonColor === 'cyan' ? colors.voiceButton1 : colors.voiceButton2;
                const translatedColor = item.buttonColor === 'cyan' ? colors.voiceButton2 : colors.voiceButton1;
                return (
                  <View key={item.id} style={[styles.translationCard, { backgroundColor: colors.card }]}>
                    <View style={styles.itemHeader}>
                      <View style={styles.languagePair}>
                        <Text style={[styles.languageText, { color: originalColor }]}>
                          {getLanguageName(item.fromLanguage)}
                        </Text>
                        <Text style={[styles.languageText, { color: colors.textSecondary }]}> → </Text>
                        <Text style={[styles.languageText, { color: translatedColor }]}>
                          {getLanguageName(item.toLanguage)}
                        </Text>
                        <Text style={[styles.timeText, { color: colors.textSecondary, marginLeft: 8 }]}>
                          • {formatTime(item.timestamp)}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.textSection}>
                      <View style={styles.textBlock}>
                        <Text style={[styles.textLabel, { color: colors.textSecondary }]}>
                          {t('voice.original', '原文')}
                        </Text>
                        <Text style={[styles.originalText, { color: originalColor }]}>
                          {item.source}
                        </Text>
                      </View>
                      <View style={[styles.divider, { backgroundColor: colors.border }]} />
                      <View style={styles.textBlock}>
                        <Text style={[styles.textLabel, { color: colors.textSecondary }]}>
                          {t('voice.translated', '译文')}
                        </Text>
                        <Text style={[styles.translatedText, { color: translatedColor }]}>
                          {item.target}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.actionBar}>
                      <TouchableOpacity 
                        style={styles.actionButton}
                        onPress={() => playTranslation(item.target, item.toLanguage, item.id)}
                      >
                        <SpeakButton
                          isSpeaking={playingItemId === item.id}
                          size={18}
                          color={translatedColor}
                          activeColor={translatedColor}
                          disabled={false}
                        />
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={styles.actionButton}
                        onPress={() => copyToClipboard(item.target)}
                      >
                        <Copy size={18} color={colors.textSecondary} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => deleteTranslation(item.id)}
                      >
                        <Trash2 size={18} color={colors.error} />
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
                  {t('voice.tapToRecord', '请点击底部录音按钮进行翻译')}
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
          <TouchableOpacity 
            style={[styles.languageBox, { backgroundColor: '#374151' }]}
            onPress={openSourceLanguageModal}
          >
            <Text style={[styles.languageText, { color: '#FFFFFF' }]}>{getLanguageDisplayName(fromLanguage)}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.swapButton}
            onPress={swapLanguages}
          >
            <ArrowUpDown size={24} color={colors.primary} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.languageBox, { backgroundColor: '#374151' }]}
            onPress={openTargetLanguageModal}
          >
            <Text style={[styles.languageText, { color: '#FFFFFF' }]}>{getLanguageDisplayName(toLanguage)}</Text>
          </TouchableOpacity>
        </View>

            {/* Recording Buttons - 按住录音方式 */}
            <View style={[styles.dualButtonContainer, { marginTop: 5 }]}>
                {/* 源语言录音按钮 */}
                <View style={styles.recordButtonContainer}>
                  {/* 粒子效果 - 8个小光点 */}
                  {sourceParticles.map((particle, index) => {
                    const angle = (index * 45) * (Math.PI / 180); // 每个粒子间隔45度
                    const radius = 60; // 粒子距离中心的距离
                    const x = Math.cos(angle) * radius;
                    const y = Math.sin(angle) * radius;
                    
                    return (
                      <Animated.View
                        key={index}
                        style={[
                          styles.recordButtonParticle,
                          {
                            backgroundColor: colors.voiceButton1,
                            opacity: particle,
                            transform: [
                              { translateX: x },
                              { translateY: y },
                              { scale: particle }
                            ],
                          }
                        ]}
                      />
                    );
                  })}
                  <TouchableOpacity
                    style={[
                      styles.dualRecordButton,
                      { backgroundColor: colors.voiceButton1 }, // 使用主题中的语音按钮颜色
                      isPressing === 'source' && { transform: [{ scale: 0.95 }] }
                    ]}
                    onPressIn={() => handleRecordingPress('source')}
                    onPressOut={() => handleRecordingRelease('source')}
                    activeOpacity={0.8}
                  >
                    <Animated.View
                      style={{
                        transform: [{ scale: sourcePulseAnim }],
                      }}
                    >
                      <Mic size={32} color="#FFFFFF" />
                    </Animated.View>
                  </TouchableOpacity>
                </View>

                {/* 目标语言录音按钮 */}
                <View style={styles.recordButtonContainer}>
                  {/* 粒子效果 - 8个小光点 */}
                  {targetParticles.map((particle, index) => {
                    const angle = (index * 45) * (Math.PI / 180); // 每个粒子间隔45度
                    const radius = 60; // 粒子距离中心的距离
                    const x = Math.cos(angle) * radius;
                    const y = Math.sin(angle) * radius;
                    
                    return (
                      <Animated.View
                        key={index}
                        style={[
                          styles.recordButtonParticle,
                          {
                            backgroundColor: colors.voiceButton2,
                            opacity: particle,
                            transform: [
                              { translateX: x },
                              { translateY: y },
                              { scale: particle }
                            ],
                          }
                        ]}
                      />
                    );
                  })}
                  <TouchableOpacity
                    style={[
                      styles.dualRecordButton,
                      { backgroundColor: colors.voiceButton2 }, // 使用主题中的语音按钮颜色
                      isPressing === 'target' && { transform: [{ scale: 0.95 }] }
                    ]}
                    onPressIn={() => handleRecordingPress('target')}
                    onPressOut={() => handleRecordingRelease('target')}
                    activeOpacity={0.8}
                  >
                    <Animated.View
                      style={{
                        transform: [{ scale: targetPulseAnim }],
                      }}
                    >
                      <Mic size={32} color="#FFFFFF" />
                    </Animated.View>
                  </TouchableOpacity>
                </View>
            </View>
            
            
          </View>
          
          {/* Toast提示 */}
          {showToast && (
            <View style={styles.toastContainer}>
              <Text style={styles.toastText}>{toastMessage}</Text>
            </View>
          )}
      </SafeAreaView>

      {/* 🎯 语言选择模态框 */}
      <Modal
        visible={showLanguageModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowLanguageModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {selectingLanguageType === 'source' ? t('language.selectSource', '选择源语言') : t('language.selectTarget', '选择目标语言')}
              </Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowLanguageModal(false)}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.languageList}>
              {SUPPORTED_LANGUAGES
                .filter((lang) => {
                  // 源语言：不包含Auto Detect（语音翻译需要明确语言）
                  // 目标语言：不包含Auto Detect
                  return lang.code !== 'auto';
                })
                .map((lang) => (
                <TouchableOpacity
                  key={lang.code}
                  style={[
                    styles.languageItem,
                    (selectingLanguageType === 'source' ? fromLanguage : toLanguage) === lang.code && 
                    styles.languageItemSelected
                  ]}
                  onPress={() => handleSelectLanguage(lang.code)}
                >
                  <Text style={styles.languageItemText} numberOfLines={1}>
                    {lang.flag} {lang.nativeName}
                  </Text>
                  {(selectingLanguageType === 'source' ? fromLanguage : toLanguage) === lang.code && (
                    <Text style={styles.languageItemCheck}>✓</Text>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  menuButton: {
    padding: 8,
  },
  placeholder: {
    width: 40, // 占位符，保持标题居中
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
  offlineIndicator: {
    backgroundColor: '#EF4444', // ✅ 红色警示
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    marginTop: 12,
    marginHorizontal: 20,
    alignItems: 'center',
  },
  offlineText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  offlineSubtext: {
    color: '#FFFFFF',
    fontSize: 12,
    opacity: 0.9,
    textAlign: 'center',
    fontWeight: '600',
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
    paddingBottom: 150, // 增加滚动范围，为底部导航栏预留更多空间
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
  textBlock: {
    marginBottom: 4,
  },
  textLabel: {
    fontSize: 12,
    marginBottom: 4,
    fontWeight: '500',
  },
  originalText: {
    fontSize: 15,
    lineHeight: 22,
  },
  divider: {
    height: 1,
    marginVertical: 12,
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
  recordButtonContainer: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordButtonParticle: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    opacity: 0.8,
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
  // Language Picker Modal Styles
  modalCloseButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  toastContainer: {
    position: 'absolute',
    top: '50%',
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    transform: [{ translateY: -30 }],
    zIndex: 1,
  },
  toastText: {
    color: '#FFFFFF',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  // 🎯 语言选择模态框样式
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1F2937',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: 'white',
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalCloseText: {
    fontSize: 20,
    color: 'white',
    fontWeight: '600',
  },
  languageList: {
    paddingHorizontal: 20,
  },
  languageItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  languageItemSelected: {
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    borderRadius: 8,
  },
  languageItemText: {
    fontSize: 16,
    color: 'white',
    fontWeight: '500',
    flex: 1,
  },
  languageItemCheck: {
    fontSize: 20,
    color: '#3B82F6',
    fontWeight: '600',
  },
});