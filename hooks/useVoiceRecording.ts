import { useState, useRef, useCallback, useEffect } from 'react';
import { Audio } from 'expo-av';
import { Animated, AppState } from 'react-native';
import * as Speech from 'expo-speech';

/**
 * 语音录音管理的自定义Hook
 * 
 * 功能：
 * - 管理录音状态（开始/停止录音）
 * - 处理录音动画效果（脉冲和粒子动画）
 * - 自动清理录音资源
 * - 处理应用状态变化（后台/前台切换）
 * 
 * @param isFocused - 页面是否获得焦点
 * @param onRecordingComplete - 录音完成回调函数
 */
interface UseVoiceRecordingProps {
  isFocused: boolean;
  onRecordingComplete: (text: string, type: 'source' | 'target') => void;
}

export function useVoiceRecording({ isFocused, onRecordingComplete }: UseVoiceRecordingProps) {
  // 录音状态
  const [sourceRecording, setSourceRecording] = useState<Audio.Recording | null>(null);
  const [targetRecording, setTargetRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState<'source' | 'target' | null>(null);
  const [isRecordingInProgress, setIsRecordingInProgress] = useState(false);
  const [isPressing, setIsPressing] = useState<'source' | 'target' | null>(null);
  const pressingRef = useRef<'source' | 'target' | null>(null);
  
  // 动画状态
  const sourcePulseAnim = useRef(new Animated.Value(1)).current;
  const targetPulseAnim = useRef(new Animated.Value(1)).current;
  const sourceParticles = Array.from({ length: 8 }, () => useRef(new Animated.Value(0)).current);
  const targetParticles = Array.from({ length: 8 }, () => useRef(new Animated.Value(0)).current);
  
  // 动画实例引用
  const sourcePulseAnimationRef = useRef<Animated.CompositeAnimation | null>(null);
  const targetPulseAnimationRef = useRef<Animated.CompositeAnimation | null>(null);
  const sourceParticleAnimationsRef = useRef<Animated.CompositeAnimation[]>([]);
  const targetParticleAnimationsRef = useRef<Animated.CompositeAnimation[]>([]);
  
  // 清理状态标记
  const isCleaning = useRef(false);

  /**
   * 开始录音动画效果
   * 创建脉冲动画和粒子效果，提供视觉反馈
   * 
   * @param type - 录音类型（源语言或目标语言）
   */
  const startRecordingAnimation = useCallback((type: 'source' | 'target') => {
    const pulseAnim = type === 'source' ? sourcePulseAnim : targetPulseAnim;
    const particles = type === 'source' ? sourceParticles : targetParticles;
    const pulseAnimationRef = type === 'source' ? sourcePulseAnimationRef : targetPulseAnimationRef;
    const particleAnimationsRef = type === 'source' ? sourceParticleAnimationsRef : targetParticleAnimationsRef;
    
    // 先停止之前的动画
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
    
    // 粒子动画
    particles.forEach((particle, index) => {
      const delay = index * 200;
      
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
  }, [sourcePulseAnim, targetPulseAnim, sourceParticles, targetParticles]);

  /**
   * 停止录音动画效果
   * 清理所有动画实例并重置到初始状态
   * 
   * @param type - 录音类型（源语言或目标语言）
   */
  const stopRecordingAnimation = useCallback((type: 'source' | 'target') => {
    const pulseAnim = type === 'source' ? sourcePulseAnim : targetPulseAnim;
    const particles = type === 'source' ? sourceParticles : targetParticles;
    const pulseAnimationRef = type === 'source' ? sourcePulseAnimationRef : targetPulseAnimationRef;
    const particleAnimationsRef = type === 'source' ? sourceParticleAnimationsRef : targetParticleAnimationsRef;
    
    // 停止所有动画实例
    if (pulseAnimationRef.current) {
      pulseAnimationRef.current.stop();
      pulseAnimationRef.current = null;
    }
    
    particleAnimationsRef.current.forEach((animation) => {
      if (animation) {
        animation.stop();
      }
    });
    particleAnimationsRef.current = [];
    
    // 停止 Animated.Value 的当前动画
    pulseAnim.stopAnimation();
    particles.forEach(particle => particle.stopAnimation());
    
    // 重置到初始状态
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
  }, [sourcePulseAnim, targetPulseAnim, sourceParticles, targetParticles]);

  /**
   * 开始录音
   * 请求权限、设置音频模式、创建录音实例
   * 
   * @param type - 录音类型（源语言或目标语言）
   */
  const startRecording = useCallback(async (type: 'source' | 'target') => {
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
  }, [isRecordingInProgress, startRecordingAnimation]);

  // 停止录音
  const stopRecording = useCallback(async (type: 'source' | 'target') => {
    if (!isRecording || isRecording !== type) {
      return;
    }

    const currentRecording = type === 'source' ? sourceRecording : targetRecording;
    
    // 立即清理UI状态
    setIsRecording(null);
    setIsRecordingInProgress(false);
    stopRecordingAnimation(type);
    
    if (!currentRecording) {
      return;
    }
    
    try {
      const status = await currentRecording.getStatusAsync();
      if (!status.isRecording) {
        return;
      }

      await currentRecording.stopAndUnloadAsync();
      const uri = currentRecording.getURI();

      if (uri) {
        // 调用完成回调
        onRecordingComplete(uri, type);
      }
    } catch (err) {
      console.warn("停止录音时出错:", err);
    } finally {
      // 清理录音实例
      if (type === 'source') {
        setSourceRecording(null);
      } else {
        setTargetRecording(null);
      }
    }
  }, [isRecording, sourceRecording, targetRecording, stopRecordingAnimation, onRecordingComplete]);

  // 处理录音按钮按下
  const handleRecordingPress = useCallback(async (type: 'source' | 'target') => {
    // 如果正在录音这个按钮，则停止录音
    if (isRecording === type) {
      await stopRecording(type);
      setIsPressing(null);
      pressingRef.current = null;
      return;
    }
    
    // 如果正在按压其他按钮，先停止
    if (pressingRef.current && pressingRef.current !== type) {
      pressingRef.current = null;
    }
    
    // 设置按压状态
    setIsPressing(type);
    pressingRef.current = type;
    
    // 延迟300ms后开始录音
    setTimeout(async () => {
      if (pressingRef.current === type) {
        await startRecording(type);
      }
    }, 300);
  }, [isRecording, stopRecording, startRecording]);

  // 处理录音按钮松开
  const handleRecordingRelease = useCallback(async (type: 'source' | 'target') => {
    // 清除按压状态
    setIsPressing(null);
    pressingRef.current = null;
    
    // 如果正在录音这个按钮，则停止录音
    if (isRecording === type) {
      await stopRecording(type);
    }
  }, [isRecording, stopRecording]);

  // 清理录音资源
  const cleanupRecording = useCallback(async () => {
    if (isCleaning.current) {
      return;
    }
    
    isCleaning.current = true;
    
    try {
      // 停止语音播报
      Speech.stop();
      
      // 清理所有录音状态
      const cleanupRecordingInstance = async (recording: Audio.Recording | null) => {
        if (recording) {
          try {
            const status = await recording.getStatusAsync();
            if (status.isRecording) {
              await recording.stopAndUnloadAsync();
            }
          } catch (error) {
            if (!(error instanceof Error && error.message?.includes('Recorder does not exist'))) {
              console.warn('清理录音资源时出错:', error);
            }
          }
        }
      };
      
      await Promise.all([
        cleanupRecordingInstance(sourceRecording),
        cleanupRecordingInstance(targetRecording)
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
    } catch (error) {
      console.error('清理录音资源时出错:', error);
    } finally {
      isCleaning.current = false;
    }
  }, [sourceRecording, targetRecording, stopRecordingAnimation]);

  // AppState 监听器
  useEffect(() => {
    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === 'background' || nextAppState === 'inactive') {
        Speech.stop();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    return () => {
      subscription?.remove();
    };
  }, []);

  // 页面失去焦点时停止录音
  useEffect(() => {
    if (!isFocused) {
      const timer = setTimeout(() => {
        if (isRecording) {
          stopRecording(isRecording);
        }
        Speech.stop();
      }, 200);
      
      return () => clearTimeout(timer);
    }
  }, [isFocused, isRecording, stopRecording]);

  // 组件卸载时清理所有资源
  useEffect(() => {
    return () => {
      cleanupRecording();
    };
  }, [cleanupRecording]);

  return {
    // 状态
    isRecording,
    isPressing,
    sourceRecording,
    targetRecording,
    
    // 动画值
    sourcePulseAnim,
    targetPulseAnim,
    sourceParticles,
    targetParticles,
    
    // 方法
    handleRecordingPress,
    handleRecordingRelease,
    cleanupRecording,
  };
}
