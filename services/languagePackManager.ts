// 语言包管理器 - 管理离线翻译语言包的下载和删除
import {
  getAllLanguagePackInfos,
  isOfflineTranslationSupported,
  LANGUAGE_PACK_STORAGE_KEY,
  LanguagePackInfo,
  mapToMlKitLangCode
} from '@/utils/mlKitLanguageMapper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { translationModeManager } from './translationModeManager';

class LanguagePackManager {
  private downloadQueue: Map<string, Promise<void>> = new Map();

  // 获取语言包状态
  async getLanguagePackStatus(languageCode: string): Promise<'已下载' | '未下载'> {
    try {
      const { isLanguageDownloaded } = await import('./mlKitTranslationService');
      const isDownloaded = await isLanguageDownloaded(languageCode);
      return isDownloaded ? '已下载' : '未下载';
    } catch (error) {
      console.warn(`检查语言包 ${languageCode} 状态失败:`, error);
      // 如果检查失败，使用本地存储的状态作为备用
      const downloadedPacks = await this.getDownloadedLanguagePacks();
      return downloadedPacks.includes(languageCode) ? '已下载' : '未下载';
    }
  }

  // 获取所有可用的语言包信息
  async getAvailableLanguagePacks(): Promise<LanguagePackInfo[]> {
    try {
      const allPacks = getAllLanguagePackInfos();
      
      // 优先使用本地存储检查下载状态
      const downloadedPacks = await this.getDownloadedLanguagePacks();
      
      const packsWithStatus = await Promise.all(
        allPacks.map(async (pack) => {
          try {
            // 首先检查本地存储状态
            const isDownloadedLocal = downloadedPacks.includes(pack.languageCode);
            
            // 如果本地显示已下载，则使用本地状态
            if (isDownloadedLocal) {
              return {
                ...pack,
                isDownloaded: true,
              };
            }
            
            // 如果本地显示未下载，尝试使用 ML Kit 检查（作为备用）
            const { mlKitTranslationService } = await import('./mlKitTranslationService');
            const isDownloadedNative = await mlKitTranslationService.isLanguageDownloaded(pack.languageCode);
            
            return {
              ...pack,
              isDownloaded: isDownloadedNative,
            };
          } catch (error) {
            console.warn(`检查语言包 ${pack.languageCode} 状态失败:`, error);
            // 如果检查失败，使用本地存储的状态
            return {
              ...pack,
              isDownloaded: downloadedPacks.includes(pack.languageCode),
            };
          }
        })
      );
      
      return packsWithStatus;
    } catch (error) {
      console.error('获取语言包列表失败:', error);
      return [];
    }
  }

  // 下载语言包
  async downloadLanguagePack(
    languageCode: string,
    onProgress?: (progress: number) => void
  ): Promise<void> {
    if (this.downloadQueue.has(languageCode)) {
      return this.downloadQueue.get(languageCode);
    }

    const downloadPromise = this.performDownload(languageCode, onProgress);
    this.downloadQueue.set(languageCode, downloadPromise);
    
    try {
      await downloadPromise;
    } finally {
      this.downloadQueue.delete(languageCode);
    }
  }

  // 执行下载
  private async performDownload(
    languageCode: string,
    onProgress?: (progress: number) => void
  ): Promise<void> {
    try {
      // ✅ 转换为 ML Kit 语言码
      const mlKitCode = mapToMlKitLangCode(languageCode);
      console.log(`🔄 开始真正下载 ${languageCode} 语言包（ML Kit: ${mlKitCode}）`);
      
      // 检查是否支持离线翻译
      if (!isOfflineTranslationSupported(languageCode, languageCode)) {
        throw new Error('该语言不支持离线翻译');
      }

      // ✅ 真正调用 ML Kit 原生模块下载
      const { mlKitTranslationService } = await import('./mlKitTranslationService');
      
      // 模拟进度更新（因为 ML Kit 不提供下载进度回调）
      const progressInterval = setInterval(() => {
        const randomProgress = Math.floor(Math.random() * 30) + 10;
        onProgress?.(Math.min(randomProgress, 90));
      }, 300);
      
      try {
        // 真正的下载调用（mlKitTranslationService 内部会再次映射，但不影响）
        const downloadSuccess = await mlKitTranslationService.downloadLanguagePack(languageCode);
        
        clearInterval(progressInterval);
        onProgress?.(100);
        
        if (!downloadSuccess) {
          throw new Error('语言包下载失败');
        }
        
        // ✅ 添加到已下载列表（使用 ML Kit 码）
        await this.addToDownloadedList(mlKitCode);
        
        // ✅ 通知翻译模式管理器（使用 ML Kit 码）
        await translationModeManager.addDownloadedLanguagePack(mlKitCode);
        
        // ✅ 通知离线翻译服务（使用 ML Kit 码）
        const { offlineTranslationService } = await import('./offlineTranslationService');
        await offlineTranslationService.addLanguagePack(mlKitCode);
        
        console.log(`✅ ${languageCode} 语言包真正下载完成（存储为 ${mlKitCode}）`);
      } finally {
        clearInterval(progressInterval);
      }
    } catch (error) {
      console.error('下载语言包失败:', error);
      throw error;
    }
  }

