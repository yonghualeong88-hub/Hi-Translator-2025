import { NativeModules } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { mapToMlKitLangCode, mapFromMlKitLangCode } from '@/utils/mlKitLanguageMapper';

interface TranslationResult {
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string;
}

interface LanguagePack {
  code: string;
  name: string;
  size: number; // MB
}

export const SUPPORTED_LANGUAGES: Record<string, LanguagePack> = {
  en: { code: 'en', name: 'English', size: 20 },
  'zh-CN': { code: 'zh-CN', name: 'Chinese (Simplified)', size: 25 },
  ja: { code: 'ja', name: 'Japanese', size: 22 },
  ko: { code: 'ko', name: 'Korean', size: 21 },
  fr: { code: 'fr', name: 'French', size: 20 },
  es: { code: 'es', name: 'Spanish', size: 20 },
  ru: { code: 'ru', name: 'Russian', size: 23 },
  ar: { code: 'ar', name: 'Arabic', size: 24 },
  de: { code: 'de', name: 'German', size: 21 },
  it: { code: 'it', name: 'Italian', size: 20 },
  pt: { code: 'pt', name: 'Portuguese', size: 21 },
  hi: { code: 'hi', name: 'Hindi', size: 22 },
};

export class MLKitTranslationService {
  private nativeModule: any;

  constructor() {
    // 统一取模块，不分 iOS/Android
    this.nativeModule = NativeModules.MLKitTranslationModule;
  }

  async isLanguageDownloaded(languageCode: string): Promise<boolean> {
    // 🚀 直接从 AsyncStorage 读取，避免循环依赖
    try {
      // ✅ 先转换为 ML Kit 语言码
      const mlKitCode = mapToMlKitLangCode(languageCode);
      
      const downloaded = await AsyncStorage.getItem('downloaded_language_packs');
      if (!downloaded) return false;
      const downloadedList = JSON.parse(downloaded);
      
      // ✅ 检查时也要映射
      return downloadedList.some((code: string) => mapToMlKitLangCode(code) === mlKitCode);
    } catch (error) {
      console.warn('[MLKitTranslationService] isLanguageDownloaded failed:', error);
      return false;
    }
  }

  async downloadLanguagePack(languageCode: string): Promise<boolean> {
    if (this.nativeModule?.downloadLanguagePack) {
      // ✅ 转换为 ML Kit 语言码
      const mlKitCode = mapToMlKitLangCode(languageCode);
      console.log(`🔄 下载语言包: ${languageCode} → ML Kit: ${mlKitCode}`);
      
      const result = await this.nativeModule.downloadLanguagePack(mlKitCode);
      if (result) {
        // ✅ 存储时使用 ML Kit 码（保持统一）
        const { translationModeManager } = await import('./translationModeManager');
        await translationModeManager.addDownloadedLanguagePack(mlKitCode);
      }
      return result;
    }
    return false;
  }

  async removeLanguagePack(languageCode: string): Promise<boolean> {
    if (this.nativeModule?.removeLanguagePack) {
      // ✅ 转换为 ML Kit 语言码
      const mlKitCode = mapToMlKitLangCode(languageCode);
      console.log(`🗑️ 删除语言包: ${languageCode} → ML Kit: ${mlKitCode}`);
      
      const result = await this.nativeModule.removeLanguagePack(mlKitCode);
      if (result) {
        // ✅ 删除时使用 ML Kit 码
        const { translationModeManager } = await import('./translationModeManager');
        await translationModeManager.removeDownloadedLanguagePack(mlKitCode);
      }
      return result;
    }
    return false;
  }

  async preDownloadBasicLanguagePacks(): Promise<void> {
    const basicLanguages = ['en', 'zh-CN', 'ja', 'ko'];
    const { translationModeManager } = await import('./translationModeManager');

    for (const lang of basicLanguages) {
      const mlKitCode = mapToMlKitLangCode(lang);
      const downloaded = await this.isLanguageDownloaded(lang);
      if (!downloaded) {
        const result = await this.downloadLanguagePack(lang);
        if (result) {
          // ✅ 使用 ML Kit 码
          await translationModeManager.addDownloadedLanguagePack(mlKitCode);
        }
      }
    }
  }

