// 离线翻译服务 - 基于 ML Kit 和本地词典
import { mlKitTranslationService } from './mlKitTranslationService';
import { mapToMlKitLangCode } from '@/utils/mlKitLanguageMapper';

interface OfflineTranslationResult {
  translatedText: string;
  confidence: number;
  sourceLanguage: string;
  targetLanguage: string;
  success: boolean;
  originalText: string;
  error?: string;
}

// ❌ 已移除本地词典功能
// 现在完全依赖 ML Kit 进行离线翻译，不再使用降级方案

class OfflineTranslationService {
  private downloadedLanguagePacks: Set<string> = new Set();
  private initialized: boolean = false;

  constructor() {
    // ✅ 修改任务 3: 不在构造函数中调用异步方法
    // 需要在 App 启动时显式调用 initialize()
  }

  // ✅ 公开的初始化方法（在 App 启动时调用）
  public async initialize() {
    if (this.initialized) {
      console.log('📱 离线翻译服务已初始化，跳过');
      return;
    }
    
    await this.loadDownloadedLanguagePacks();
    this.initialized = true;
  }

  // 加载已下载的语言包
  private async loadDownloadedLanguagePacks() {
    try {
      // ✅ 从 translationModeManager 获取真实的语言包状态
      const { translationModeManager } = await import('./translationModeManager');
      
      // 等待 translationModeManager 初始化
      await translationModeManager.init();
      
      // 获取已下载的语言包列表
      const downloadedPacks = translationModeManager.getDownloadedLanguagePacks();
      
      // 同步到本地 Set
      this.downloadedLanguagePacks.clear();
      downloadedPacks.forEach(pack => this.downloadedLanguagePacks.add(pack));
      
      console.log('📱 离线翻译服务初始化完成，已下载语言包:', Array.from(this.downloadedLanguagePacks));
    } catch (error) {
      console.warn('⚠️ 从 translationModeManager 加载语言包失败，使用默认语言包:', error);
      
      // 回退到默认语言包
      this.downloadedLanguagePacks.add('zh');
      this.downloadedLanguagePacks.add('en');
      this.downloadedLanguagePacks.add('ja');
      console.log('📱 离线翻译服务使用默认语言包:', Array.from(this.downloadedLanguagePacks));
    }
  }

  // 检查语言包是否已下载
  public hasLanguagePack(languageCode: string): boolean {
    return this.downloadedLanguagePacks.has(languageCode);
  }

  // 添加语言包
  public async addLanguagePack(languageCode: string) {
    this.downloadedLanguagePacks.add(languageCode);
    // 同步到 translationModeManager
    const { translationModeManager } = await import('./translationModeManager');
    await translationModeManager.addDownloadedLanguagePack(languageCode);
    console.log(`✅ 添加离线语言包: ${languageCode}`);
  }

  // 移除语言包
  public async removeLanguagePack(languageCode: string) {
    this.downloadedLanguagePacks.delete(languageCode);
    // 同步到 translationModeManager
    const { translationModeManager } = await import('./translationModeManager');
    await translationModeManager.removeDownloadedLanguagePack(languageCode);
    console.log(`❌ 移除离线语言包: ${languageCode}`);
  }

  // 离线翻译 - 仅使用 ML Kit，不降级
  public async translateOffline(
    text: string,
    fromLanguage: string,
    toLanguage: string
  ): Promise<OfflineTranslationResult> {
    try {
      // ✅ 转换为 ML Kit 语言码
      const mlKitFromLang = mapToMlKitLangCode(fromLanguage);
      const mlKitToLang = mapToMlKitLangCode(toLanguage);
      
      console.log(`📱 离线翻译: "${text}" (${fromLanguage}/${mlKitFromLang} → ${toLanguage}/${mlKitToLang})`);

      // ✅ 修改任务 1: 使用映射后的语言码检查
      const { translationModeManager } = await import('./translationModeManager');
      const canTranslate = await translationModeManager.canTranslate(mlKitFromLang, mlKitToLang);
      
      if (!canTranslate.canTranslate) {
        const errorMessage = canTranslate.reason || '无法进行离线翻译';
        console.log(`❌ 离线翻译检查失败: ${errorMessage}`);
        
        return {
          translatedText: '',
          confidence: 0,
          sourceLanguage: fromLanguage,
          targetLanguage: toLanguage,
          success: false,
          originalText: text,
          error: `离线翻译失败：${errorMessage}。请在设置中下载对应的语言包。`,
        };
      }

      // ✅ 修改任务 2: 验证 ML Kit 模型文件存在性
      const isModelAvailable = await mlKitTranslationService.isLanguageDownloaded(mlKitToLang);
      if (!isModelAvailable) {
        const errorMsg = `模型未下载或未初始化: ${mlKitFromLang} → ${mlKitToLang}`;
        console.log(`❌ ${errorMsg}`);
        throw new Error(errorMsg);
      }
      console.log(`✅ 模型已验证: ${mlKitFromLang} → ${mlKitToLang}`);

      // 使用 ML Kit 翻译（mlKitTranslationService 内部会再次映射，保证正确）
      console.log('🤖 使用 ML Kit 翻译...');
      const mlKitResult = await mlKitTranslationService.translateText(text, fromLanguage, toLanguage);
      
      if (mlKitResult.translatedText && mlKitResult.translatedText.trim()) {
        console.log(`✅ ML Kit 翻译成功: ${mlKitResult.translatedText}`);
        return {
          translatedText: mlKitResult.translatedText,
          confidence: 0.9,
          sourceLanguage: mlKitResult.sourceLanguage,
          targetLanguage: mlKitResult.targetLanguage,
          success: true,
          originalText: text,
        };
      }
      
      // ML Kit 返回空结果
      throw new Error('ML Kit 翻译返回空结果');

    } catch (error) {
      console.error('❌ 离线翻译失败:', error);
      
      // 提供友好的错误信息
      let errorMessage = '离线翻译失败';
      
      if (error instanceof Error) {
        if (error.message.includes('not available') || error.message.includes('not found')) {
          errorMessage = '离线翻译服务不可用。请确认已安装 Google Play Services 并下载了对应语言包。';
        } else if (error.message.includes('language pack') || error.message.includes('model')) {
          errorMessage = '语言包未下载或已损坏。请在设置中重新下载语言包。';
        } else if (error.message.includes('network') || error.message.includes('timeout')) {
          errorMessage = '语言包下载失败。请检查网络连接后重试。';
        } else {
          errorMessage = `离线翻译失败：${error.message}`;
        }
      }
      
      return {
        translatedText: '',
        confidence: 0,
        sourceLanguage: fromLanguage,
        targetLanguage: toLanguage,
        success: false,
        originalText: text,
        error: errorMessage,
      };
    }
  }

  // 获取支持的语言对
  public getSupportedLanguagePairs(): string[] {
    return [];
  }

  // 获取已下载的语言包
  public getDownloadedLanguagePacks(): string[] {
    return Array.from(this.downloadedLanguagePacks);
  }

  // 简单的中文检测
  private isChineseText(text: string): boolean {
    return /[\u4e00-\u9fff]/.test(text);
  }

  // 简单的日文检测
  private isJapaneseText(text: string): boolean {
    return /[\u3040-\u309f\u30a0-\u30ff]/.test(text);
  }
}

export const offlineTranslationService = new OfflineTranslationService();
