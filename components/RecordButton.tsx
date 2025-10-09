import React, { useState } from "react";
import { View, Text, Pressable, Alert, StyleSheet } from "react-native";
import { Audio } from "expo-av";
import { Mic } from "lucide-react-native";
import { convertToWhisperLanguageCode } from "../utils/languageCodeConverter";
import { API_CONFIG } from "../config/environment";
import { useI18n } from "../contexts/I18nContext";

interface RecordButtonProps {
  language: string; // 录音语言
  onRecordingComplete: (text: string) => void; // 录音完成回调
  onRecordingStart?: () => void; // 录音开始回调
  onRecordingStop?: () => void; // 录音停止回调
  disabled?: boolean; // 是否禁用
  buttonColor?: string; // 按钮颜色
  textColor?: string; // 文字颜色
}

export default function RecordButton({
  language,
  onRecordingComplete,
  onRecordingStart,
  onRecordingStop,
  disabled = false,
  buttonColor = "#007AFF",
  textColor = "white"
}: RecordButtonProps) {
  const { t } = useI18n();
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');


  // 开始录音
  const startRecording = async () => {
    if (disabled) return;
    
    try {
      console.log("🎤 开始录音...", "语言:", language);
      
      // 请求录音权限
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status !== 'granted') {
        Alert.alert(t('common.error'), t('voice.permissionDenied'));
        return;
      }

      // 设置音频模式
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      // 创建录音 - 使用最高质量配置，确保稳定性
      const { recording } = await Audio.Recording.createAsync({
        ...Audio.RecordingOptionsPresets.HIGH_QUALITY,
        // 启用音量检测
        isMeteringEnabled: true,
      });
      
      setRecording(recording);
      setIsRecording(true);
      onRecordingStart?.();
      
      console.log("✅ 录音已开始");
    } catch (err) {
      console.error("❌ 录音启动失败:", err);
      Alert.alert(t('common.error'), t('voice.permissionRequired'));
    }
  };

  // 停止录音并上传
  const stopRecording = async () => {
    if (!recording || !isRecording) {
      return;
    }
    
    console.log("🛑 结束录音");
    const currentRecording = recording;
    setIsRecording(false);
    onRecordingStop?.();
    
    try {
      const status = await currentRecording.getStatusAsync();
      if (!status.isRecording) {
        console.log("⚠️ 已经停止录音了，跳过 stop");
        setRecording(null);
        return;
      }
      await currentRecording.stopAndUnloadAsync();
      const uri = currentRecording.getURI();

      if (!uri) {
        throw new Error('录音文件URI为空');
      }

      // 检查录音时长和音量，如果太短或音量太低就不进行翻译
      const durationStatus = await currentRecording.getStatusAsync();
      if (durationStatus.durationMillis && durationStatus.durationMillis < 600) {
        console.log("⚠️ 录音时间太短，跳过翻译");
        setRecording(null);
        return;
      }
      
      // 检查录音音量
      // 注意：metering 需要 isMeteringEnabled: true 才会有效
      const volume = durationStatus.metering;
      console.log("🔊 录音音量检测:", { volume });
      
      if (volume !== undefined) {
        // 设置合理的音量阈值，过滤噪音但保留人声
        if (volume < -30) { // 音量低于-30dB（过滤噪音，保留轻声说话）
          console.log("⚠️ 录音音量太低，跳过翻译", { volume });
          setRecording(null);
          // 显示自动消失的友好提示
          setToastMessage(t('voice.noVoiceDetected'));
          setShowToast(true);
          
          // 4秒后自动关闭提示
          setTimeout(() => {
            setShowToast(false);
          }, 4000);
          return;
        }
      } else {
        // 如果音量检测未启用，使用时长作为备用检查
        console.log("⚠️ 音量检测未启用，使用时长检查");
        // 如果录音时间很短（小于1秒），可能是误触
        if (durationStatus.durationMillis && durationStatus.durationMillis < 1000) {
          console.log("⚠️ 录音时间太短，可能是误触，跳过翻译");
          setRecording(null);
          return;
        }
      }

      // 转换语言代码
      const whisperLanguageCode = convertToWhisperLanguageCode(language);

      // 创建FormData
      const formData = new FormData();
      formData.append("file", {
        uri,
        type: "audio/m4a",
        name: "recording.m4a",
      } as any);
      formData.append("language", whisperLanguageCode);
      formData.append("model", "whisper-1");

      console.log("📤 发送语音识别请求:", {
        uri,
        language: whisperLanguageCode,
        formDataKeys: ['file', 'language', 'model']
      });

      // 立即显示处理状态
      onRecordingComplete("...");

      // 上传到语音识别 API（异步处理，不阻塞UI）
      fetch(`${API_CONFIG.BASE_URL}/api/speech-to-text`, {
        method: "POST",
        body: formData,
        // 不设置Content-Type，让浏览器自动设置multipart/form-data边界
      })
      .then(async (res) => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        const result = await res.json();
        if (result.success && result.data?.text) {
          const recognizedText = result.data.text.trim();
          console.log("语音识别结果:", recognizedText);
          
          // 检查识别到的文本是否有效
          if (recognizedText.length < 2 || 
              recognizedText === '...' || 
              recognizedText.toLowerCase().includes('thank you for watching') ||
              recognizedText.toLowerCase().includes('谢谢观看') ||
              recognizedText.toLowerCase().includes('thanks for watching')) {
            console.log("⚠️ 识别到的文本无效，跳过翻译");
            onRecordingComplete("录音无效，请重新录音");
            return;
          }
          
          onRecordingComplete(recognizedText);
        } else {
          throw new Error(result.error?.message || '语音识别失败');
        }
      })
      .catch((err) => {
        console.error("❌ 语音识别失败:", err);
        // 直接显示错误信息，不进行翻译
        onRecordingComplete(t('errors.networkError'));
      });

    } catch (err) {
      console.error("❌ 停止录音失败:", err);
    } finally {
      setRecording(null);
    }
  };

  return (
    <View style={styles.container}>
      <Pressable
        onPressIn={startRecording}
        onPressOut={stopRecording}
        disabled={disabled}
        style={({ pressed }) => [
          styles.recordButton,
          {
            backgroundColor: isRecording ? "#FF6B6B" : buttonColor,
            opacity: disabled ? 0.5 : 1,
            transform: [{ scale: pressed ? 0.95 : 1 }],
          }
        ]}
      >
        <View style={styles.buttonContent}>
          <Mic size={24} color={textColor} />
          <Text style={[styles.buttonText, { color: textColor }]}>
            {t('voice.holdToSpeak')}
          </Text>
        </View>
      </Pressable>
      
      {/* Toast提示 */}
      {showToast && (
        <View style={styles.toastContainer}>
          <Text style={styles.toastText}>{toastMessage}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
  },
  recordButton: {
    padding: 20,
    borderRadius: 50,
    minWidth: 120,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  buttonContent: {
    alignItems: "center",
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: 4,
  },
  toastContainer: {
    position: 'absolute',
    top: -80,
    left: -80,
    right: -80,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
    zIndex: 1,
  },
  toastText: {
    color: '#FFFFFF',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
  },
});
