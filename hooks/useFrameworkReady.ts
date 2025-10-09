import { mlKitTranslationService } from '@/services/mlKitTranslationService';
import { translationModeManager } from '@/services/translationModeManager';
import { useEffect } from 'react';

declare global {
  interface Window {
    frameworkReady?: () => void;
  }
}

export function useFrameworkReady() {
  useEffect(() => {
    // 初始化翻译模式管理器
    translationModeManager.init()
      .then(async () => {
        // 预下载基本语言包
        await mlKitTranslationService.preDownloadBasicLanguagePacks();
        console.log('✅ ML Kit 语言包预下载完成');
      })
      .catch(error => {
        console.error('❌ 翻译模式管理器初始化失败:', error);
      });

    if (typeof window !== 'undefined') {
      window.frameworkReady?.();
    }
  }, []);
}