  async detectLanguage(text: string): Promise<{ language: string; confidence: number }> {
    if (this.nativeModule?.detectLanguage) {
      try {
        const result = await this.nativeModule.detectLanguage(text);
        return {
          language: result.language,
          confidence: result.confidence ?? 0.95,
        };
      } catch (err) {
        console.warn('[MLKitTranslationService] detectLanguage failed, using fallback:', err);
      }
    }

    // fallback: 简单正则检测
    if (/[\u4e00-\u9fff]/.test(text)) return { language: 'zh-CN', confidence: 0.8 };
    if (/[\u3040-\u30ff]/.test(text)) return { language: 'ja', confidence: 0.8 };
    if (/[\uac00-\ud7af]/.test(text)) return { language: 'ko', confidence: 0.8 };
    if (/[\u0400-\u04FF]/.test(text)) return { language: 'ru', confidence: 0.8 };
    if (/[\u0600-\u06FF]/.test(text)) return { language: 'ar', confidence: 0.8 };

    // 默认英文
    return { language: 'en', confidence: 0.5 };
  }

  async translateText(text: string, sourceLang: string, targetLang: string): Promise<TranslationResult> {
    if (!this.nativeModule?.translate) {
      throw new Error('ML Kit 翻译模块未初始化。请确认应用已正确编译并安装了原生模块。');
    }

    try {
      // ✅ 转换为 ML Kit 语言码
      const mlKitSourceLang = mapToMlKitLangCode(sourceLang);
      const mlKitTargetLang = mapToMlKitLangCode(targetLang);
      
      console.log(`🔄 翻译: ${sourceLang}(${mlKitSourceLang}) → ${targetLang}(${mlKitTargetLang})`);
      
      const result = await this.nativeModule.translate(text, mlKitSourceLang, mlKitTargetLang);
      
      if (!result || !result.translatedText) {
        throw new Error('ML Kit 翻译返回空结果');
      }
      
      return {
        translatedText: result.translatedText,
        sourceLanguage: sourceLang,
        targetLanguage: targetLang,
      };
    } catch (err) {
      console.error('[MLKitTranslationService] translate failed:', err);
      
      // 提供详细的错误信息
      if (err instanceof Error) {
        throw new Error(`ML Kit 翻译失败：${err.message}`);
      }
      
      throw new Error('ML Kit 翻译失败，未知错误');
    }
  }

  async recognizeText(imagePath: string): Promise<{
    success: boolean;
    texts: Array<{
      text: string;
      confidence: number;
      bbox?: {
        x0: number;
        y0: number;
        x1: number;
        y1: number;
      };
    }>;
    error?: string;
  }> {
    if (!this.nativeModule?.recognizeText) {
      return {
        success: false,
        texts: [],
        error: 'ML Kit OCR 模块未初始化。请确认应用已正确编译并安装了原生模块。',
      };
    }

    try {
      const result = await this.nativeModule.recognizeText(imagePath);
      
      if (!result) {
        return {
          success: false,
          texts: [],
          error: 'ML Kit OCR 返回空结果',
        };
      }
      
      return {
        success: result.success,
        texts: result.texts || [],
        error: result.error,
      };
    } catch (err) {
      console.error('[MLKitTranslationService] recognizeText failed:', err);
      
      let errorMessage = 'OCR 识别失败';
      
      if (err instanceof Error) {
        if (err.message.includes('not available') || err.message.includes('not found')) {
          errorMessage = 'OCR 服务不可用。请确认已安装 Google Play Services。';
        } else if (err.message.includes('image') || err.message.includes('file')) {
          errorMessage = '图片加载失败。请检查图片路径是否正确。';
        } else {
          errorMessage = `OCR 识别失败：${err.message}`;
        }
      }
      
      return {
        success: false,
        texts: [],
        error: errorMessage,
      };
    }
  }

  // ❌ 已移除模拟翻译功能
  // 如果需要翻译，请确保：
  // 1. 应用已重新编译（包含原生模块）
  // 2. 设备已安装 Google Play Services
  // 3. 已在设置中下载对应的语言包
}

// 单例
export const mlKitTranslationService = new MLKitTranslationService();

// 新的导出对象 - 按照要求的结构
export const mlKitTranslation = {
  // ✅ 新增
  async isLanguageDownloaded(languageCode: string): Promise<boolean> {
    try {
      const { MLKitTranslationModule } = NativeModules;
      return await MLKitTranslationModule.isLanguageDownloaded(languageCode);
    } catch (e) {
      console.error("isLanguageDownloaded 调用失败:", e);
      return false;
    }
  },

  // 其他方法可以继续添加...
  async downloadLanguagePack(languageCode: string): Promise<boolean> {
    return await mlKitTranslationService.downloadLanguagePack(languageCode);
  },

  async removeLanguagePack(languageCode: string): Promise<boolean> {
    return await mlKitTranslationService.removeLanguagePack(languageCode);
  },
};

// 独立的导出函数 - 使用 mlKitTranslation 对象
export const isLanguageDownloaded = async (languageCode: string): Promise<boolean> => {
  return await mlKitTranslation.isLanguageDownloaded(languageCode);
};