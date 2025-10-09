// 离线语音服务 - TTS功能
import * as Speech from 'expo-speech';

export interface OfflineVoiceResult {
  success: boolean;
  text?: string;
  confidence?: number;
  error?: string;
}

class OfflineVoiceService {
  /**
   * 离线语音识别 - 不支持，返回错误提示
   */
  async speechToText(audioUri: string, language: string): Promise<OfflineVoiceResult> {
    console.log('⚠️ 离线语音识别不可用');
    return {
      success: false,
      error: '语音识别需要网络连接才能使用',
    };
  }


  /**
   * 离线文本转语音（使用设备原生TTS）
   */
  async textToSpeech(text: string, language: string): Promise<OfflineVoiceResult> {
    try {
      console.log('🔊 开始离线语音合成:', { text, language });

      // 检查 Speech 是否可用
      if (!Speech || typeof Speech.speak !== 'function') {
        console.warn('⚠️ Speech API 不可用，使用降级方案');
        // 降级方案：返回成功但不播放，避免阻塞流程
        return {
          success: true,
          text: text,
        };
      }

      // 使用 Expo Speech（基于设备原生TTS）
      await new Promise<void>((resolve, reject) => {
        Speech.speak(text, {
          language: this.getTTSLanguageCode(language),
          pitch: 1.0,
          rate: 0.8,
          onDone: () => {
            console.log('✅ 离线语音合成完成');
            resolve();
          },
          onStopped: () => {
            console.log('⏹️ 离线语音合成被停止');
            resolve();
          },
          onError: (error: Error) => {
            console.error('❌ 离线语音合成失败:', error);
            reject(error);
          },
        });
      });

      return {
        success: true,
        text: text,
      };
    } catch (error) {
      console.error('❌ 离线语音合成失败:', error);
      // 降级方案：即使TTS失败，也返回成功，避免阻塞翻译流程
      return {
        success: true,
        text: text,
      };
    }
  }

  /**
   * 完整的离线语音翻译流程
   */
  async translateVoice(
    audioUri: string,
    sourceLanguage: string,
    targetLanguage: string
  ): Promise<{
    success: boolean;
    sourceText?: string;
    translatedText?: string;
    error?: string;
  }> {
    try {
      console.log('🎯 开始离线语音翻译流程:', { sourceLanguage, targetLanguage });

      // 1. 语音识别
      const speechResult = await this.speechToText(audioUri, sourceLanguage);
      if (!speechResult.success || !speechResult.text) {
        return {
          success: false,
          error: speechResult.error || '语音识别失败',
        };
      }

      // 2. 文本翻译 - 使用统一的离线翻译服务
      const { offlineTranslationService } = await import('./offlineTranslationService');
      const translationResult = await offlineTranslationService.translateOffline(
        speechResult.text,
        sourceLanguage,
        targetLanguage
      );

      if (translationResult.success && translationResult.translatedText) {
        console.log(`✅ 离线语音翻译完成: "${speechResult.text}" → "${translationResult.translatedText}"`);
        
        return {
          success: true,
          sourceText: speechResult.text,
          translatedText: translationResult.translatedText,
        };
      } else {
        throw new Error(translationResult.error || '离线文本翻译失败');
      }
    } catch (error) {
      console.error('❌ 离线语音翻译失败:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '语音翻译失败',
      };
    }
  }

  /**
   * 将语言代码转换为TTS支持的语言代码
   */
  private getTTSLanguageCode(language: string): string {
    const ttsLanguageMap: Record<string, string> = {
      'en': 'en-US',
      'zh-CN': 'zh-CN',
      'zh-TW': 'zh-TW',
      'ja': 'ja-JP',
      'ko': 'ko-KR',
      'fr': 'fr-FR',
      'de': 'de-DE',
      'es': 'es-ES',
      'it': 'it-IT',
      'pt': 'pt-PT',
      'ru': 'ru-RU',
      'ar': 'ar-SA',
      'hi': 'hi-IN',
      'th': 'th-TH',
      'vi': 'vi-VN',
    };

    return ttsLanguageMap[language] || 'en-US';
  }

  /**
   * 检查离线语音识别功能是否可用
   */
  isOfflineVoiceAvailable(): boolean {
    // 离线语音识别不可用
    return false;
  }
}

export const offlineVoiceService = new OfflineVoiceService();
