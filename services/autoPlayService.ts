import { getLanguageFullDisplayName } from '@/constants/languages';
import { playTTS } from './ttsService';

export interface AutoPlayOptions {
  autoPlayVoiceTranslation: boolean;
  autoPlayTextTranslation: boolean;
}

export class AutoPlayService {
  /**
   * 自动播放语音翻译结果
   * @param translatedText 翻译结果文本
   * @param targetLanguage 目标语言代码
   * @param options 自动播放选项
   */
  static async playVoiceTranslation(
    translatedText: string,
    targetLanguage: string,
    options: AutoPlayOptions
  ): Promise<void> {
    if (!options.autoPlayVoiceTranslation) {
      return;
    }

    try {
      console.log(`🎤 播放语音翻译结果: "${translatedText}" (${targetLanguage})`);
      
      // 调用实际的TTS服务播放语音翻译结果
      await playTTS(translatedText, targetLanguage);
    } catch (error) {
      console.error('播放语音翻译结果失败:', error);
    }
  }

  /**
   * 自动播放文本翻译结果
   * @param translatedText 翻译结果文本
   * @param targetLanguage 目标语言代码
   * @param options 自动播放选项
   */
  static async playTextTranslation(
    translatedText: string,
    targetLanguage: string,
    options: AutoPlayOptions
  ): Promise<void> {
    if (!options.autoPlayTextTranslation) {
      return;
    }

    try {
      console.log(`📝 朗读文本翻译结果: "${translatedText}" (${targetLanguage})`);
      
      // 调用实际的TTS服务朗读文本翻译结果
      await playTTS(translatedText, targetLanguage);
    } catch (error) {
      console.error('朗读文本翻译结果失败:', error);
    }
  }

  /**
   * 根据翻译类型播放对应的翻译结果
   * @param translatedText 翻译结果文本
   * @param targetLanguage 目标语言代码
   * @param translationType 翻译类型 ('voice' | 'text')
   * @param options 自动播放选项
   */
  static async playTranslationByType(
    translatedText: string,
    targetLanguage: string,
    translationType: 'voice' | 'text',
    options: AutoPlayOptions
  ): Promise<void> {
    try {
      if (translationType === 'voice') {
        await this.playVoiceTranslation(translatedText, targetLanguage, options);
      } else if (translationType === 'text') {
        await this.playTextTranslation(translatedText, targetLanguage, options);
      }
    } catch (error) {
      console.error('播放翻译结果失败:', error);
    }
  }

  /**
   * 检查是否启用了任何自动播放功能
   * @param options 自动播放选项
   * @returns 是否启用了自动播放
   */
  static isAutoPlayEnabled(options: AutoPlayOptions): boolean {
    return options.autoPlayVoiceTranslation || options.autoPlayTextTranslation;
  }

  /**
   * 获取自动播放状态描述
   * @param options 自动播放选项
   * @returns 状态描述文本
   */
  static getAutoPlayStatusDescription(options: AutoPlayOptions): string {
    const features: string[] = [];
    
    if (options.autoPlayVoiceTranslation) {
      features.push('语音翻译');
    }
    
    if (options.autoPlayTextTranslation) {
      features.push('文本翻译');
    }

    if (features.length === 0) {
      return '自动播放已关闭';
    }

    return `自动播放: ${features.join(' + ')}`;
  }
}