  // 删除语言包
  async removeLanguagePack(languageCode: string): Promise<void> {
    try {
      // ✅ 转换为 ML Kit 语言码
      const mlKitCode = mapToMlKitLangCode(languageCode);
      console.log(`🔄 开始删除 ${languageCode} 语言包（ML Kit: ${mlKitCode}）`);
      
      // ✅ 从已下载列表中移除（使用 ML Kit 码）
      await this.removeFromDownloadedList(mlKitCode);
      
      // ✅ 通知翻译模式管理器（使用 ML Kit 码）
      await translationModeManager.removeDownloadedLanguagePack(mlKitCode);
      
      // ✅ 通知离线翻译服务（使用 ML Kit 码）
      const { offlineTranslationService } = await import('./offlineTranslationService');
      await offlineTranslationService.removeLanguagePack(mlKitCode);
      
      // ✅ 通知 ML Kit 翻译服务（内部会再次映射）
      const { mlKitTranslationService } = await import('./mlKitTranslationService');
      await mlKitTranslationService.removeLanguagePack(languageCode);
      
      console.log(`✅ ${languageCode} 语言包已删除`);
    } catch (error) {
      console.error('删除语言包失败:', error);
      throw error;
    }
  }

  // 检查语言包是否已下载
  async isLanguagePackDownloaded(languageCode: string): Promise<boolean> {
    try {
      // ✅ 调用原生 MLKit 检查
      const { mlKitTranslationService } = await import('./mlKitTranslationService');
      const isDownloadedNative = await mlKitTranslationService.isLanguageDownloaded(languageCode);

      // 本地存储的下载列表（双重校验）
      const downloadedPacks = await this.getDownloadedLanguagePacks();

      return isDownloadedNative && downloadedPacks.includes(languageCode);
    } catch (error) {
      console.error('检查语言包状态失败:', error);
      return false;
    }
  }

  // 获取已下载的语言包列表
  private async getDownloadedLanguagePacks(): Promise<string[]> {
    try {
      const saved = await AsyncStorage.getItem(LANGUAGE_PACK_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error('获取已下载语言包失败:', error);
      return [];
    }
  }

  // 添加到已下载列表
  private async addToDownloadedList(languageCode: string): Promise<void> {
    try {
      const downloadedPacks = await this.getDownloadedLanguagePacks();
      if (!downloadedPacks.includes(languageCode)) {
        downloadedPacks.push(languageCode);
        await AsyncStorage.setItem(LANGUAGE_PACK_STORAGE_KEY, JSON.stringify(downloadedPacks));
      }
    } catch (error) {
      console.error('添加语言包到已下载列表失败:', error);
    }
  }

  // 从已下载列表移除
  private async removeFromDownloadedList(languageCode: string): Promise<void> {
    try {
      const downloadedPacks = await this.getDownloadedLanguagePacks();
      const filteredPacks = downloadedPacks.filter(code => code !== languageCode);
      await AsyncStorage.setItem(LANGUAGE_PACK_STORAGE_KEY, JSON.stringify(filteredPacks));
    } catch (error) {
      console.error('从已下载列表移除语言包失败:', error);
    }
  }

  // 检查翻译对是否支持离线翻译
  async canTranslateOffline(fromLang: string, toLang: string): Promise<boolean> {
    if (!isOfflineTranslationSupported(fromLang, toLang)) {
      return false;
    }
    
    const downloadedPacks = await this.getDownloadedLanguagePacks();
    return downloadedPacks.includes(fromLang) && downloadedPacks.includes(toLang);
  }

  // 获取已下载语言包的总大小
  async getDownloadedLanguagePacksSize(): Promise<number> {
    try {
      const downloadedPacks = await this.getDownloadedLanguagePacks();
      const allPacks = getAllLanguagePackInfos();
      
      console.log(`🔍 已下载语言包: [${downloadedPacks.join(', ')}]`);
      
      const total = downloadedPacks.reduce((total, langCode) => {
        const pack = allPacks.find(p => p.languageCode === langCode);
        const size = pack?.size || 0;
        console.log(`  ${langCode}: ${size} MB`);
        return total + size;
      }, 0);
      
      console.log(`📊 总大小计算: ${total} MB`);
      return total;
    } catch (error) {
      console.error('计算语言包总大小失败:', error);
      return 0;
    }
  }
}

export const languagePackManager = new LanguagePackManager();
