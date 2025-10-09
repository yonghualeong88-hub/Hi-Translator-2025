// 统一翻译服务 - 自动切换在线/离线翻译
import { languagePackManager } from './languagePackManager';
import { translationModeManager } from './translationModeManager';

interface TranslationResult {
  translatedText: string;
  mode: 'online' | 'offline';
  error?: string;
}

interface TranslationOptions {
  fromLang: string;
  toLang: string;
  text: string;
  onProgress?: (progress: number) => void;
}

class UnifiedTranslationService {
  // 翻译文本
  async translateText(options: TranslationOptions): Promise<TranslationResult> {
    const { fromLang, toLang, text } = options;
    
    try {
      // 检查是否可以翻译
      const canTranslateResult = await translationModeManager.canTranslate(fromLang, toLang);
      
      if (!canTranslateResult.canTranslate) {
        return {
          translatedText: '',
          mode: canTranslateResult.mode,
          error: canTranslateResult.reason || '翻译失败',
        };
      }

      const actualMode = canTranslateResult.mode;
      
      if (actualMode === 'online') {
        return await this.translateOnline(options);
      } else {
        return await this.translateOffline(options);
      }
    } catch (error) {
      console.error('翻译失败:', error);
      return {
        translatedText: '',
        mode: 'online',
        error: error instanceof Error ? error.message : '翻译失败',
      };
    }
  }

  // 在线翻译
  private async translateOnline(options: TranslationOptions): Promise<TranslationResult> {
    const { fromLang, toLang, text } = options;
    
    try {
      console.log('🌐 使用在线翻译');
      
      // 使用现有的翻译服务API
      const { API_CONFIG } = await import('@/config/environment');
      
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/translate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          texts: [text],
          sourceLanguage: fromLang,
          targetLanguage: toLang,
          format: 'text',
          model: 'nmt'
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('在线翻译API错误:', errorText);
        throw new Error(`在线翻译服务不可用: ${response.status}`);
      }

      const data = await response.json();
      
      return {
        translatedText: data.translatedText || '',
        mode: 'online',
      };
    } catch (error) {
      console.error('在线翻译失败:', error);
      throw error;
    }
  }

  // 离线翻译
  private async translateOffline(options: TranslationOptions): Promise<TranslationResult> {
    const { fromLang, toLang, text } = options;
    
    try {
      console.log('📱 使用离线翻译');
      
      // 导入离线翻译服务
      const { offlineTranslationService } = await import('./offlineTranslationService');
      
      // 调用真正的离线翻译服务
      const result = await offlineTranslationService.translateOffline(text, fromLang, toLang);
      
      if (!result.success) {
        throw new Error(result.translatedText || '离线翻译失败');
      }
      
      return {
        translatedText: result.translatedText,
        mode: 'offline',
      };
    } catch (error) {
      console.error('离线翻译失败:', error);
      throw error;
    }
  }

  // 获取翻译模式状态
  getTranslationModeState() {
    return translationModeManager.getCurrentState();
  }

  // 设置翻译模式
  async setTranslationMode(mode: 'online' | 'offline' | 'auto') {
    await translationModeManager.setMode(mode);
  }

  // 检查是否可以翻译
  async canTranslate(fromLang: string, toLang: string): Promise<{
    canTranslate: boolean;
    mode: 'online' | 'offline';
    reason?: string;
  }> {
    return await translationModeManager.canTranslate(fromLang, toLang);
  }

  // 获取已下载的语言包
  getDownloadedLanguagePacks(): string[] {
    return translationModeManager.getDownloadedLanguagePacks();
  }

  // 下载语言包
  async downloadLanguagePack(
    languageCode: string,
    onProgress?: (progress: number) => void
  ): Promise<void> {
    return await languagePackManager.downloadLanguagePack(languageCode, onProgress);
  }

  // 删除语言包
  async removeLanguagePack(languageCode: string): Promise<void> {
    return await languagePackManager.removeLanguagePack(languageCode);
  }

  // 获取可用的语言包列表
  async getAvailableLanguagePacks() {
    return await languagePackManager.getAvailableLanguagePacks();
  }
}

export const unifiedTranslationService = new UnifiedTranslationService();
